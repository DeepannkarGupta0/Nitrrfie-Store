import { clerkMiddleware, createRouteMatcher, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { log } from '@/lib/logger';

// Simple in‑memory rate limiter per IP for admin routes
const rateLimitStore = new Map<string, { count: number; firstRequestTimestamp: number }>();
const RATE_LIMIT_MAX = 5; // max requests per window
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

const isProtectedRoute = createRouteMatcher([
  '/account(.*)',
  '/admin(.*)',
  '/checkout(.*)',
]);

const isApiRoute = createRouteMatcher(['/api(.*)']);

// Best-effort admin API rate limit: 15 requests/minute per IP + method + route.
// Do not limit the /admin page or Next.js RSC/navigation requests.
type AdminRateEntry = { count: number; resetAt: number };
const adminApiRateStore = new Map<string, AdminRateEntry>();
const ADMIN_API_LIMIT = 15;
const ADMIN_API_WINDOW_MS = 60_000;
let lastAdminRateCleanup = 0;

function checkAdminApiRateLimit(req: Request, path: string): number | null {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown';
  const key = `${ip}:${req.method}:${path}`;
  const now = Date.now();

  if (now - lastAdminRateCleanup > 5 * 60_000) {
    for (const [storedKey, entry] of adminApiRateStore) {
      if (now >= entry.resetAt) adminApiRateStore.delete(storedKey);
    }
    lastAdminRateCleanup = now;
  }

  const entry = adminApiRateStore.get(key);
  if (!entry || now >= entry.resetAt) {
    adminApiRateStore.set(key, { count: 1, resetAt: now + ADMIN_API_WINDOW_MS });
    return null;
  }
  if (entry.count >= ADMIN_API_LIMIT) {
    return Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
  }
  entry.count += 1;
  return null;
}

const isPublicApiRoute = createRouteMatcher([
  '/api/public(.*)',
  '/api/inventory',
  '/api/auth/check-email',
]);

export default clerkMiddleware(async (auth, req) => {
  const url = new URL(req.url);
  const path = url.pathname;
  
  // Rate limiting for admin routes
  if (path.startsWith('/admin')) {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('client-ip') || '';
    const now = Date.now();
    const record = rateLimitStore.get(ip) ?? { count: 0, firstRequestTimestamp: now };
    if (now - record.firstRequestTimestamp > RATE_LIMIT_WINDOW_MS) {
      record.count = 0;
      record.firstRequestTimestamp = now;
    }
    record.count += 1;
    rateLimitStore.set(ip, record);
    if (record.count > RATE_LIMIT_MAX) {
      log('proxy', '[Middleware] Rate limit exceeded for admin route', { severity: 'error', payload: { ip, count: record.count } });
      return new Response('Too Many Requests', { status: 429 });
    }
  }

  // Throttle repeated admin API calls without blocking normal admin page loads.
  if (path.startsWith('/api/admin/')) {
    const retryAfter = checkAdminApiRateLimit(req, path);
    if (retryAfter !== null) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait before trying this admin action again.' },
        { status: 429, headers: { 'Retry-After': String(retryAfter), 'Cache-Control': 'no-store' } }
      );
    }
  }

  // Determine if this route should be protected by Clerk
  const isProtected = isProtectedRoute(req) || (isApiRoute(req) && !isPublicApiRoute(req));

  if (isProtected) {
    const session = await auth();

    // APIs must return JSON errors; browser pages can redirect to sign-in.
    if (!session.userId) {
      if (isApiRoute(req)) {
        return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
      }
      const signInUrl = new URL('/sign-in', req.url);
      signInUrl.searchParams.set('redirect', path);
      return Response.redirect(signInUrl);
    }

    const client = await clerkClient();
    const user = await client.users.getUser(session.userId);

    // Email verification is enforced by Clerk's sign-up configuration.
    // Do not require a phone number to access the store.
    if (path.startsWith('/admin')) {
      const adminRole = (process.env.ADMIN_ROLE ?? "admin").toLowerCase();
      if (!adminRole) {
        log('proxy', '[Middleware] ADMIN_ROLE env var not set!', { severity: 'error' });
        return Response.redirect(new URL('/', req.url));
      }
      const userRole = (user?.publicMetadata?.role as string | undefined)?.toLowerCase();
      if (userRole !== adminRole && userRole !== 'super_admin') {
        log('proxy', '[Middleware] Unauthorized admin access attempt', { severity: 'error', user_id: session.userId, payload: { role: userRole } });
        return Response.redirect(new URL('/', req.url));
      }
    }
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};