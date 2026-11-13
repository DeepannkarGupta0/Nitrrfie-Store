import type { ApiRequest, ApiResponse } from './types.ts';
import {
  setSecurityHeaders,
  validateOrigin,
  enforceRateLimit,
  hasAdminPermission,
  verifyAdminSessionAsync,
} from './middleware.ts';
import { getStoreDatabase } from '../server/db.ts';
import { bumpAdminVersion, recordAuditLog } from '../server/adminEvents.ts';
import { checkBrevoConfiguration, syncContactWithBrevo } from '../server/emailService.ts';
import {
  NewsletterServiceError,
  deleteNewsletterSubscriber,
  listNewsletterSubscribers,
  subscribeToNewsletter,
  unsubscribeFromNewsletter,
  updateNewsletterSubscriberStatus,
} from '../server/newsletterService.ts';

function parseJsonBody(req: ApiRequest): Record<string, any> {
  let body: any = req.body;
  if (typeof body === 'string') {
    const trimmed = body.trim();
    body = trimmed ? JSON.parse(trimmed) : {};
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return {};
  }
  return body;
}

function getSubPath(req: ApiRequest): string {
  const url = (req as any).originalUrl || (req as any).url || '';
  const cleanUrl = url.split('?')[0].replace(/\/+$/, '');
  const idx = cleanUrl.indexOf('/api/newsletter');
  if (idx === -1) return cleanUrl;
  return cleanUrl.slice(idx + '/api/newsletter'.length);
}

function resolveRequestBaseUrl(req: ApiRequest): string {
  const configured = process.env.APP_PUBLIC_URL?.trim() || process.env.APP_URL?.trim();
  if (configured) return configured.replace(/\/+$/, '');

  const origin = req.headers['origin'];
  if (typeof origin === 'string' && /^https?:\/\//i.test(origin)) {
    return origin.replace(/\/+$/, '');
  }

  const forwardedHost = req.headers['x-forwarded-host'];
  const host =
    typeof forwardedHost === 'string' && forwardedHost.trim()
      ? forwardedHost.split(',')[0].trim()
      : req.headers['host'];
  const proto =
    typeof req.headers['x-forwarded-proto'] === 'string'
      ? req.headers['x-forwarded-proto'].split(',')[0].trim()
      : 'http';

  if (typeof host === 'string' && host.trim()) {
    return `${proto}://${host.trim()}`;
  }

  return 'http://localhost:3000';
}

function sendErrorJson(
  res: ApiResponse,
  statusCode: number,
  message: string,
  code?: string
) {
  return res.status(statusCode).json({
    success: false,
    ...(code ? { code } : {}),
    message,
    error: message,
  });
}

export async function handleNewsletterOperations(req: ApiRequest, res: ApiResponse) {
  setSecurityHeaders(res);

  const method = req.method?.toUpperCase() || 'GET';
  if (method === 'OPTIONS') {
    return res.status(204).json({ success: true, message: 'OK' });
  }

  if (!validateOrigin(req, res)) return;
  if (!enforceRateLimit(req, res, 40)) return;

  const subPath = getSubPath(req);

  try {
    const db = getStoreDatabase();

    // ------------------------------------------------------------------------
    // 1. POST /api/newsletter/subscribe - Public newsletter subscription
    // ------------------------------------------------------------------------
    if (subPath === '/subscribe' && method === 'POST') {
      let body: Record<string, any>;
      try {
        body = parseJsonBody(req);
      } catch {
        return sendErrorJson(res, 400, 'Malformed JSON payload.', 'MALFORMED_JSON');
      }

      const result = await subscribeToNewsletter(db, String(body?.email ?? ''), {
        baseUrl: resolveRequestBaseUrl(req),
        consentSource: 'newsletter_form',
      });

      bumpAdminVersion(db, 'newsletter_subscribed', result.subscriber.email, result.subscriber.id);

      const statusCode = result.status === 'already_subscribed' ? 200 : 201;
      return res.status(statusCode).json({
        success: true,
        status: result.status,
        email: result.subscriber.email,
        confirmationEmailSent: result.confirmationEmailSent,
        emailDeliveryStatus: result.emailDeliveryStatus,
        ...(result.emailError ? { emailError: result.emailError } : {}),
        message: result.message,
      });
    }

    // ------------------------------------------------------------------------
    // 2. POST /api/newsletter/unsubscribe - Public self-service unsubscribe
    // ------------------------------------------------------------------------
    if (subPath === '/unsubscribe' && method === 'POST') {
      let body: Record<string, any>;
      try {
        body = parseJsonBody(req);
      } catch {
        return sendErrorJson(res, 400, 'Malformed JSON payload.', 'MALFORMED_JSON');
      }

      const result = unsubscribeFromNewsletter(db, {
        token: typeof body?.token === 'string' ? body.token : undefined,
        email: typeof body?.email === 'string' ? body.email : undefined,
      });

      // Best-effort sync of unsubscribe status to Brevo Contacts without blocking DB unsubscribe
      if (result.unsubscribed && result.email && checkBrevoConfiguration().configured) {
        await syncContactWithBrevo({
          email: result.email,
          emailBlacklisted: true,
        }).catch(() => undefined);
      }

      if (result.unsubscribed) {
        bumpAdminVersion(db, 'newsletter_unsubscribed', result.email || 'subscriber');
      }

      return res.status(200).json({
        success: true,
        unsubscribed: result.unsubscribed,
        alreadyUnsubscribed: result.alreadyUnsubscribed,
        message: result.message,
      });
    }

    // ------------------------------------------------------------------------
    // 3. ADMIN ROUTES - Strictly restricted to authorized staff/admins
    // ------------------------------------------------------------------------
    const adminAuth = await verifyAdminSessionAsync(req);
    if (!adminAuth.authorized || !adminAuth.identity) {
      return sendErrorJson(
        res,
        adminAuth.statusCode || 401,
        adminAuth.error || 'Administrative authorization required.',
        adminAuth.statusCode === 403 ? 'FORBIDDEN' : 'UNAUTHORIZED'
      );
    }

    if (!hasAdminPermission(adminAuth, 'manageNewsletter')) {
      return sendErrorJson(
        res,
        403,
        'Forbidden: Your administrative role does not allow managing newsletter subscribers.',
        'FORBIDDEN'
      );
    }

    const actorEmail = adminAuth.identity.email || 'system';

    if (subPath === '/subscribers' && method === 'GET') {
      const statusParam = typeof req.query?.status === 'string' ? req.query.status : 'all';
      const statusFilter =
        statusParam === 'active' || statusParam === 'unsubscribed' ? statusParam : 'all';
      const search = typeof req.query?.q === 'string' ? req.query.q : '';

      const payload = listNewsletterSubscribers(db, {
        search,
        status: statusFilter,
      });

      return res.status(200).json({
        success: true,
        message: 'Subscribers loaded successfully.',
        ...payload,
      });
    }

    if (subPath.startsWith('/subscribers/')) {
      const id = decodeURIComponent(subPath.slice('/subscribers/'.length));
      if (!id) {
        return sendErrorJson(res, 400, 'Subscriber ID is required.', 'MISSING_ID');
      }

      if (method === 'PATCH') {
        let body: Record<string, any>;
        try {
          body = parseJsonBody(req);
        } catch {
          return sendErrorJson(res, 400, 'Malformed JSON payload.', 'MALFORMED_JSON');
        }

        const nextStatus = body?.status;
        if (nextStatus !== 'active' && nextStatus !== 'unsubscribed') {
          return sendErrorJson(
            res,
            400,
            'Status must be "active" or "unsubscribed".',
            'INVALID_STATUS'
          );
        }

        const updated = updateNewsletterSubscriberStatus(db, id, nextStatus);
        recordAuditLog(db, {
          officerEmail: actorEmail,
          action: 'NEWSLETTER_UPDATED',
          targetId: updated.email,
          details: `Marked newsletter subscriber ${updated.email} as ${nextStatus}.`,
        });
        bumpAdminVersion(db, 'newsletter_updated', actorEmail, updated.id);
        return res.status(200).json({
          success: true,
          message: 'Subscriber status updated.',
          subscriber: updated,
        });
      }

      if (method === 'DELETE') {
        const deleted = deleteNewsletterSubscriber(db, id);
        if (!deleted) {
          return sendErrorJson(res, 404, 'Subscriber record not found.', 'SUBSCRIBER_NOT_FOUND');
        }
        recordAuditLog(db, {
          officerEmail: actorEmail,
          action: 'NEWSLETTER_DELETED',
          targetId: id,
          details: `Deleted newsletter subscriber record ${id}.`,
        });
        bumpAdminVersion(db, 'newsletter_deleted', actorEmail, id);
        return res.status(200).json({
          success: true,
          message: 'Subscriber record removed.',
          deletedId: id,
        });
      }
    }

    return sendErrorJson(
      res,
      404,
      `Unsupported newsletter endpoint: ${method} ${subPath || '/'}`,
      'NOT_FOUND'
    );
  } catch (err) {
    if (err instanceof NewsletterServiceError) {
      return sendErrorJson(res, err.statusCode, err.message, err.code);
    }
    console.error('[Newsletter API] Unexpected error:', err instanceof Error ? err.message : 'Unknown error');
    return sendErrorJson(
      res,
      500,
      'Unexpected server error processing newsletter request.',
      'INTERNAL_SERVER_ERROR'
    );
  }
}
