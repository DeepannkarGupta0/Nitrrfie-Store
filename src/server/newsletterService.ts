import crypto from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import type { NewsletterSubscriber } from '../types/store.ts';
import { runInTransaction } from './db.ts';
import {
  checkBrevoConfiguration,
  sendNewsletterConfirmationViaBrevo,
  syncContactWithBrevo,
  type ContactSyncFn,
  type EmailSenderFn,
} from './emailService.ts';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export class NewsletterServiceError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode = 400, code = 'NEWSLETTER_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export type NewsletterLogStage =
  | 'request_received'
  | 'validation'
  | 'database'
  | 'brevo_contacts'
  | 'brevo_confirmation_email'
  | 'final_status';

export function logNewsletterStage(
  stage: NewsletterLogStage,
  outcome: 'ok' | 'rejected' | 'error' | 'info',
  details: Record<string, unknown> = {}
) {
  const safePayload = {
    stage,
    outcome,
    timestamp: new Date().toISOString(),
    ...details,
  };
  console.info(`[Newsletter] ${JSON.stringify(safePayload)}`);
}

// Per-database, per-email async lock to serialize concurrent submissions for the same address
const dbEmailLocks = new WeakMap<DatabaseSync, Map<string, Promise<unknown>>>();

async function withDatabaseEmailLock<T>(
  db: DatabaseSync,
  email: string,
  fn: () => Promise<T>
): Promise<T> {
  let lockMap = dbEmailLocks.get(db);
  if (!lockMap) {
    lockMap = new Map();
    dbEmailLocks.set(db, lockMap);
  }

  const prev = lockMap.get(email) || Promise.resolve();
  let releaseCurrent!: () => void;
  const currentDone = new Promise<void>((resolve) => {
    releaseCurrent = resolve;
  });

  const tail = prev.catch(() => undefined).then(() => currentDone);
  lockMap.set(email, tail);

  await prev.catch(() => undefined);
  try {
    return await fn();
  } finally {
    releaseCurrent();
    if (lockMap.get(email) === tail) {
      lockMap.delete(email);
    }
  }
}

interface RawSubscriberRow {
  id: string;
  email: string;
  status: 'active' | 'unsubscribed';
  consent_given: number;
  consent_source: string;
  unsubscribe_token: string;
  confirmation_email_status: 'pending' | 'sent' | 'failed';
  confirmation_message_id: string | null;
  confirmation_sent_at: string | null;
  confirmed_at: string | null;
  brevo_contact_synced: number;
  brevo_contact_synced_at: string | null;
  subscribed_at: string;
  unsubscribed_at: string | null;
  updated_at: string;
}

function mapSubscriberRow(row: RawSubscriberRow): NewsletterSubscriber {
  return {
    id: row.id,
    email: row.email,
    status: row.status,
    consentGiven: row.consent_given === 1,
    consentSource: row.consent_source,
    confirmationEmailStatus: row.confirmation_email_status,
    confirmationSentAt: row.confirmation_sent_at,
    confirmedAt: row.confirmed_at ?? row.confirmation_sent_at,
    brevoContactSynced: Number(row.brevo_contact_synced || 0) === 1,
    brevoContactSyncedAt: row.brevo_contact_synced_at ?? null,
    subscribedAt: row.subscribed_at,
    unsubscribedAt: row.unsubscribed_at,
    updatedAt: row.updated_at,
  };
}

export function normalizeNewsletterEmail(email: string): string {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

export function isValidNewsletterEmail(email: string): boolean {
  const clean = normalizeNewsletterEmail(email);
  return Boolean(clean && clean.length <= 254 && EMAIL_REGEX.test(clean));
}

function maskEmailForLog(email: string): string {
  const atIdx = email.indexOf('@');
  if (atIdx <= 1) return '***';
  const local = email.slice(0, atIdx);
  const domain = email.slice(atIdx + 1);
  return `${local.slice(0, 2)}***@${domain}`;
}

export type EmailDeliveryStatus = 'sent' | 'failed' | 'already_sent';

export interface SubscribeResult {
  status: 'subscribed' | 'already_subscribed';
  subscriber: NewsletterSubscriber;
  confirmationEmailSent: boolean;
  emailDeliveryStatus: EmailDeliveryStatus;
  emailError?: string;
  message: string;
}

export async function subscribeToNewsletter(
  db: DatabaseSync,
  rawEmail: string,
  options: {
    baseUrl: string;
    consentSource?: string;
    syncContact?: ContactSyncFn;
    sendConfirmation?: EmailSenderFn;
  }
): Promise<SubscribeResult> {
  const consentSource = options.consentSource || 'newsletter_form';
  logNewsletterStage('request_received', 'info', { action: 'subscribe', consentSource });

  const email = normalizeNewsletterEmail(rawEmail);
  if (!email) {
    logNewsletterStage('validation', 'rejected', { reason: 'empty_email', httpStatus: 400 });
    logNewsletterStage('final_status', 'rejected', { httpStatus: 400, code: 'EMPTY_EMAIL' });
    throw new NewsletterServiceError(
      'Please enter your email address.',
      400,
      'EMPTY_EMAIL'
    );
  }

  if (!isValidNewsletterEmail(email)) {
    logNewsletterStage('validation', 'rejected', { reason: 'invalid_email_format', httpStatus: 400 });
    logNewsletterStage('final_status', 'rejected', { httpStatus: 400, code: 'INVALID_EMAIL' });
    throw new NewsletterServiceError(
      'Please enter a valid email address (e.g., name@nitrr.ac.in).',
      400,
      'INVALID_EMAIL'
    );
  }

  const maskedEmail = maskEmailForLog(email);
  logNewsletterStage('validation', 'ok', { email: maskedEmail });

  const usesDefaultProvider = !options.syncContact && !options.sendConfirmation;
  if (usesDefaultProvider) {
    const configCheck = checkBrevoConfiguration();
    if (!configCheck.configured) {
      logNewsletterStage('brevo_contacts', 'error', {
        httpStatus: 500,
        reason: configCheck.reason,
      });
      logNewsletterStage('final_status', 'error', {
        httpStatus: 500,
        code: 'EMAIL_PROVIDER_NOT_CONFIGURED',
      });
      throw new NewsletterServiceError(
        configCheck.error ||
          'Newsletter subscriptions are temporarily unavailable due to server configuration.',
        500,
        'EMAIL_PROVIDER_NOT_CONFIGURED'
      );
    }
  }

  const syncContact = options.syncContact || syncContactWithBrevo;
  const sendEmail = options.sendConfirmation || sendNewsletterConfirmationViaBrevo;
  const cleanBaseUrl = options.baseUrl.replace(/\/+$/, '');

  return withDatabaseEmailLock(db, email, async () => {
    let existing: RawSubscriberRow | undefined;
    let isReactivation = false;
    let subscriberId = '';
    let unsubscribeToken = '';

    try {
      const prepResult = runInTransaction(db, () => {
        const found = db
          .prepare(`SELECT * FROM newsletter_subscribers WHERE email = ? LIMIT 1`)
          .get(email) as RawSubscriberRow | undefined;

        if (found && found.status === 'active') {
          return { alreadyActive: true as const, found };
        }

        const now = new Date().toISOString();
        if (found && found.status === 'unsubscribed') {
          db.prepare(
            `UPDATE newsletter_subscribers
             SET status = 'active',
                 consent_given = 1,
                 consent_source = ?,
                 confirmation_email_status = 'pending',
                 unsubscribed_at = NULL,
                 subscribed_at = ?,
                 updated_at = ?
             WHERE id = ?`
          ).run(consentSource, now, now, found.id);

          return {
            alreadyActive: false as const,
            isReactivation: true,
            previous: found,
            subscriberId: found.id,
            unsubscribeToken: found.unsubscribe_token,
          };
        }

        const nextId = `sub_${crypto.randomUUID()}`;
        const nextToken = crypto.randomBytes(24).toString('hex');

        db.prepare(
          `INSERT INTO newsletter_subscribers (
             id, email, status, consent_given, consent_source, unsubscribe_token,
             confirmation_email_status, confirmation_message_id, confirmation_sent_at,
             confirmed_at, brevo_contact_synced, brevo_contact_synced_at,
             subscribed_at, unsubscribed_at, updated_at
           ) VALUES (?, ?, 'active', 1, ?, ?, 'pending', NULL, NULL, NULL, 0, NULL, ?, NULL, ?)`
        ).run(nextId, email, consentSource, nextToken, now, now);

        return {
          alreadyActive: false as const,
          isReactivation: false,
          previous: undefined,
          subscriberId: nextId,
          unsubscribeToken: nextToken,
        };
      });

      if (prepResult.alreadyActive) {
        const found = prepResult.found;
        logNewsletterStage('database', 'ok', {
          email: maskedEmail,
          action: 'already_subscribed',
          priorEmailStatus: found.confirmation_email_status,
        });

        // Never send a duplicate welcome email if it was already sent successfully
        if (found.confirmation_email_status === 'sent') {
          let latestRow = found;
          if (!found.brevo_contact_synced) {
            const syncRes = await syncContact({
              email,
              emailBlacklisted: false,
              attributes: { SOURCE: found.consent_source.toUpperCase() },
            });
            if (syncRes.ok) {
              const now = new Date().toISOString();
              db.prepare(
                `UPDATE newsletter_subscribers
                 SET brevo_contact_synced = 1, brevo_contact_synced_at = ?, updated_at = ?
                 WHERE id = ?`
              ).run(now, now, found.id);
              latestRow = db
                .prepare(`SELECT * FROM newsletter_subscribers WHERE id = ? LIMIT 1`)
                .get(found.id) as unknown as RawSubscriberRow;
            }
          }

          logNewsletterStage('final_status', 'ok', {
            httpStatus: 200,
            status: 'already_subscribed',
            emailDeliveryStatus: 'already_sent',
          });
          return {
            status: 'already_subscribed',
            subscriber: mapSubscriberRow(latestRow),
            confirmationEmailSent: false,
            emailDeliveryStatus: 'already_sent',
            message: 'This email is already subscribed to NIT Raipur Store updates.',
          };
        }

        // Previous welcome email was never sent ('pending' or 'failed') — retry once cleanly without duplicating subscriber
        let syncedNow = Number(found.brevo_contact_synced || 0) === 1;
        if (!syncedNow) {
          const contactRetry = await syncContact({
            email,
            emailBlacklisted: false,
            attributes: { SOURCE: found.consent_source.toUpperCase() },
          });
          if (contactRetry.ok) {
            syncedNow = true;
            logNewsletterStage('brevo_contacts', 'ok', {
              email: maskedEmail,
              upstreamStatus: contactRetry.httpStatus ?? 201,
              retryForExisting: true,
            });
          } else {
            logNewsletterStage(
              'brevo_contacts',
              contactRetry.authorizedIpRestricted ? 'info' : 'error',
              {
                email: maskedEmail,
                retryForExisting: true,
                upstreamStatus: contactRetry.httpStatus ?? null,
                brevoCode: contactRetry.brevoCode ?? null,
                authorizedIpRestricted: Boolean(contactRetry.authorizedIpRestricted),
                ...(contactRetry.authorizedIpRestricted ? { deferred: true } : {}),
                reason: contactRetry.reason || 'contacts_sync_failed',
              }
            );
          }
        }

        const existingUnsubUrl = `${cleanBaseUrl}/unsubscribe?token=${encodeURIComponent(
          found.unsubscribe_token
        )}`;
        const retryDelivery = await sendEmail({
          toEmail: email,
          unsubscribeUrl: existingUnsubUrl,
        });

        const now = new Date().toISOString();
        if (retryDelivery.ok) {
          db.prepare(
            `UPDATE newsletter_subscribers
             SET confirmation_email_status = 'sent',
                 confirmation_message_id = ?,
                 confirmation_sent_at = ?,
                 confirmed_at = ?,
                 brevo_contact_synced = ?,
                 brevo_contact_synced_at = COALESCE(brevo_contact_synced_at, ?),
                 updated_at = ?
             WHERE id = ?`
          ).run(
            retryDelivery.messageId || null,
            now,
            now,
            syncedNow ? 1 : 0,
            syncedNow ? now : null,
            now,
            found.id
          );

          const updatedExisting = db
            .prepare(`SELECT * FROM newsletter_subscribers WHERE id = ? LIMIT 1`)
            .get(found.id) as unknown as RawSubscriberRow;

          logNewsletterStage('brevo_confirmation_email', 'ok', {
            email: maskedEmail,
            retryForExisting: true,
            upstreamStatus: retryDelivery.httpStatus ?? 201,
            hasMessageId: Boolean(retryDelivery.messageId),
          });
          logNewsletterStage('final_status', 'ok', {
            httpStatus: 200,
            status: 'already_subscribed',
            confirmationEmailSent: true,
            emailDeliveryStatus: 'sent',
          });

          return {
            status: 'already_subscribed',
            subscriber: mapSubscriberRow(updatedExisting),
            confirmationEmailSent: true,
            emailDeliveryStatus: 'sent',
            message: 'You are subscribed and your welcome email is on its way.',
          };
        }

        const nextEmailStatus = retryDelivery.authorizedIpRestricted ? 'pending' : 'failed';
        db.prepare(
          `UPDATE newsletter_subscribers
           SET confirmation_email_status = ?,
               brevo_contact_synced = ?,
               brevo_contact_synced_at = COALESCE(brevo_contact_synced_at, ?),
               updated_at = ?
           WHERE id = ?`
        ).run(nextEmailStatus, syncedNow ? 1 : 0, syncedNow ? now : null, now, found.id);

        const updatedExisting = db
          .prepare(`SELECT * FROM newsletter_subscribers WHERE id = ? LIMIT 1`)
          .get(found.id) as unknown as RawSubscriberRow;

        logNewsletterStage(
          'brevo_confirmation_email',
          retryDelivery.authorizedIpRestricted ? 'info' : 'error',
          {
            email: maskedEmail,
            retryForExisting: true,
            upstreamStatus: retryDelivery.httpStatus ?? null,
            brevoCode: retryDelivery.brevoCode ?? null,
            authorizedIpRestricted: Boolean(retryDelivery.authorizedIpRestricted),
            ...(retryDelivery.authorizedIpRestricted ? { deferred: true } : {}),
            reason: retryDelivery.reason || 'confirmation_email_failed',
          }
        );
        logNewsletterStage(
          'final_status',
          retryDelivery.authorizedIpRestricted ? 'info' : 'error',
          {
            httpStatus: 200,
            status: 'already_subscribed',
            confirmationEmailSent: false,
            emailDeliveryStatus: 'failed',
            ...(retryDelivery.authorizedIpRestricted ? { deferred: true } : {}),
          }
        );

        return {
          status: 'already_subscribed',
          subscriber: mapSubscriberRow(updatedExisting),
          confirmationEmailSent: false,
          emailDeliveryStatus: 'failed',
          emailError: 'Welcome email could not be sent right now.',
          message: 'Your subscription is saved, though the welcome email could not be sent right now.',
        };
      }

      existing = prepResult.previous;
      isReactivation = prepResult.isReactivation;
      subscriberId = prepResult.subscriberId;
      unsubscribeToken = prepResult.unsubscribeToken;

      logNewsletterStage('database', 'ok', {
        email: maskedEmail,
        action: isReactivation ? 'pending_reactivation' : 'pending_insert',
      });
    } catch (dbErr: any) {
      if (dbErr instanceof NewsletterServiceError) {
        throw dbErr;
      }
      logNewsletterStage('database', 'error', {
        email: maskedEmail,
        httpStatus: 500,
        reason: dbErr?.message ? String(dbErr.message).slice(0, 160) : 'sqlite_error',
      });
      logNewsletterStage('final_status', 'error', {
        httpStatus: 500,
        code: 'DATABASE_ERROR',
      });
      throw new NewsletterServiceError(
        'Unable to save your subscription right now due to a server database error. Please try again later.',
        500,
        'DATABASE_ERROR'
      );
    }

    const rollbackPending = () => {
      try {
        runInTransaction(db, () => {
          if (isReactivation && existing) {
            db.prepare(
              `UPDATE newsletter_subscribers
               SET status = ?,
                   consent_given = ?,
                   consent_source = ?,
                   confirmation_email_status = ?,
                   confirmation_message_id = ?,
                   confirmation_sent_at = ?,
                   confirmed_at = ?,
                   brevo_contact_synced = ?,
                   brevo_contact_synced_at = ?,
                   unsubscribed_at = ?,
                   subscribed_at = ?,
                   updated_at = ?
               WHERE id = ?`
            ).run(
              existing.status,
              existing.consent_given,
              existing.consent_source,
              existing.confirmation_email_status,
              existing.confirmation_message_id,
              existing.confirmation_sent_at,
              existing.confirmed_at,
              existing.brevo_contact_synced,
              existing.brevo_contact_synced_at,
              existing.unsubscribed_at,
              existing.subscribed_at,
              existing.updated_at,
              existing.id
            );
          } else {
            db.prepare(`DELETE FROM newsletter_subscribers WHERE id = ?`).run(subscriberId);
          }
        });
      } catch {
        // best-effort rollback
      }
    };

    // Stage 4: Sync contact in Brevo Contacts API
    const contactSync = await syncContact({
      email,
      emailBlacklisted: false,
      attributes: {
        SOURCE: consentSource.toUpperCase(),
      },
    });

    let brevoContactSynced = false;
    if (contactSync.ok) {
      brevoContactSynced = true;
      logNewsletterStage('brevo_contacts', 'ok', {
        email: maskedEmail,
        upstreamStatus: contactSync.httpStatus ?? 201,
        created: Boolean(contactSync.created),
      });
    } else if (contactSync.contactsScopeMissing) {
      brevoContactSynced = false;
      logNewsletterStage('brevo_contacts', 'info', {
        email: maskedEmail,
        upstreamStatus: contactSync.httpStatus ?? 403,
        brevoCode: contactSync.brevoCode ?? 'permission_denied',
        reason:
          'BREVO_API_KEY lacks Contacts permission; continuing with local DB storage and Transactional Email confirmation.',
      });
    } else if (contactSync.authorizedIpRestricted) {
      brevoContactSynced = false;
      logNewsletterStage('brevo_contacts', 'info', {
        email: maskedEmail,
        upstreamStatus: contactSync.httpStatus ?? 401,
        brevoCode: contactSync.brevoCode ?? 'unauthorized',
        authorizedIpRestricted: true,
        deferred: true,
        reason:
          'Brevo Contacts API blocked dynamic server IP (Authorized IPs security setting); continuing with local DB storage and confirmation email attempt.',
      });
    } else {
      rollbackPending();
      const mappedStatus = contactSync.code === 'EMAIL_PROVIDER_NOT_CONFIGURED' ? 500 : 502;
      logNewsletterStage('brevo_contacts', 'error', {
        email: maskedEmail,
        upstreamStatus: contactSync.httpStatus ?? null,
        brevoCode: contactSync.brevoCode ?? null,
        reason: contactSync.reason || 'contacts_sync_failed',
      });
      logNewsletterStage('final_status', 'error', {
        httpStatus: mappedStatus,
        code: contactSync.code || 'BREVO_CONTACTS_FAILED',
      });
      throw new NewsletterServiceError(
        contactSync.error || 'Unable to complete subscription right now. Please try again later.',
        mappedStatus,
        contactSync.code || 'BREVO_CONTACTS_FAILED'
      );
    }

    // Stage 5: Send confirmation email via Brevo Transactional Email API
    const unsubscribeUrl = `${cleanBaseUrl}/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`;

    const delivery = await sendEmail({
      toEmail: email,
      unsubscribeUrl,
    });

    let confirmationEmailSent = true;
    if (!delivery.ok) {
      if (delivery.authorizedIpRestricted) {
        confirmationEmailSent = false;
        logNewsletterStage('brevo_confirmation_email', 'info', {
          email: maskedEmail,
          upstreamStatus: delivery.httpStatus ?? 401,
          brevoCode: delivery.brevoCode ?? 'unauthorized',
          authorizedIpRestricted: true,
          deferred: true,
          reason:
            'Brevo Transactional Email API blocked dynamic server IP (Authorized IPs security setting); keeping subscriber active in local DB with pending confirmation email.',
        });
      } else {
        rollbackPending();
        const mappedStatus = delivery.code === 'EMAIL_PROVIDER_NOT_CONFIGURED' ? 500 : 502;
        logNewsletterStage('brevo_confirmation_email', 'error', {
          email: maskedEmail,
          upstreamStatus: delivery.httpStatus ?? null,
          brevoCode: delivery.brevoCode ?? null,
          reason: delivery.reason || 'confirmation_email_failed',
        });
        logNewsletterStage('final_status', 'error', {
          httpStatus: mappedStatus,
          code: delivery.code || 'EMAIL_DELIVERY_FAILED',
        });
        throw new NewsletterServiceError(
          delivery.error || 'Failed to send confirmation email. Please try again later.',
          mappedStatus,
          delivery.code || 'EMAIL_DELIVERY_FAILED'
        );
      }
    } else {
      logNewsletterStage('brevo_confirmation_email', 'ok', {
        email: maskedEmail,
        upstreamStatus: delivery.httpStatus ?? 201,
        hasMessageId: Boolean(delivery.messageId),
      });
    }

    // Stage 6: Finalize active state in database
    try {
      const sentAt = new Date().toISOString();
      const updated = runInTransaction(db, () => {
        db.prepare(
          `UPDATE newsletter_subscribers
           SET confirmation_email_status = ?,
               confirmation_message_id = ?,
               confirmation_sent_at = ?,
               confirmed_at = ?,
               brevo_contact_synced = ?,
               brevo_contact_synced_at = ?,
               updated_at = ?
           WHERE id = ?`
        ).run(
          confirmationEmailSent ? 'sent' : 'pending',
          confirmationEmailSent ? delivery.messageId || null : null,
          confirmationEmailSent ? sentAt : null,
          confirmationEmailSent ? sentAt : null,
          brevoContactSynced ? 1 : 0,
          brevoContactSynced ? sentAt : null,
          sentAt,
          subscriberId
        );

        return db
          .prepare(`SELECT * FROM newsletter_subscribers WHERE id = ? LIMIT 1`)
          .get(subscriberId) as unknown as RawSubscriberRow;
      });

      const emailDeliveryStatus: EmailDeliveryStatus = confirmationEmailSent ? 'sent' : 'failed';

      logNewsletterStage('final_status', confirmationEmailSent ? 'ok' : 'info', {
        httpStatus: 201,
        status: 'subscribed',
        confirmationEmailSent,
        emailDeliveryStatus,
        ...(!confirmationEmailSent ? { deferred: true } : {}),
        reactivated: isReactivation,
      });

      return {
        status: 'subscribed',
        subscriber: mapSubscriberRow(updated),
        confirmationEmailSent,
        emailDeliveryStatus,
        ...(confirmationEmailSent
          ? {}
          : { emailError: 'Welcome email could not be sent right now.' }),
        message: confirmationEmailSent
          ? 'Your subscription is confirmed and your welcome email is on its way.'
          : 'Your subscription is saved, though the welcome email could not be sent right now.',
      };
    } catch (finalizeErr: any) {
      rollbackPending();
      logNewsletterStage('database', 'error', {
        email: maskedEmail,
        httpStatus: 500,
        reason: finalizeErr?.message ? String(finalizeErr.message).slice(0, 160) : 'finalize_error',
      });
      logNewsletterStage('final_status', 'error', {
        httpStatus: 500,
        code: 'DATABASE_ERROR',
      });
      throw new NewsletterServiceError(
        'Unable to finalize your subscription right now. Please try again later.',
        500,
        'DATABASE_ERROR'
      );
    }
  });
}

export function unsubscribeFromNewsletter(
  db: DatabaseSync,
  params: { token?: string; email?: string }
): { unsubscribed: boolean; alreadyUnsubscribed: boolean; email?: string; message: string } {
  const token = typeof params.token === 'string' ? params.token.trim() : '';
  const email = normalizeNewsletterEmail(params.email || '');

  let row: RawSubscriberRow | undefined;
  if (token) {
    row = db
      .prepare(`SELECT * FROM newsletter_subscribers WHERE unsubscribe_token = ? LIMIT 1`)
      .get(token) as RawSubscriberRow | undefined;
  } else if (email) {
    if (!isValidNewsletterEmail(email)) {
      throw new NewsletterServiceError('Please enter a valid email address.', 400, 'INVALID_EMAIL');
    }
    row = db
      .prepare(`SELECT * FROM newsletter_subscribers WHERE email = ? LIMIT 1`)
      .get(email) as RawSubscriberRow | undefined;
  } else {
    throw new NewsletterServiceError(
      'An unsubscribe token or email address is required.',
      400,
      'MISSING_UNSUBSCRIBE_IDENTIFIER'
    );
  }

  if (!row) {
    if (token) {
      throw new NewsletterServiceError(
        'This unsubscribe link is invalid or has expired.',
        404,
        'SUBSCRIBER_NOT_FOUND'
      );
    }
    return {
      unsubscribed: false,
      alreadyUnsubscribed: true,
      message: 'If this email was subscribed, it will no longer receive newsletter updates.',
    };
  }

  if (row.status === 'unsubscribed') {
    return {
      unsubscribed: true,
      alreadyUnsubscribed: true,
      email: row.email,
      message: 'You are already unsubscribed from NIT Raipur Store newsletter updates.',
    };
  }

  const now = new Date().toISOString();
  db.prepare(
    `UPDATE newsletter_subscribers
     SET status = 'unsubscribed',
         unsubscribed_at = ?,
         updated_at = ?
     WHERE id = ?`
  ).run(now, now, row.id);

  logNewsletterStage('final_status', 'ok', {
    action: 'unsubscribe',
    email: maskEmailForLog(row.email),
    httpStatus: 200,
  });

  return {
    unsubscribed: true,
    alreadyUnsubscribed: false,
    email: row.email,
    message: 'You have been unsubscribed and will no longer receive newsletter updates.',
  };
}

export function listNewsletterSubscribers(
  db: DatabaseSync,
  filters: { search?: string; status?: 'all' | 'active' | 'unsubscribed' } = {}
): {
  subscribers: NewsletterSubscriber[];
  counts: { total: number; active: number; unsubscribed: number };
} {
  const countsRow = db
    .prepare(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active,
         SUM(CASE WHEN status = 'unsubscribed' THEN 1 ELSE 0 END) AS unsubscribed
       FROM newsletter_subscribers`
    )
    .get() as { total: number; active: number | null; unsubscribed: number | null };

  const conditions: string[] = [];
  const args: string[] = [];

  if (filters.status === 'active' || filters.status === 'unsubscribed') {
    conditions.push('status = ?');
    args.push(filters.status);
  }

  const q = typeof filters.search === 'string' ? filters.search.trim().toLowerCase() : '';
  if (q) {
    conditions.push('LOWER(email) LIKE ?');
    args.push(`%${q}%`);
  }

  const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const rows = db
    .prepare(
      `SELECT * FROM newsletter_subscribers
       ${whereSql}
       ORDER BY datetime(subscribed_at) DESC, rowid DESC`
    )
    .all(...args) as unknown as RawSubscriberRow[];

  return {
    subscribers: rows.map(mapSubscriberRow),
    counts: {
      total: Number(countsRow?.total || 0),
      active: Number(countsRow?.active || 0),
      unsubscribed: Number(countsRow?.unsubscribed || 0),
    },
  };
}

export function updateNewsletterSubscriberStatus(
  db: DatabaseSync,
  id: string,
  status: 'active' | 'unsubscribed'
): NewsletterSubscriber {
  const existing = db
    .prepare(`SELECT * FROM newsletter_subscribers WHERE id = ? LIMIT 1`)
    .get(id) as RawSubscriberRow | undefined;

  if (!existing) {
    throw new NewsletterServiceError('Subscriber record not found.', 404, 'SUBSCRIBER_NOT_FOUND');
  }

  const now = new Date().toISOString();
  const unsubscribedAt = status === 'unsubscribed' ? now : null;

  db.prepare(
    `UPDATE newsletter_subscribers
     SET status = ?,
         unsubscribed_at = ?,
         updated_at = ?
     WHERE id = ?`
  ).run(status, unsubscribedAt, now, id);

  const updated = db
    .prepare(`SELECT * FROM newsletter_subscribers WHERE id = ? LIMIT 1`)
    .get(id) as unknown as RawSubscriberRow;

  return mapSubscriberRow(updated);
}

export function deleteNewsletterSubscriber(db: DatabaseSync, id: string): boolean {
  const result = db.prepare(`DELETE FROM newsletter_subscribers WHERE id = ?`).run(id);
  return Number(result.changes || 0) > 0;
}
