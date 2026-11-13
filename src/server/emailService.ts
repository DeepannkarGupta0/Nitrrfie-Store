export interface ConfirmationEmailParams {
  toEmail: string;
  unsubscribeUrl: string;
}

export interface BrevoContactSyncParams {
  email: string;
  emailBlacklisted?: boolean;
  attributes?: Record<string, string | number | boolean>;
}

export interface BrevoContactSyncResult {
  ok: boolean;
  created?: boolean;
  contactId?: number | string;
  httpStatus?: number;
  brevoCode?: string;
  contactsScopeMissing?: boolean;
  authorizedIpRestricted?: boolean;
  code?: 'EMAIL_PROVIDER_NOT_CONFIGURED' | 'BREVO_CONTACTS_FAILED';
  reason?: string;
  error?: string;
}

export interface EmailDeliveryResult {
  ok: boolean;
  messageId?: string;
  httpStatus?: number;
  brevoCode?: string;
  authorizedIpRestricted?: boolean;
  code?: 'EMAIL_PROVIDER_NOT_CONFIGURED' | 'EMAIL_DELIVERY_FAILED';
  reason?: string;
  error?: string;
}

export type ContactSyncFn = (params: BrevoContactSyncParams) => Promise<BrevoContactSyncResult>;
export type EmailSenderFn = (params: ConfirmationEmailParams) => Promise<EmailDeliveryResult>;

export interface BrevoConfigCheck {
  configured: boolean;
  apiKey?: string;
  senderEmail?: string;
  senderName?: string;
  listId?: number;
  reason?:
    | 'missing_api_key'
    | 'missing_sender_email'
    | 'invalid_sender_email'
    | 'smtp_relay_key_used';
  error?: string;
}

const SIMPLE_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function checkBrevoConfiguration(): BrevoConfigCheck {
  const apiKey = process.env.BREVO_API_KEY?.trim() || '';
  const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim() || '';
  const senderName = process.env.BREVO_SENDER_NAME?.trim() || 'NIT Raipur Store';
  const rawListId = process.env.BREVO_LIST_ID?.trim();
  const parsedListId =
    rawListId && /^\d+$/.test(rawListId) && Number(rawListId) > 0
      ? Number(rawListId)
      : undefined;

  if (!apiKey) {
    return {
      configured: false,
      reason: 'missing_api_key',
      error: 'Newsletter subscriptions are temporarily unavailable while email delivery is being configured.',
    };
  }

  if (apiKey.startsWith('xsmtpsib-')) {
    return {
      configured: false,
      reason: 'smtp_relay_key_used',
      error: 'Newsletter subscriptions are temporarily unavailable due to an email configuration issue.',
    };
  }

  if (!senderEmail) {
    return {
      configured: false,
      reason: 'missing_sender_email',
      error: 'Newsletter subscriptions are temporarily unavailable while email delivery is being configured.',
    };
  }

  if (!SIMPLE_EMAIL_REGEX.test(senderEmail)) {
    return {
      configured: false,
      reason: 'invalid_sender_email',
      error: 'Newsletter subscriptions are temporarily unavailable due to an email configuration issue.',
    };
  }

  return {
    configured: true,
    apiKey,
    senderEmail,
    senderName,
    ...(parsedListId ? { listId: parsedListId } : {}),
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeBrevoSnippet(rawText: string): string {
  return rawText
    .replace(/xkeysib-[a-zA-Z0-9_-]+/g, '[REDACTED_KEY]')
    .replace(/xsmtpsib-[a-zA-Z0-9_-]+/g, '[REDACTED_KEY]')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 240);
}

function parseJsonSafe(rawText: string): Record<string, any> {
  if (!rawText) return {};
  try {
    const parsed = JSON.parse(rawText);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function isAuthorizedIpRestriction(status: number, message?: string): boolean {
  if (status !== 401 && status !== 403) return false;
  const lowerMsg = (message || '').toLowerCase();
  return (
    lowerMsg.includes('unrecognised ip') ||
    lowerMsg.includes('unrecognized ip') ||
    lowerMsg.includes('authorised_ips') ||
    lowerMsg.includes('authorized_ips') ||
    (lowerMsg.includes('ip') && lowerMsg.includes('not allowed'))
  );
}

export function diagnoseBrevoFailure(
  endpoint: 'contacts' | 'smtp_email',
  status: number,
  code?: string,
  message?: string
): string {
  const lowerMsg = (message || '').toLowerCase();
  const scopeLabel =
    endpoint === 'contacts' ? 'Contacts API' : 'Transactional Email API';

  if (isAuthorizedIpRestriction(status, message)) {
    return `Brevo ${scopeLabel} rejected HTTP ${status} due to Authorized IPs security restriction.`;
  }

  if (status === 401) {
    return `Brevo ${scopeLabel} authentication failed (401). Verify BREVO_API_KEY is a valid active v3 key.`;
  }

  if (status === 403) {
    if (lowerMsg.includes('not activated') || lowerMsg.includes('activate')) {
      return `Brevo ${scopeLabel} rejected HTTP 403 because the Brevo account is not yet activated.`;
    }
    if (lowerMsg.includes('permission') || code === 'permission_denied' || lowerMsg.includes('scope')) {
      return `Brevo ${scopeLabel} rejected HTTP 403 due to missing API key permissions.`;
    }
    return `Brevo ${scopeLabel} rejected HTTP 403 (permissions, Authorized IPs, or sender verification).`;
  }

  if (status === 400 && (lowerMsg.includes('sender') || lowerMsg.includes('verified'))) {
    return 'Brevo rejected the sender address (400). Verify BREVO_SENDER_EMAIL under Senders & Domains.';
  }

  if (status === 429) {
    return `Brevo ${scopeLabel} rate limit reached (429).`;
  }

  return `Brevo ${scopeLabel} returned HTTP ${status}${code ? ` (${code})` : ''}.`;
}

export function buildConfirmationEmailContent(unsubscribeUrl: string) {
  const subject = 'Thank You for Subscribing!';

  const textContent = [
    'Welcome to NIT Raipur Store,',
    '',
    'Thank you for subscribing to our official updates list!',
    '',
    "You're officially in. We'll keep you updated on new merchandise drops, upcoming releases, restocks, and exclusive campus updates from NIT Raipur Store.",
    '',
    'Regards,',
    'NIT Raipur Store Team',
    '',
    '---',
    `You received this welcome email because you subscribed on NIT Raipur Store. To unsubscribe anytime, visit: ${unsubscribeUrl}`,
  ].join('\n');

  const safeUnsubUrl = escapeHtml(unsubscribeUrl);
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:#fafaf9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#18181b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:#ffffff;border:1px solid #e4e4e7;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="padding:24px 28px;border-bottom:1px solid #e4e4e7;background-color:#09090b;color:#fafaf9;">
              <span style="font-size:16px;font-weight:700;letter-spacing:-0.01em;">NIT Raipur Store</span>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;font-size:15px;line-height:1.65;color:#27272a;">
              <p style="margin:0 0 12px;font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#be2d09;">Welcome</p>
              <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;font-weight:600;color:#09090b;">You're officially in.</h1>
              <p style="margin:0 0 16px;">Thanks for subscribing to NIT Raipur Store. We'll keep you updated on new arrivals, upcoming releases, restocks and exclusive campus updates.</p>
              <p style="margin:0 0 24px;">We're glad to have you with us.</p>
              <p style="margin:0;color:#52525b;">Regards,<br /><strong style="color:#09090b;">NIT Raipur Store Team</strong></p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px;background-color:#fafaf9;border-top:1px solid #e4e4e7;font-size:12px;line-height:1.5;color:#71717a;">
              You are receiving this welcome email because you subscribed to NIT Raipur Store updates.
              <a href="${safeUnsubUrl}" style="color:#be2d09;text-decoration:underline;">Unsubscribe</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, textContent, htmlContent };
}

export async function syncContactWithBrevo(
  params: BrevoContactSyncParams,
  fetchImpl: typeof fetch = fetch
): Promise<BrevoContactSyncResult> {
  const config = checkBrevoConfiguration();
  if (!config.configured || !config.apiKey) {
    return {
      ok: false,
      code: 'EMAIL_PROVIDER_NOT_CONFIGURED',
      reason: config.reason || 'missing_configuration',
      error: config.error,
    };
  }

  const sendContactRequest = async (includeAttributes: boolean) => {
    const payload: Record<string, unknown> = {
      email: params.email,
      updateEnabled: true,
      emailBlacklisted: Boolean(params.emailBlacklisted),
    };
    if (!params.emailBlacklisted && config.listId) {
      payload.listIds = [config.listId];
    }
    if (includeAttributes) {
      payload.attributes = {
        SOURCE: 'NIT_RAIPUR_STORE',
        ...(params.attributes || {}),
      };
    }

    return fetchImpl('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': config.apiKey!,
        'user-agent': 'NIT-Raipur-Store/1.0',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    });
  };

  try {
    let response = await sendContactRequest(true);
    let rawText = await response.text().catch(() => '');
    let data = parseJsonSafe(rawText);

    // Retry once without custom attributes if Brevo rejects undefined contact attributes
    if (
      response.status === 400 &&
      typeof data?.message === 'string' &&
      /attribute|invalid_parameter/i.test(data.message)
    ) {
      response = await sendContactRequest(false);
      rawText = await response.text().catch(() => '');
      data = parseJsonSafe(rawText);
    }

    if (response.status === 201 || response.status === 204 || response.ok) {
      return {
        ok: true,
        created: response.status === 201,
        contactId: data.id,
        httpStatus: response.status,
      };
    }

    const brevoCode = typeof data?.code === 'string' ? data.code : undefined;
    const rawMsg = typeof data?.message === 'string' ? data.message : sanitizeBrevoSnippet(rawText);
    const lowerRawMsg = rawMsg.toLowerCase();
    const isPermissionScopeOnly =
      response.status === 403 &&
      !lowerRawMsg.includes('not activated') &&
      !lowerRawMsg.includes('activate') &&
      (brevoCode === 'permission_denied' ||
        lowerRawMsg.includes('permission') ||
        lowerRawMsg.includes('scope'));
    const authorizedIpRestricted = isAuthorizedIpRestriction(response.status, rawMsg);

    const reason = diagnoseBrevoFailure(
      'contacts',
      response.status,
      brevoCode,
      rawMsg
    );

    return {
      ok: false,
      httpStatus: response.status,
      brevoCode,
      contactsScopeMissing: isPermissionScopeOnly,
      authorizedIpRestricted,
      code: 'BREVO_CONTACTS_FAILED',
      reason,
      error: 'Unable to complete subscription right now due to an email service issue. Please try again later.',
    };
  } catch (err: any) {
    return {
      ok: false,
      httpStatus: 502,
      code: 'BREVO_CONTACTS_FAILED',
      reason: `Network failure contacting Brevo Contacts API: ${err?.message || 'Unknown error'}`,
      error: 'Unable to complete subscription right now because the email service is unavailable. Please try again later.',
    };
  }
}

export async function sendNewsletterConfirmationViaBrevo(
  params: ConfirmationEmailParams,
  fetchImpl: typeof fetch = fetch
): Promise<EmailDeliveryResult> {
  const config = checkBrevoConfiguration();
  if (!config.configured || !config.apiKey || !config.senderEmail) {
    return {
      ok: false,
      code: 'EMAIL_PROVIDER_NOT_CONFIGURED',
      reason: config.reason || 'missing_configuration',
      error: config.error,
    };
  }

  const { subject, textContent, htmlContent } = buildConfirmationEmailContent(params.unsubscribeUrl);

  try {
    const response = await fetchImpl('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': config.apiKey,
        'user-agent': 'NIT-Raipur-Store/1.0',
      },
      body: JSON.stringify({
        sender: {
          name: config.senderName || 'NIT Raipur Store',
          email: config.senderEmail,
        },
        replyTo: {
          name: config.senderName || 'NIT Raipur Store',
          email: config.senderEmail,
        },
        to: [{ email: params.toEmail }],
        subject,
        textContent,
        htmlContent,
        tags: ['newsletter-welcome'],
      }),
      signal: AbortSignal.timeout(15000),
    });

    const rawText = await response.text().catch(() => '');
    const data = parseJsonSafe(rawText);

    if (!response.ok) {
      const rawMsg =
        typeof data?.message === 'string' ? data.message : sanitizeBrevoSnippet(rawText);
      const reason = diagnoseBrevoFailure(
        'smtp_email',
        response.status,
        data?.code,
        rawMsg
      );

      return {
        ok: false,
        httpStatus: response.status,
        brevoCode: typeof data?.code === 'string' ? data.code : undefined,
        authorizedIpRestricted: isAuthorizedIpRestriction(response.status, rawMsg),
        code: 'EMAIL_DELIVERY_FAILED',
        reason,
        error: 'Unable to complete subscription right now due to an email delivery issue. Please try again later.',
      };
    }

    const messageId = typeof data?.messageId === 'string' ? data.messageId.trim() : '';
    if (!messageId) {
      return {
        ok: false,
        httpStatus: response.status,
        code: 'EMAIL_DELIVERY_FAILED',
        reason: 'Brevo Transactional Email API returned 2xx without a valid messageId.',
        error: 'Unable to verify confirmation email delivery. Please try again later.',
      };
    }

    return {
      ok: true,
      httpStatus: response.status,
      messageId,
    };
  } catch (err: any) {
    return {
      ok: false,
      httpStatus: 502,
      code: 'EMAIL_DELIVERY_FAILED',
      reason: `Network failure contacting Brevo Transactional Email API: ${err?.message || 'Unknown error'}`,
      error: 'Unable to complete subscription right now because the email service is unavailable. Please try again later.',
    };
  }
}
