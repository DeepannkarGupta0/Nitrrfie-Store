import type { ApiRequest, ApiResponse } from './types.ts';
import {
  setSecurityHeaders,
  validateOrigin,
  enforceRateLimit,
  verifyCustomerSession,
} from './middleware.ts';
import { getStoreDatabase } from '../server/db.ts';
import {
  type CartMutationInput,
  CartServiceError,
  addOrIncrementCartItem,
  clearUserCart,
  getUserCart,
  mergeGuestCart,
  removeCartItem,
  setCartItemQuantity,
  validateGuestCartItems,
} from '../server/cartService.ts';
import { subscribeToUserCartEvents } from '../server/cartEvents.ts';
import { calculateCartTotals } from '../utils/cartLogic.ts';

function parseJsonBody(req: ApiRequest): any {
  let body = req.body;
  if (typeof body === 'string') {
    body = JSON.parse(body);
  }
  return body || {};
}

function getSourceClientId(req: ApiRequest): string | undefined {
  const raw = req.headers['x-client-instance-id'];
  return typeof raw === 'string' && raw.trim() ? raw.trim().slice(0, 80) : undefined;
}

function getSubPath(req: ApiRequest): string {
  const url = (req as any).originalUrl || (req as any).url || '';
  const cleanUrl = url.split('?')[0];
  const idx = cleanUrl.indexOf('/api/cart');
  if (idx === -1) return '';
  return cleanUrl.slice(idx + '/api/cart'.length);
}

export async function handleCartEvents(req: ApiRequest, res: ApiResponse) {
  if (!validateOrigin(req, res)) return;
  const auth = await verifyCustomerSession(req, true);
  if (!auth.authenticated || !auth.userId) {
    return res.status(auth.statusCode || 401).json({ error: auth.error || 'Unauthorized' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  if (typeof (res as any).flushHeaders === 'function') {
    (res as any).flushHeaders();
  }

  const db = getStoreDatabase();
  const initialCart = getUserCart(db, auth.userId);
  res.write(
    `event: connected\ndata: ${JSON.stringify({
      version: initialCart.version,
      updatedAt: initialCart.updatedAt,
    })}\n\n`
  );

  const unsubscribe = subscribeToUserCartEvents(auth.userId, (event) => {
    res.write(`event: cart_updated\ndata: ${JSON.stringify(event)}\n\n`);
  });

  const keepAlive = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch {
      // ignore closed socket
    }
  }, 20000);

  req.on('close', () => {
    clearInterval(keepAlive);
    unsubscribe();
  });
}

export async function handleCartOperations(req: ApiRequest, res: ApiResponse) {
  const subPath = getSubPath(req);
  const method = req.method?.toUpperCase() || 'GET';

  if (subPath === '/events' && method === 'GET') {
    return handleCartEvents(req, res);
  }

  setSecurityHeaders(res);
  if (!validateOrigin(req, res)) return;
  if (!enforceRateLimit(req, res, 120)) return;

  const db = getStoreDatabase();

  // Guest-accessible trusted validation endpoint (read-only, never exposes any user's cart)
  if (subPath === '/validate' && method === 'POST') {
    try {
      const body = parseJsonBody(req);
      const guestItems = Array.isArray(body.items) ? (body.items as CartMutationInput[]) : [];
      const payload = validateGuestCartItems(db, guestItems);
      const totals = calculateCartTotals(payload.items);
      return res.status(200).json({ success: true, ...payload, totals });
    } catch {
      return res.status(400).json({ error: 'Malformed cart validation payload.' });
    }
  }

  // Every other cart endpoint strictly requires verified Clerk session identity
  const auth = await verifyCustomerSession(req, false);
  if (!auth.authenticated || !auth.userId) {
    return res.status(auth.statusCode || 401).json({
      error: auth.error || 'Authentication required to access your saved cart.',
    });
  }

  const userId = auth.userId;
  const sourceClientId = getSourceClientId(req);

  try {
    // GET /api/cart -> Fetch authenticated user's DB cart
    if ((subPath === '' || subPath === '/') && method === 'GET') {
      const cart = getUserCart(db, userId);
      const totals = calculateCartTotals(cart.items);
      return res.status(200).json({ success: true, ...cart, totals });
    }

    // POST /api/cart/merge -> Merge guest cart items into authenticated user's DB cart
    if (subPath === '/merge' && method === 'POST') {
      const body = parseJsonBody(req);
      const guestItems = Array.isArray(body.items) ? (body.items as CartMutationInput[]) : [];
      const cart = mergeGuestCart(db, userId, guestItems, sourceClientId);
      const totals = calculateCartTotals(cart.items);
      return res.status(200).json({ success: true, ...cart, totals });
    }

    // POST /api/cart/items -> Add or increment item atomically
    if (subPath === '/items' && method === 'POST') {
      const body = parseJsonBody(req);
      if (!body.productId || typeof body.productId !== 'string') {
        return res.status(400).json({ error: 'productId is required.' });
      }
      const cart = addOrIncrementCartItem(
        db,
        userId,
        {
          productId: body.productId,
          colorName: typeof body.colorName === 'string' ? body.colorName : 'Standard',
          colorHex: typeof body.colorHex === 'string' ? body.colorHex : undefined,
          size: typeof body.size === 'string' ? body.size : 'Free Size',
          quantity: Number(body.quantity) || 1,
          customDesign: body.customDesign,
        },
        sourceClientId
      );
      const totals = calculateCartTotals(cart.items);
      return res.status(200).json({ success: true, ...cart, totals });
    }

    // PATCH /api/cart/items -> Update specific cart item quantity atomically
    if (subPath === '/items' && method === 'PATCH') {
      const body = parseJsonBody(req);
      const cartItemId = typeof body.cartItemId === 'string' ? body.cartItemId.trim() : '';
      if (!cartItemId) {
        return res.status(400).json({ error: 'cartItemId is required.' });
      }
      const quantity = Number(body.quantity);
      if (!Number.isFinite(quantity)) {
        return res.status(400).json({ error: 'Valid numeric quantity is required.' });
      }
      const cart = setCartItemQuantity(db, userId, cartItemId, quantity, sourceClientId);
      const totals = calculateCartTotals(cart.items);
      return res.status(200).json({ success: true, ...cart, totals });
    }

    // DELETE /api/cart/items -> Remove single item
    if (subPath === '/items' && method === 'DELETE') {
      const body = parseJsonBody(req);
      const queryId = typeof req.query?.cartItemId === 'string' ? req.query.cartItemId : '';
      const cartItemId = (typeof body.cartItemId === 'string' ? body.cartItemId : queryId).trim();
      if (!cartItemId) {
        return res.status(400).json({ error: 'cartItemId is required.' });
      }
      const cart = removeCartItem(db, userId, cartItemId, sourceClientId);
      const totals = calculateCartTotals(cart.items);
      return res.status(200).json({ success: true, ...cart, totals });
    }

    // DELETE /api/cart -> Clear all items from authenticated user's cart
    if ((subPath === '' || subPath === '/') && method === 'DELETE') {
      const cart = clearUserCart(db, userId, sourceClientId);
      const totals = calculateCartTotals(cart.items);
      return res.status(200).json({ success: true, ...cart, totals });
    }

    res.setHeader('Allow', 'GET, POST, PATCH, DELETE');
    return res.status(405).json({ error: `Method ${method} not allowed for /api/cart${subPath}` });
  } catch (err: any) {
    if (err instanceof CartServiceError) {
      const latestCart = getUserCart(db, userId);
      const totals = calculateCartTotals(latestCart.items);
      return res.status(err.statusCode).json({
        error: err.message,
        code: err.code,
        ...latestCart,
        totals,
      });
    }
    return res.status(400).json({
      error: err?.message || 'Unable to process cart operation.',
    });
  }
}
