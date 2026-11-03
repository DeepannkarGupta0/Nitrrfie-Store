import { clerkMiddleware, createRouteMatcher, clerkClient } from '@clerk/nextjs/server';
import { log } from '@/lib/logger';

// Simple in‑memory rate limiter per IP for admin routes
const rateLimitStore = new Map<string, { count: number; firstRequestTimestamp: number }>();
const RATE_LIMIT_MAX = 5; // max requests per window
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

const isProtectedRoute = createRouteMatcher([
  '/account(.*)',
  '/admin(.*)',
]);

const isApiRoute = createRouteMatcher(['/api(.*)']);
const isPublicApiRoute = createRouteMatcher([
  '/api/public(.*)',
  '/api/payment/webhook',
  '/api/orders/submit',
  '/api/orders/place',
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

  // Determine if this route should be protected by Clerk
  const isProtected = isProtectedRoute(req) || (isApiRoute(req) && !isPublicApiRoute(req));

  if (isProtected) {
    const session = await auth();

    // Redirect unauthenticated users to sign‑in preserving original path
    if (!session.userId) {
      const signInUrl = new URL('/sign-in', req.url);
      signInUrl.searchParams.set('redirect', path);
      return Response.redirect(signInUrl);
    }

    if (path.startsWith('/admin')) {
      const adminRole = (process.env.ADMIN_ROLE ?? "admin").toLowerCase();

      // Ensure the role env var is set (fallback handled above)
      if (!adminRole) {
        log('proxy', '[Middleware] ADMIN_ROLE env var not set!', { severity: 'error' });
        return Response.redirect(new URL('/', req.url));
      }

      // Fetch full user object to check primary email
      const client = await clerkClient();
      const user = await client.users.getUser(session.userId);
      const userRole = (user?.publicMetadata?.role as string | undefined)?.toLowerCase();

      if (userRole !== adminRole) {
        log('proxy', '[Middleware] Unauthorized admin access attempt', { severity: 'error', user_id: session.userId, payload: { role: userRole } });
        // Redirect unauthorized users to home
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