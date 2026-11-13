import crypto from 'node:crypto';
import { createClerkClient, verifyToken } from '@clerk/backend';
import type { ApiRequest, ApiResponse, AdminAuthResult } from './types.ts';
import type { AdminPermissions, AdminUser } from '../types/store.ts';
import { getStoreDatabase } from '../server/db.ts';
import {
  PRIMARY_OWNER_EMAIL,
  STAFF_EMAIL_SEED,
  getDefaultRoleForEmail,
} from '../server/staffConfig.ts';
import {
  getPermissionsForRole,
  getRoleTitleForRole,
  isValidClerkPublishableKey,
  normalizeAdminRole,
} from '../config/clerk.ts';

// Rate Limiting Cache with Automatic Garbage Collection
const ipRateMap = new Map<string, { count: number; resetTime: number }>();
const RATE_WINDOW_MS = 60 * 1000; // 1 minute

// Short-lived in-memory cache of authoritative Clerk user emails (keyed by Clerk userId)
const clerkUserEmailCache = new Map<string, { email: string; expiresAt: number }>();
const CLERK_EMAIL_CACHE_TTL_MS = 60 * 1000;

export interface CustomerAuthResult {
  authenticated: boolean;
  userId?: string;
  email?: string;
  statusCode?: number;
  error?: string;
}

type TokenVerifier = (token: string) => Promise<{ sub: string; email?: string }>;
let customTokenVerifier: TokenVerifier | null = null;

export function setCustomerTokenVerifierForTest(verifier: TokenVerifier | null) {
  customTokenVerifier = verifier;
}

const jwksCache = new Map<string, { keys: Array<Record<string, any>>; expiresAt: number }>();

function getClerkFrontendApiFromEnv(): string {
  const pubKey = (process.env.VITE_CLERK_PUBLISHABLE_KEY || '').trim();
  if (!isValidClerkPublishableKey(pubKey)) return '';
  try {
    const encoded = pubKey.split('_')[2];
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    return Buffer.from(base64, 'base64').toString('utf8').replace(/\$$/, '');
  } catch {
    return '';
  }
}

async function getClerkJwtPublicKeyPem(token: string, frontendApi: string): Promise<string | undefined> {
  const headerB64 = token.split('.')[0];
  if (!headerB64) return undefined;
  const headerJson = JSON.parse(Buffer.from(headerB64, 'base64url').toString('utf8')) as { kid?: string };
  const now = Date.now();
  let cached = jwksCache.get(frontendApi);
  if (!cached || cached.expiresAt <= now) {
    const res = await fetch(`https://${frontendApi}/.well-known/jwks.json`);
    if (!res.ok) return undefined;
    const data = (await res.json()) as { keys?: Array<Record<string, any>> };
    if (!Array.isArray(data.keys)) return undefined;
    cached = { keys: data.keys, expiresAt: now + 10 * 60 * 1000 };
    jwksCache.set(frontendApi, cached);
  }
  const jwk = cached.keys.find((k) => !headerJson.kid || k.kid === headerJson.kid) || cached.keys[0];
  if (!jwk) return undefined;
  const keyObj = crypto.createPublicKey({ key: jwk as crypto.JsonWebKey, format: 'jwk' });
  return keyObj.export({ type: 'spki', format: 'pem' }).toString();
}

function timingSafeSecretEquals(provided: string, expected: string): boolean {
  const a = Buffer.from(provided, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function extractVerifiedClaimEmail(claims: Record<string, unknown> | null | undefined): string | undefined {
  if (!claims) return undefined;
  const candidates = [claims.email, claims.primary_email, claims.email_address];
  for (const val of candidates) {
    if (typeof val === 'string' && val.includes('@')) {
      return val.toLowerCase().trim();
    }
  }
  return undefined;
}

export async function verifyCustomerSession(
  req: ApiRequest,
  allowQueryToken = false
): Promise<CustomerAuthResult> {
  let token = '';
  const authHeader = req.headers['authorization'];
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice('Bearer '.length).trim();
  } else if (allowQueryToken && typeof req.query?.token === 'string') {
    token = req.query.token.trim();
  }

  if (!token) {
    return {
      authenticated: false,
      statusCode: 401,
      error: 'Authentication required: missing session bearer token.',
    };
  }

  try {
    if (customTokenVerifier) {
      const payload = await customTokenVerifier(token);
      if (payload?.sub) {
        return {
          authenticated: true,
          userId: payload.sub,
          email:
            typeof payload.email === 'string' && payload.email.includes('@')
              ? payload.email.toLowerCase().trim()
              : undefined,
        };
      }
      return { authenticated: false, statusCode: 401, error: 'Invalid session token.' };
    }

    const clerkSecretKey = process.env.CLERK_SECRET_KEY?.trim();
    if (clerkSecretKey) {
      const verified = await verifyToken(token, { secretKey: clerkSecretKey });
      if (!verified?.sub) {
        return { authenticated: false, statusCode: 401, error: 'Invalid Clerk session token.' };
      }
      return {
        authenticated: true,
        userId: verified.sub,
        email: extractVerifiedClaimEmail(verified as Record<string, unknown>),
      };
    }

    const frontendApi = getClerkFrontendApiFromEnv();
    if (frontendApi) {
      const jwtKey = await getClerkJwtPublicKeyPem(token, frontendApi);
      if (jwtKey) {
        const verified = await verifyToken(token, { jwtKey });
        if (verified?.sub) {
          return {
            authenticated: true,
            userId: verified.sub,
            email: extractVerifiedClaimEmail(verified as Record<string, unknown>),
          };
        }
      }
    }

    return {
      authenticated: false,
      statusCode: 401,
      error: 'Server cannot verify session token: Clerk keys are not configured.',
    };
  } catch {
    return {
      authenticated: false,
      statusCode: 401,
      error: 'Session token verification failed or token has expired.',
    };
  }
}

async function resolveAuthoritativeClerkEmail(userId: string): Promise<string | null> {
  const now = Date.now();
  const cached = clerkUserEmailCache.get(userId);
  if (cached && cached.expiresAt > now) {
    return cached.email;
  }

  const clerkSecretKey = process.env.CLERK_SECRET_KEY?.trim();
  if (!clerkSecretKey) {
    return null;
  }

  try {
    const clerk = createClerkClient({ secretKey: clerkSecretKey });
    const user = await clerk.users.getUser(userId);
    const primaryRecord = user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId);
    const verifiedRecord =
      primaryRecord?.verification?.status === 'verified'
        ? primaryRecord
        : user.emailAddresses.find((e) => e.verification?.status === 'verified') || primaryRecord;

    const email = verifiedRecord?.emailAddress?.toLowerCase().trim();
    if (!email || !email.includes('@')) {
      return null;
    }

    clerkUserEmailCache.set(userId, {
      email,
      expiresAt: now + CLERK_EMAIL_CACHE_TTL_MS,
    });
    return email;
  } catch {
    return null;
  }
}

function purgeExpiredLimits() {
  const now = Date.now();
  for (const [ip, record] of ipRateMap.entries()) {
    if (now > record.resetTime) {
      ipRateMap.delete(ip);
    }
  }
}

export function enforceRateLimit(req: ApiRequest, res: ApiResponse, maxRequests = 20): boolean {
  purgeExpiredLimits();

  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket?.remoteAddress || 'unknown';
  const now = Date.now();

  const record = ipRateMap.get(ip);
  if (!record || now > record.resetTime) {
    ipRateMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW_MS });
    return true;
  }

  record.count += 1;
  if (record.count > maxRequests) {
    res.status(429).json({
      error: 'Rate limit exceeded. Please wait a moment before sending more requests.',
    });
    return false;
  }

  return true;
}

export function setSecurityHeaders(res: ApiResponse) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
}

function extractHostCandidate(value: string | undefined): string | null {
  if (!value || !value.trim()) return null;
  const trimmed = value.trim().toLowerCase();
  try {
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return new URL(trimmed).host.toLowerCase();
    }
    return trimmed.replace(/\/+$/, '');
  } catch {
    return null;
  }
}

export function validateOrigin(req: ApiRequest, res: ApiResponse): boolean {
  const origin = req.headers['origin'];
  if (typeof origin !== 'string' || !origin.trim()) {
    return true;
  }

  let originHost: string;
  try {
    originHost = new URL(origin).host.toLowerCase();
  } catch {
    res.status(400).json({ error: 'Malformed Origin header.' });
    return false;
  }

  if (
    originHost === 'localhost' ||
    originHost.startsWith('localhost:') ||
    originHost === '127.0.0.1' ||
    originHost.startsWith('127.0.0.1:')
  ) {
    return true;
  }

  const allowedHosts = new Set<string>();
  const addHost = (raw?: string | string[]) => {
    if (!raw) return;
    const values = Array.isArray(raw) ? raw : [raw];
    for (const item of values) {
      for (const part of item.split(',')) {
        const parsed = extractHostCandidate(part);
        if (parsed) allowedHosts.add(parsed);
      }
    }
  };

  addHost(req.headers['host']);
  addHost(req.headers['x-forwarded-host']);
  addHost(process.env.APP_URL);
  addHost(process.env.APP_PUBLIC_URL);
  addHost(process.env.ALLOWED_ORIGINS);
  addHost(process.env.VERCEL_URL);
  addHost(process.env.VERCEL_BRANCH_URL);
  addHost(process.env.VERCEL_PROJECT_PRODUCTION_URL);

  if (allowedHosts.size > 0 && !allowedHosts.has(originHost)) {
    console.warn('[Security] validateOrigin rejected request:', {
      originHost,
      allowedHosts: Array.from(allowedHosts),
    });
    res.status(403).json({ error: 'Forbidden: Untrusted cross-origin request rejected.' });
    return false;
  }

  return true;
}

export function resolveStaffIdentityByEmail(
  rawEmail: string,
  userId?: string
): AdminAuthResult['identity'] | null {
  const cleanEmail = rawEmail.toLowerCase().trim();
  if (!cleanEmail || !cleanEmail.includes('@')) return null;

  try {
    const db = getStoreDatabase();
    const row = db
      .prepare(`SELECT email, role, role_title FROM staff_roster WHERE email = ? LIMIT 1`)
      .get(cleanEmail) as { email: string; role: string; role_title: string } | undefined;

    if (row) {
      const normalizedRole = normalizeAdminRole(row.role);
      return {
        userId,
        email: row.email,
        role: normalizedRole,
        roleTitle: row.role_title || getRoleTitleForRole(normalizedRole),
        permissions: getPermissionsForRole(normalizedRole),
      };
    }
  } catch {
    // Fallback to server-only seed only if DB lookup fails before initialization
  }

  const isStaticSeeded = STAFF_EMAIL_SEED.some((e) => e.toLowerCase() === cleanEmail);
  if (isStaticSeeded) {
    const role = getDefaultRoleForEmail(cleanEmail);
    return {
      userId,
      email: cleanEmail,
      role,
      roleTitle: getRoleTitleForRole(role),
      permissions: getPermissionsForRole(role),
    };
  }

  return null;
}

export async function resolveStaffFromCustomerSession(session: {
  userId: string;
  email?: string;
}): Promise<AdminAuthResult['identity'] | null> {
  // Never read email from client headers or query params; use verified token claims or Clerk Backend API
  const verifiedEmail =
    session.email || (await resolveAuthoritativeClerkEmail(session.userId));
  if (!verifiedEmail) {
    return null;
  }
  return resolveStaffIdentityByEmail(verifiedEmail, session.userId);
}

export function hasAdminPermission(
  auth: AdminAuthResult,
  permission: keyof AdminPermissions
): boolean {
  if (!auth.authorized || !auth.identity) return false;
  const perms = auth.identity.permissions || getPermissionsForRole(auth.identity.role);
  return Boolean(perms[permission]);
}

function buildSuperAdminSystemIdentity(): NonNullable<AdminAuthResult['identity']> {
  const role: AdminUser['role'] = 'super_admin';
  return {
    email: PRIMARY_OWNER_EMAIL,
    role,
    roleTitle: getRoleTitleForRole(role),
    permissions: getPermissionsForRole(role),
  };
}

/**
 * Cryptographically verifies admin access for sensitive admin endpoints
 * (accepts ADMIN_SECRET_KEY or a verified Clerk session JWT belonging to a centralized staff_roster member).
 * Never trusts client-supplied x-user-email headers or ?email= query parameters.
 */
export async function verifyAdminSessionAsync(
  req: ApiRequest,
  allowQueryToken = false
): Promise<AdminAuthResult> {
  const adminSecretKey = process.env.ADMIN_SECRET_KEY?.trim();

  const customKey = req.headers['x-admin-key'];
  if (
    adminSecretKey &&
    typeof customKey === 'string' &&
    timingSafeSecretEquals(customKey.trim(), adminSecretKey)
  ) {
    return {
      authorized: true,
      identity: buildSuperAdminSystemIdentity(),
    };
  }

  let token = '';
  const authHeader = req.headers['authorization'];
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice('Bearer '.length).trim();
  } else if (allowQueryToken && typeof req.query?.token === 'string') {
    token = req.query.token.trim();
  }

  if (!token) {
    return {
      authorized: false,
      statusCode: 401,
      error: 'Unauthorized: Missing or invalid Authorization Bearer header.',
    };
  }

  if (adminSecretKey && timingSafeSecretEquals(token, adminSecretKey)) {
    return {
      authorized: true,
      identity: buildSuperAdminSystemIdentity(),
    };
  }

  const session = await verifyCustomerSession(req, allowQueryToken);
  if (!session.authenticated || !session.userId) {
    return {
      authorized: false,
      statusCode: session.statusCode || 401,
      error: session.error || 'Unauthorized: Administrative authentication required.',
    };
  }

  const staffIdentity = await resolveStaffFromCustomerSession({
    userId: session.userId,
    email: session.email,
  });

  if (!staffIdentity) {
    return {
      authorized: false,
      statusCode: 403,
      error: 'Forbidden: Account is not authorized on the staff roster.',
    };
  }

  return {
    authorized: true,
    identity: staffIdentity,
  };
}
