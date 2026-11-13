import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createStoreDatabase, initializeSchema } from './db.ts';
import {
  subscribeToNewsletter,
  unsubscribeFromNewsletter,
  listNewsletterSubscribers,
  updateNewsletterSubscriberStatus,
  deleteNewsletterSubscriber,
  NewsletterServiceError,
} from './newsletterService.ts';
import {
  sendNewsletterConfirmationViaBrevo,
  syncContactWithBrevo,
} from './emailService.ts';
import { handleNewsletterOperations } from '../api/newsletter.ts';
import { setCustomerTokenVerifierForTest, validateOrigin } from '../api/middleware.ts';
import { apiSubscribeNewsletter } from '../api/client.ts';

function createMockRes() {
  const headers: Record<string, string> = {};
  let statusCode = 200;
  let jsonBody: any = null;

  const res: any = {
    setHeader(name: string, value: string) {
      headers[name.toLowerCase()] = value;
    },
    status(code: number) {
      statusCode = code;
      return res;
    },
    json(payload: any) {
      jsonBody = payload;
      return res;
    },
    getStatus: () => statusCode,
    getJson: () => jsonBody,
    getHeaders: () => headers,
  };
  return res;
}

function createTempDbPath() {
  return path.join(
    os.tmpdir(),
    `nitrr-newsletter-test-${Date.now()}-${Math.random().toString(36).slice(2)}.db`
  );
}

test('Scenario 1: Valid new email subscription syncs Brevo contact, sends confirmation email, stores active DB record, and returns HTTP 201', async () => {
  const tmpDbPath = createTempDbPath();
  const prevDbPath = process.env.STORE_DB_PATH;
  const prevKey = process.env.BREVO_API_KEY;
  const prevSender = process.env.BREVO_SENDER_EMAIL;
  const prevFetch = globalThis.fetch;

  process.env.STORE_DB_PATH = tmpDbPath;
  process.env.BREVO_API_KEY = 'xkeysib-valid-test-key';
  process.env.BREVO_SENDER_EMAIL = 'store@nitrrfie.in';

  const brevoCalls: Array<{ url: string; body: any }> = [];
  globalThis.fetch = (async (url: any, init: any) => {
    const urlStr = String(url);
    const body = JSON.parse(init.body);
    brevoCalls.push({ url: urlStr, body });
    if (urlStr.endsWith('/v3/contacts')) {
      return new Response(JSON.stringify({ id: 42 }), { status: 201 });
    }
    if (urlStr.endsWith('/v3/smtp/email')) {
      return new Response(JSON.stringify({ messageId: '<msg-scenario-1@brevo>' }), { status: 201 });
    }
    throw new Error(`Unexpected URL: ${urlStr}`);
  }) as typeof fetch;

  try {
    const res = createMockRes();
    await handleNewsletterOperations(
      {
        method: 'POST',
        url: '/api/newsletter/subscribe',
        headers: { host: 'localhost:3000', 'x-forwarded-for': '10.0.0.1' },
        body: { email: '  Student.One@NITRR.AC.IN ' },
      } as any,
      res
    );

    assert.equal(res.getStatus(), 201);
    assert.equal(res.getJson().success, true);
    assert.equal(res.getJson().status, 'subscribed');
    assert.equal(res.getJson().email, 'student.one@nitrr.ac.in');
    assert.ok(res.getJson().message);

    assert.equal(brevoCalls.length, 2);
    assert.equal(brevoCalls[0].url, 'https://api.brevo.com/v3/contacts');
    assert.equal(brevoCalls[0].body.email, 'student.one@nitrr.ac.in');
    assert.equal(brevoCalls[0].body.updateEnabled, true);
    assert.equal(brevoCalls[1].url, 'https://api.brevo.com/v3/smtp/email');
    assert.equal(brevoCalls[1].body.subject, 'Thank You for Subscribing!');

    const db = createStoreDatabase(tmpDbPath);
    const list = listNewsletterSubscribers(db);
    assert.equal(list.counts.total, 1);
    assert.equal(list.counts.active, 1);
    assert.equal(list.subscribers[0].confirmationEmailStatus, 'sent');
    assert.equal(list.subscribers[0].brevoContactSynced, true);
    assert.ok(list.subscribers[0].confirmedAt);
    db.close();
  } finally {
    globalThis.fetch = prevFetch;
    if (prevDbPath === undefined) delete process.env.STORE_DB_PATH;
    else process.env.STORE_DB_PATH = prevDbPath;
    if (prevKey === undefined) delete process.env.BREVO_API_KEY;
    else process.env.BREVO_API_KEY = prevKey;
    if (prevSender === undefined) delete process.env.BREVO_SENDER_EMAIL;
    else process.env.BREVO_SENDER_EMAIL = prevSender;
    fs.rmSync(tmpDbPath, { force: true });
  }
});

test('Scenario 2: Already subscribed email returns HTTP 200 without duplicates or repeat email', async () => {
  const tmpDbPath = createTempDbPath();
  const prevDbPath = process.env.STORE_DB_PATH;
  const prevKey = process.env.BREVO_API_KEY;
  const prevSender = process.env.BREVO_SENDER_EMAIL;
  const prevFetch = globalThis.fetch;

  process.env.STORE_DB_PATH = tmpDbPath;
  process.env.BREVO_API_KEY = 'xkeysib-valid-test-key';
  process.env.BREVO_SENDER_EMAIL = 'store@nitrrfie.in';

  let emailSendCount = 0;
  globalThis.fetch = (async (url: any) => {
    if (String(url).endsWith('/v3/contacts')) {
      return new Response(null, { status: 204 });
    }
    emailSendCount += 1;
    return new Response(JSON.stringify({ messageId: '<msg-dup-test>' }), { status: 201 });
  }) as typeof fetch;

  try {
    const firstRes = createMockRes();
    await handleNewsletterOperations(
      {
        method: 'POST',
        url: '/api/newsletter/subscribe',
        headers: { host: 'localhost:3000', 'x-forwarded-for': '10.0.0.2' },
        body: { email: 'alumni@nitrr.ac.in' },
      } as any,
      firstRes
    );
    assert.equal(firstRes.getStatus(), 201);

    const dupRes = createMockRes();
    await handleNewsletterOperations(
      {
        method: 'POST',
        url: '/api/newsletter/subscribe',
        headers: { host: 'localhost:3000', 'x-forwarded-for': '10.0.0.2' },
        body: { email: 'ALUMNI@nitrr.ac.in' },
      } as any,
      dupRes
    );

    assert.equal(dupRes.getStatus(), 200);
    assert.equal(dupRes.getJson().success, true);
    assert.equal(dupRes.getJson().status, 'already_subscribed');
    assert.equal(emailSendCount, 1);

    const db = createStoreDatabase(tmpDbPath);
    assert.equal(listNewsletterSubscribers(db).counts.total, 1);
    db.close();
  } finally {
    globalThis.fetch = prevFetch;
    if (prevDbPath === undefined) delete process.env.STORE_DB_PATH;
    else process.env.STORE_DB_PATH = prevDbPath;
    if (prevKey === undefined) delete process.env.BREVO_API_KEY;
    else process.env.BREVO_API_KEY = prevKey;
    if (prevSender === undefined) delete process.env.BREVO_SENDER_EMAIL;
    else process.env.BREVO_SENDER_EMAIL = prevSender;
    fs.rmSync(tmpDbPath, { force: true });
  }
});

test('Scenarios 3 & 4: Invalid email and empty email return HTTP 400 without DB insert or Brevo calls', async () => {
  const tmpDbPath = createTempDbPath();
  const prevDbPath = process.env.STORE_DB_PATH;
  const prevFetch = globalThis.fetch;

  process.env.STORE_DB_PATH = tmpDbPath;
  let fetchCalled = false;
  globalThis.fetch = (async () => {
    fetchCalled = true;
    return new Response('{}', { status: 200 });
  }) as typeof fetch;

  try {
    const emptyRes = createMockRes();
    await handleNewsletterOperations(
      {
        method: 'POST',
        url: '/api/newsletter/subscribe',
        headers: { host: 'localhost:3000', 'x-forwarded-for': '10.0.0.3' },
        body: { email: '   ' },
      } as any,
      emptyRes
    );
    assert.equal(emptyRes.getStatus(), 400);
    assert.equal(emptyRes.getJson().success, false);
    assert.equal(emptyRes.getJson().code, 'EMPTY_EMAIL');

    const invalidRes = createMockRes();
    await handleNewsletterOperations(
      {
        method: 'POST',
        url: '/api/newsletter/subscribe',
        headers: { host: 'localhost:3000', 'x-forwarded-for': '10.0.0.3' },
        body: { email: 'not-an-email' },
      } as any,
      invalidRes
    );
    assert.equal(invalidRes.getStatus(), 400);
    assert.equal(invalidRes.getJson().success, false);
    assert.equal(invalidRes.getJson().code, 'INVALID_EMAIL');

    assert.equal(fetchCalled, false);
  } finally {
    globalThis.fetch = prevFetch;
    if (prevDbPath === undefined) delete process.env.STORE_DB_PATH;
    else process.env.STORE_DB_PATH = prevDbPath;
    fs.rmSync(tmpDbPath, { force: true });
  }
});

test('Scenario 5: Missing Brevo API key returns HTTP 500 and retains no DB record', async () => {
  const tmpDbPath = createTempDbPath();
  const prevDbPath = process.env.STORE_DB_PATH;
  const prevKey = process.env.BREVO_API_KEY;
  const prevSender = process.env.BREVO_SENDER_EMAIL;

  process.env.STORE_DB_PATH = tmpDbPath;
  delete process.env.BREVO_API_KEY;
  process.env.BREVO_SENDER_EMAIL = 'store@nitrrfie.in';

  try {
    const res = createMockRes();
    await handleNewsletterOperations(
      {
        method: 'POST',
        url: '/api/newsletter/subscribe',
        headers: { host: 'localhost:3000', 'x-forwarded-for': '10.0.0.5' },
        body: { email: 'missing.key@nitrr.ac.in' },
      } as any,
      res
    );

    assert.equal(res.getStatus(), 500);
    assert.equal(res.getJson().success, false);
    assert.equal(res.getJson().code, 'EMAIL_PROVIDER_NOT_CONFIGURED');

    const db = createStoreDatabase(tmpDbPath);
    assert.equal(listNewsletterSubscribers(db).counts.total, 0);
    db.close();
  } finally {
    if (prevDbPath === undefined) delete process.env.STORE_DB_PATH;
    else process.env.STORE_DB_PATH = prevDbPath;
    if (prevKey === undefined) delete process.env.BREVO_API_KEY;
    else process.env.BREVO_API_KEY = prevKey;
    if (prevSender === undefined) delete process.env.BREVO_SENDER_EMAIL;
    else process.env.BREVO_SENDER_EMAIL = prevSender;
    fs.rmSync(tmpDbPath, { force: true });
  }
});

test('Scenarios 6, 7 & 9: Brevo 401, 403, and network outage return HTTP 502, sanitize errors, and roll back DB', async () => {
  const db = createStoreDatabase(':memory:');
  const prevKey = process.env.BREVO_API_KEY;
  const prevSender = process.env.BREVO_SENDER_EMAIL;

  process.env.BREVO_API_KEY = 'xkeysib-secret-should-never-leak';
  process.env.BREVO_SENDER_EMAIL = 'store@nitrrfie.in';

  try {
    // Scenario 6: Invalid key / Authorized IPs (401)
    await assert.rejects(
      () =>
        subscribeToNewsletter(db, 'auth401@nitrr.ac.in', {
          baseUrl: 'https://store.nitrr.ac.in',
          syncContact: (params) =>
            syncContactWithBrevo(
              params,
              (async () =>
                new Response(
                  JSON.stringify({ code: 'unauthorized', message: 'Key xkeysib-secret-should-never-leak unauthorized' }),
                  { status: 401 }
                )) as typeof fetch
            ),
        }),
      (err: any) =>
        err instanceof NewsletterServiceError &&
        err.statusCode === 502 &&
        !err.message.includes('xkeysib-')
    );
    assert.equal(listNewsletterSubscribers(db).counts.total, 0);

    // Scenario 7: Permission failure (403)
    await assert.rejects(
      () =>
        subscribeToNewsletter(db, 'perm403@nitrr.ac.in', {
          baseUrl: 'https://store.nitrr.ac.in',
          syncContact: async () => ({ ok: true, created: true }),
          sendConfirmation: (params) =>
            sendNewsletterConfirmationViaBrevo(
              params,
              (async () =>
                new Response(
                  JSON.stringify({ code: 'permission_denied', message: 'Missing SMTP permission' }),
                  { status: 403 }
                )) as typeof fetch
            ),
        }),
      (err: any) =>
        err instanceof NewsletterServiceError &&
        err.statusCode === 502 &&
        !err.message.includes('SMTP permission')
    );
    assert.equal(listNewsletterSubscribers(db).counts.total, 0);

    // Scenario 9: Brevo API unavailable (network error)
    await assert.rejects(
      () =>
        subscribeToNewsletter(db, 'offline@nitrr.ac.in', {
          baseUrl: 'https://store.nitrr.ac.in',
          syncContact: (params) =>
            syncContactWithBrevo(
              params,
              (async () => {
                throw new Error('ECONNREFUSED api.brevo.com');
              }) as typeof fetch
            ),
        }),
      (err: any) =>
        err instanceof NewsletterServiceError &&
        err.statusCode === 502 &&
        !err.message.includes('ECONNREFUSED')
    );
    assert.equal(listNewsletterSubscribers(db).counts.total, 0);
  } finally {
    if (prevKey === undefined) delete process.env.BREVO_API_KEY;
    else process.env.BREVO_API_KEY = prevKey;
    if (prevSender === undefined) delete process.env.BREVO_SENDER_EMAIL;
    else process.env.BREVO_SENDER_EMAIL = prevSender;
  }
});

test('Scoped SMTP-only Brevo key (Contacts 403 permission_denied) succeeds when confirmation email delivers and rolls back if email fails', async () => {
  const db = createStoreDatabase(':memory:');
  const prevKey = process.env.BREVO_API_KEY;
  const prevSender = process.env.BREVO_SENDER_EMAIL;
  process.env.BREVO_API_KEY = 'xkeysib-smtp-only-key';
  process.env.BREVO_SENDER_EMAIL = 'store@nitrrfie.in';

  try {
    // 1. Contacts 403 + SMTP 403 -> still fails 502 and rolls back DB
    await assert.rejects(
      () =>
        subscribeToNewsletter(db, 'both403@nitrr.ac.in', {
          baseUrl: 'https://store.nitrr.ac.in',
          syncContact: (params) =>
            syncContactWithBrevo(
              params,
              (async () =>
                new Response(
                  JSON.stringify({ code: 'permission_denied', message: 'No contacts permission' }),
                  { status: 403 }
                )) as typeof fetch
            ),
          sendConfirmation: (params) =>
            sendNewsletterConfirmationViaBrevo(
              params,
              (async () =>
                new Response(
                  JSON.stringify({ code: 'permission_denied', message: 'No SMTP permission' }),
                  { status: 403 }
                )) as typeof fetch
            ),
        }),
      (err: any) => err instanceof NewsletterServiceError && err.statusCode === 502
    );
    assert.equal(listNewsletterSubscribers(db).counts.total, 0);

    // 2. Contacts 403 + SMTP 201 -> succeeds and records brevoContactSynced=false accurately
    const res = await subscribeToNewsletter(db, 'smtp.only@nitrr.ac.in', {
      baseUrl: 'https://store.nitrr.ac.in',
      syncContact: (params) =>
        syncContactWithBrevo(
          params,
          (async () =>
            new Response(
              JSON.stringify({ code: 'permission_denied', message: 'No contacts permission' }),
              { status: 403 }
            )) as typeof fetch
        ),
      sendConfirmation: (params) =>
        sendNewsletterConfirmationViaBrevo(
          params,
          (async () =>
            new Response(JSON.stringify({ messageId: '<msg-smtp-only-ok>' }), { status: 201 })) as typeof fetch
        ),
    });

    assert.equal(res.status, 'subscribed');
    assert.equal(res.subscriber.status, 'active');
    assert.equal(res.subscriber.confirmationEmailStatus, 'sent');
    assert.equal(res.subscriber.brevoContactSynced, false);
    assert.equal(listNewsletterSubscribers(db).counts.active, 1);
  } finally {
    if (prevKey === undefined) delete process.env.BREVO_API_KEY;
    else process.env.BREVO_API_KEY = prevKey;
    if (prevSender === undefined) delete process.env.BREVO_SENDER_EMAIL;
    else process.env.BREVO_SENDER_EMAIL = prevSender;
  }
});

test('Scenario 8: Database failure returns sanitized HTTP 500 DATABASE_ERROR', async () => {
  const brokenDb = new DatabaseSync(':memory:');
  brokenDb.close();

  await assert.rejects(
    () =>
      subscribeToNewsletter(brokenDb, 'dbdown@nitrr.ac.in', {
        baseUrl: 'https://store.nitrr.ac.in',
        syncContact: async () => ({ ok: true }),
        sendConfirmation: async () => ({ ok: true, messageId: '<msg-db>' }),
      }),
    (err: any) =>
      err instanceof NewsletterServiceError &&
      err.statusCode === 500 &&
      err.code === 'DATABASE_ERROR'
  );
});

test('Scenario 10: Concurrent duplicate submissions for the same email serialize safely without duplicate records or emails', async () => {
  const db = createStoreDatabase(':memory:');
  let contactCalls = 0;
  let emailCalls = 0;

  const opts = {
    baseUrl: 'https://store.nitrr.ac.in',
    syncContact: async () => {
      contactCalls += 1;
      await new Promise((r) => setTimeout(r, 15));
      return { ok: true, created: true };
    },
    sendConfirmation: async () => {
      emailCalls += 1;
      await new Promise((r) => setTimeout(r, 15));
      return { ok: true, messageId: `<concurrent-${emailCalls}>` };
    },
  };

  const [first, second] = await Promise.all([
    subscribeToNewsletter(db, 'concurrent@nitrr.ac.in', opts),
    subscribeToNewsletter(db, '  CONCURRENT@nitrr.ac.in ', opts),
  ]);

  const statuses = [first.status, second.status].sort();
  assert.deepEqual(statuses, ['already_subscribed', 'subscribed']);
  assert.equal(contactCalls, 1);
  assert.equal(emailCalls, 1);
  assert.equal(listNewsletterSubscribers(db).counts.total, 1);
});

test('Scenarios 11, 12 & 13: Confirmation content, unsubscribe + reactivation, and retry after failure work reliably', async () => {
  const db = createStoreDatabase(':memory:');
  const prevKey = process.env.BREVO_API_KEY;
  const prevSender = process.env.BREVO_SENDER_EMAIL;
  process.env.BREVO_API_KEY = 'xkeysib-test-key';
  process.env.BREVO_SENDER_EMAIL = 'store@nitrrfie.in';

  try {
    // Scenario 13: Failure followed by retry
    await assert.rejects(
      () =>
        subscribeToNewsletter(db, 'retry.user@nitrr.ac.in', {
          baseUrl: 'https://store.nitrr.ac.in',
          syncContact: async () => ({ ok: true }),
          sendConfirmation: async () => ({
            ok: false,
            code: 'EMAIL_DELIVERY_FAILED',
            error: 'Temporary outage',
          }),
        }),
      (err: any) => err instanceof NewsletterServiceError && err.statusCode === 502
    );
    assert.equal(listNewsletterSubscribers(db).counts.total, 0);

    // Scenario 11: Successful confirmation email & payload verification
    let capturedEmailPayload: any = null;
    const retryResult = await subscribeToNewsletter(db, 'retry.user@nitrr.ac.in', {
      baseUrl: 'https://store.nitrr.ac.in',
      syncContact: async () => ({ ok: true, created: true }),
      sendConfirmation: (params) =>
        sendNewsletterConfirmationViaBrevo(
          params,
          (async (_url: any, init: any) => {
            capturedEmailPayload = JSON.parse(init.body);
            return new Response(JSON.stringify({ messageId: '<msg-confirmed-1>' }), { status: 201 });
          }) as typeof fetch
        ),
    });

    assert.equal(retryResult.status, 'subscribed');
    assert.equal(capturedEmailPayload.subject, 'Thank You for Subscribing!');
    assert.ok(capturedEmailPayload.htmlContent.includes('https://store.nitrr.ac.in/unsubscribe?token='));
    assert.ok(retryResult.subscriber.confirmedAt);

    // Extract unsubscribe token from sent email and unsubscribe (Scenario 12)
    const tokenMatch = capturedEmailPayload.textContent.match(/token=([a-f0-9]+)/i);
    assert.ok(tokenMatch && tokenMatch[1]);
    const unsubRes = unsubscribeFromNewsletter(db, { token: tokenMatch[1] });
    assert.equal(unsubRes.unsubscribed, true);
    assert.equal(unsubRes.alreadyUnsubscribed, false);
    assert.equal(listNewsletterSubscribers(db).counts.unsubscribed, 1);

    // Failed re-subscribe restores unsubscribed state
    await assert.rejects(
      () =>
        subscribeToNewsletter(db, 'retry.user@nitrr.ac.in', {
          baseUrl: 'https://store.nitrr.ac.in',
          syncContact: async () => ({ ok: false, code: 'BREVO_CONTACTS_FAILED', error: 'Down' }),
        }),
      NewsletterServiceError
    );
    assert.equal(listNewsletterSubscribers(db).counts.unsubscribed, 1);

    // Explicit re-subscribe succeeds
    const reactivated = await subscribeToNewsletter(db, 'retry.user@nitrr.ac.in', {
      baseUrl: 'https://store.nitrr.ac.in',
      syncContact: async () => ({ ok: true, created: false }),
      sendConfirmation: async () => ({ ok: true, messageId: '<msg-reactivated>' }),
    });
    assert.equal(reactivated.status, 'subscribed');
    assert.equal(reactivated.subscriber.status, 'active');

    // Admin status update & delete
    const toggled = updateNewsletterSubscriberStatus(db, reactivated.subscriber.id, 'unsubscribed');
    assert.equal(toggled.status, 'unsubscribed');
    assert.equal(deleteNewsletterSubscriber(db, reactivated.subscriber.id), true);
  } finally {
    if (prevKey === undefined) delete process.env.BREVO_API_KEY;
    else process.env.BREVO_API_KEY = prevKey;
    if (prevSender === undefined) delete process.env.BREVO_SENDER_EMAIL;
    else process.env.BREVO_SENDER_EMAIL = prevSender;
  }
});

test('Frontend apiSubscribeNewsletter rejects HTTP 200 HTML SPA fallback and parses standardized JSON cleanly', async () => {
  const prevFetch = globalThis.fetch;
  try {
    // 1. Misrouted SPA fallback returning HTTP 200 text/html must NEVER report "Subscription failed (status 200)."
    globalThis.fetch = (async () =>
      new Response('<!doctype html><html><body>SPA</body></html>', {
        status: 200,
        headers: { 'content-type': 'text/html; charset=utf-8' },
      })) as typeof fetch;

    const htmlFallbackResult = await apiSubscribeNewsletter('student@nitrr.ac.in');
    assert.equal(htmlFallbackResult.success, false);
    assert.equal(htmlFallbackResult.code, 'INVALID_SERVER_RESPONSE');
    assert.ok(!htmlFallbackResult.error?.includes('status 200'));

    // 2. JSON 200 with success: false must still be treated as failure
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ success: false, message: 'Server rejected request' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })) as typeof fetch;

    const false200Result = await apiSubscribeNewsletter('student@nitrr.ac.in');
    assert.equal(false200Result.success, false);
    assert.equal(false200Result.error, 'Server rejected request');

    // 3. Valid HTTP 201 JSON success
    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          success: true,
          status: 'subscribed',
          email: 'student@nitrr.ac.in',
          message: 'Thank you for subscribing!',
        }),
        { status: 201, headers: { 'content-type': 'application/json' } }
      )) as typeof fetch;

    const okResult = await apiSubscribeNewsletter('student@nitrr.ac.in');
    assert.equal(okResult.success, true);
    assert.equal(okResult.status, 'subscribed');
  } finally {
    globalThis.fetch = prevFetch;
  }
});

test('Non-destructive DB migration preserves legacy subscriber records when adding new columns', () => {
  const db = new DatabaseSync(':memory:');
  db.exec(`
    CREATE TABLE newsletter_subscribers (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'active',
      consent_given INTEGER NOT NULL DEFAULT 1,
      consent_source TEXT NOT NULL DEFAULT 'newsletter_form',
      unsubscribe_token TEXT NOT NULL UNIQUE,
      confirmation_email_status TEXT NOT NULL DEFAULT 'pending',
      confirmation_message_id TEXT,
      confirmation_sent_at TEXT,
      subscribed_at TEXT NOT NULL,
      unsubscribed_at TEXT,
      updated_at TEXT NOT NULL
    );
    INSERT INTO newsletter_subscribers VALUES (
      'sub_legacy_1', 'legacy@nitrr.ac.in', 'active', 1, 'newsletter_form', 'tok_legacy_1',
      'sent', '<legacy-msg>', '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z', NULL, '2026-01-01T00:00:00.000Z'
    );
  `);

  initializeSchema(db);

  const list = listNewsletterSubscribers(db);
  assert.equal(list.counts.total, 1);
  assert.equal(list.subscribers[0].email, 'legacy@nitrr.ac.in');
  assert.equal(list.subscribers[0].confirmedAt, '2026-01-01T00:00:00.000Z');
  assert.equal(list.subscribers[0].brevoContactSynced, false);
});

test('Admin newsletter API enforces strict authentication and authorization restrictions', async () => {
  const prevAdminKey = process.env.ADMIN_SECRET_KEY;
  process.env.ADMIN_SECRET_KEY = 'test-admin-secret-xyz';

  try {
    const unauthRes = createMockRes();
    await handleNewsletterOperations(
      {
        method: 'GET',
        url: '/api/newsletter/subscribers',
        headers: { host: 'localhost:3000' },
        query: {},
      } as any,
      unauthRes
    );
    assert.equal(unauthRes.getStatus(), 401);

    setCustomerTokenVerifierForTest(async (token) => {
      if (token === 'valid_staff_jwt') {
        return { sub: 'staff_01', email: 'admin@nitrrfie.in' };
      }
      if (token === 'valid_customer_jwt') {
        return { sub: 'user_regular_123', email: 'student@nitrr.ac.in' };
      }
      throw new Error('Unauthorized');
    });

    const nonStaffRes = createMockRes();
    await handleNewsletterOperations(
      {
        method: 'GET',
        url: '/api/newsletter/subscribers',
        headers: {
          host: 'localhost:3000',
          authorization: 'Bearer valid_customer_jwt',
          'x-user-email': 'admin@nitrrfie.in', // Spoofed header must be ignored
        },
        query: {},
      } as any,
      nonStaffRes
    );
    assert.equal(nonStaffRes.getStatus(), 403);

    const staffRes = createMockRes();
    await handleNewsletterOperations(
      {
        method: 'GET',
        url: '/api/newsletter/subscribers',
        headers: {
          host: 'localhost:3000',
          authorization: 'Bearer valid_staff_jwt',
        },
        query: {},
      } as any,
      staffRes
    );
    assert.equal(staffRes.getStatus(), 200);
    assert.equal(staffRes.getJson().success, true);

    const keyRes = createMockRes();
    await handleNewsletterOperations(
      {
        method: 'GET',
        url: '/api/newsletter/subscribers',
        headers: {
          host: 'localhost:3000',
          'x-admin-key': 'test-admin-secret-xyz',
        },
        query: {},
      } as any,
      keyRes
    );
    assert.equal(keyRes.getStatus(), 200);
    assert.equal(keyRes.getJson().success, true);
  } finally {
    setCustomerTokenVerifierForTest(null);
    if (prevAdminKey === undefined) delete process.env.ADMIN_SECRET_KEY;
    else process.env.ADMIN_SECRET_KEY = prevAdminKey;
  }
});

test('validateOrigin allows trusted reverse-proxy x-forwarded-host and ALLOWED_ORIGINS and rejects untrusted cross-origin 403', () => {
  const prevAllowed = process.env.ALLOWED_ORIGINS;
  try {
    const proxyRes = createMockRes();
    const proxyAllowed = validateOrigin(
      {
        headers: {
          origin: 'https://store.nitrr.ac.in',
          host: '127.0.0.1:3000',
          'x-forwarded-host': 'store.nitrr.ac.in',
        },
      } as any,
      proxyRes
    );
    assert.equal(proxyAllowed, true);

    process.env.ALLOWED_ORIGINS = 'https://merch.nitrrfie.in';
    const envRes = createMockRes();
    const envAllowed = validateOrigin(
      {
        headers: {
          origin: 'https://merch.nitrrfie.in',
          host: '127.0.0.1:3000',
        },
      } as any,
      envRes
    );
    assert.equal(envAllowed, true);

    const evilRes = createMockRes();
    const evilAllowed = validateOrigin(
      {
        headers: {
          origin: 'https://evil-attacker.example',
          host: 'store.nitrr.ac.in',
        },
      } as any,
      evilRes
    );
    assert.equal(evilAllowed, false);
    assert.equal(evilRes.getStatus(), 403);
  } finally {
    if (prevAllowed === undefined) delete process.env.ALLOWED_ORIGINS;
    else process.env.ALLOWED_ORIGINS = prevAllowed;
  }
});

test('Brevo 401 Authorized IPs restriction falls back gracefully without 502 failure', async () => {
  const db = createStoreDatabase(':memory:');
  const prevKey = process.env.BREVO_API_KEY;
  const prevSender = process.env.BREVO_SENDER_EMAIL;
  process.env.BREVO_API_KEY = 'xkeysib-valid-key-ip-restricted';
  process.env.BREVO_SENDER_EMAIL = 'store@nitrrfie.in';

  const ipRestrictedResponse = () =>
    new Response(
      JSON.stringify({
        code: 'unauthorized',
        message:
          'We have detected you are using an unrecognised IP address 34.1.2.3. Please whitelist this IP at https://app.brevo.com/security/authorised_ips',
      }),
      { status: 401 }
    );

  const prevInfo = console.info;
  const capturedLogs: string[] = [];
  console.info = (...args: unknown[]) => {
    capturedLogs.push(args.map((a) => String(a)).join(' '));
  };

  try {
    // 1. Contacts blocked by Authorized IPs, SMTP succeeds
    const partialRes = await subscribeToNewsletter(db, 'ip.contacts@nitrr.ac.in', {
      baseUrl: 'https://store.nitrr.ac.in',
      syncContact: (params) => syncContactWithBrevo(params, async () => ipRestrictedResponse()),
      sendConfirmation: (params) =>
        sendNewsletterConfirmationViaBrevo(
          params,
          async () => new Response(JSON.stringify({ messageId: '<msg-ip-ok>' }), { status: 201 })
        ),
    });
    assert.equal(partialRes.status, 'subscribed');
    assert.equal(partialRes.confirmationEmailSent, true);
    assert.equal(partialRes.subscriber.brevoContactSynced, false);
    assert.equal(partialRes.subscriber.confirmationEmailStatus, 'sent');

    // 2. Both Contacts and SMTP blocked by Authorized IPs -> saves active subscriber locally with pending email status
    const localSavedRes = await subscribeToNewsletter(db, 'ip.both@nitrr.ac.in', {
      baseUrl: 'https://store.nitrr.ac.in',
      syncContact: (params) => syncContactWithBrevo(params, async () => ipRestrictedResponse()),
      sendConfirmation: (params) =>
        sendNewsletterConfirmationViaBrevo(params, async () => ipRestrictedResponse()),
    });
    assert.equal(localSavedRes.status, 'subscribed');
    assert.equal(localSavedRes.confirmationEmailSent, false);
    assert.equal(localSavedRes.subscriber.status, 'active');
    assert.equal(localSavedRes.subscriber.brevoContactSynced, false);
    assert.equal(localSavedRes.subscriber.confirmationEmailStatus, 'pending');
    assert.equal(listNewsletterSubscribers(db).counts.active, 2);

    const errorOutcomeLogs = capturedLogs.filter((line) => line.includes('"outcome":"error"'));
    assert.equal(errorOutcomeLogs.length, 0);
  } finally {
    console.info = prevInfo;
    if (prevKey === undefined) delete process.env.BREVO_API_KEY;
    else process.env.BREVO_API_KEY = prevKey;
    if (prevSender === undefined) delete process.env.BREVO_SENDER_EMAIL;
    else process.env.BREVO_SENDER_EMAIL = prevSender;
  }
});

test('Pending active subscriber retries welcome email once on resubmit without duplicating DB record, and never reports false email success', async () => {
  const tmpDbPath = createTempDbPath();
  const prevDbPath = process.env.STORE_DB_PATH;
  const prevKey = process.env.BREVO_API_KEY;
  const prevSender = process.env.BREVO_SENDER_EMAIL;
  const prevFetch = globalThis.fetch;

  process.env.STORE_DB_PATH = tmpDbPath;
  process.env.BREVO_API_KEY = 'xkeysib-test-key-retry';
  process.env.BREVO_SENDER_EMAIL = 'store@nitrrfie.in';

  let mode: 'ip_blocked' | 'recovered' = 'ip_blocked';
  let smtpCalls = 0;

  globalThis.fetch = (async (url: any) => {
    const urlStr = String(url);
    if (mode === 'ip_blocked') {
      return new Response(
        JSON.stringify({
          code: 'unauthorized',
          message: 'We have detected you are using an unrecognised IP address 34.1.2.3.',
        }),
        { status: 401 }
      );
    }
    if (urlStr.endsWith('/v3/contacts')) {
      return new Response(JSON.stringify({ id: 99 }), { status: 201 });
    }
    if (urlStr.endsWith('/v3/smtp/email')) {
      smtpCalls += 1;
      return new Response(JSON.stringify({ messageId: `<msg-recovered-${smtpCalls}>` }), {
        status: 201,
      });
    }
    throw new Error(`Unexpected URL: ${urlStr}`);
  }) as typeof fetch;

  try {
    // 1. Initial submit while Authorized IPs is blocking -> saved with confirmationEmailSent=false
    const res1 = createMockRes();
    await handleNewsletterOperations(
      {
        method: 'POST',
        url: '/api/newsletter/subscribe',
        headers: { host: 'localhost:3000', 'x-forwarded-for': '10.0.0.88' },
        body: { email: 'pending.retry@nitrr.ac.in' },
      } as any,
      res1
    );
    assert.equal(res1.getStatus(), 201);
    assert.equal(res1.getJson().confirmationEmailSent, false);
    assert.equal(res1.getJson().emailDeliveryStatus, 'failed');

    // 2. Resubmit while still blocked -> still returns confirmationEmailSent=false, NEVER lies with true
    const res2 = createMockRes();
    await handleNewsletterOperations(
      {
        method: 'POST',
        url: '/api/newsletter/subscribe',
        headers: { host: 'localhost:3000', 'x-forwarded-for': '10.0.0.88' },
        body: { email: 'pending.retry@nitrr.ac.in' },
      } as any,
      res2
    );
    assert.equal(res2.getStatus(), 200);
    assert.equal(res2.getJson().status, 'already_subscribed');
    assert.equal(res2.getJson().confirmationEmailSent, false);
    assert.equal(res2.getJson().emailDeliveryStatus, 'failed');

    // 3. Resubmit after Brevo recovers -> delivers pending welcome email ONCE cleanly
    mode = 'recovered';
    const res3 = createMockRes();
    await handleNewsletterOperations(
      {
        method: 'POST',
        url: '/api/newsletter/subscribe',
        headers: { host: 'localhost:3000', 'x-forwarded-for': '10.0.0.88' },
        body: { email: 'pending.retry@nitrr.ac.in' },
      } as any,
      res3
    );
    assert.equal(res3.getStatus(), 200);
    assert.equal(res3.getJson().status, 'already_subscribed');
    assert.equal(res3.getJson().confirmationEmailSent, true);
    assert.equal(res3.getJson().emailDeliveryStatus, 'sent');
    assert.equal(smtpCalls, 1);

    // 4. Subsequent resubmit after email sent -> does NOT send duplicate welcome email
    const res4 = createMockRes();
    await handleNewsletterOperations(
      {
        method: 'POST',
        url: '/api/newsletter/subscribe',
        headers: { host: 'localhost:3000', 'x-forwarded-for': '10.0.0.88' },
        body: { email: 'pending.retry@nitrr.ac.in' },
      } as any,
      res4
    );
    assert.equal(res4.getStatus(), 200);
    assert.equal(res4.getJson().status, 'already_subscribed');
    assert.equal(res4.getJson().confirmationEmailSent, false);
    assert.equal(res4.getJson().emailDeliveryStatus, 'already_sent');
    assert.equal(smtpCalls, 1);

    const db = createStoreDatabase(tmpDbPath);
    const list = listNewsletterSubscribers(db);
    assert.equal(list.counts.total, 1);
    assert.equal(list.subscribers[0].confirmationEmailStatus, 'sent');
    assert.equal(list.subscribers[0].brevoContactSynced, true);
    db.close();
  } finally {
    globalThis.fetch = prevFetch;
    if (prevDbPath === undefined) delete process.env.STORE_DB_PATH;
    else process.env.STORE_DB_PATH = prevDbPath;
    if (prevKey === undefined) delete process.env.BREVO_API_KEY;
    else process.env.BREVO_API_KEY = prevKey;
    if (prevSender === undefined) delete process.env.BREVO_SENDER_EMAIL;
    else process.env.BREVO_SENDER_EMAIL = prevSender;
    fs.rmSync(tmpDbPath, { force: true });
  }
});
