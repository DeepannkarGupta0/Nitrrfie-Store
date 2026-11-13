import type { ApiRequest, ApiResponse, CreateOrderPayload } from './types.ts';
import {
  setSecurityHeaders,
  validateOrigin,
  enforceRateLimit,
  hasAdminPermission,
  verifyAdminSessionAsync,
  verifyCustomerSession,
} from './middleware.ts';
import { getStoreDatabase } from '../server/db.ts';
import {
  OrderServiceError,
  createGenuineOrder,
  listCustomerOrders,
  listOrdersAdmin,
  lookupPublicTrackedOrder,
  updateOrderStatusAdmin,
  validateCouponForSubtotal,
} from '../server/orderService.ts';

function getSourceClientId(req: ApiRequest): string | undefined {
  const raw = req.headers['x-client-instance-id'];
  return typeof raw === 'string' && raw.trim() ? raw.trim().slice(0, 80) : undefined;
}

export async function handleOrderProcessing(req: ApiRequest, res: ApiResponse) {
  setSecurityHeaders(res);

  if (!validateOrigin(req, res)) return;
  if (!enforceRateLimit(req, res, 45)) return;

  const method = req.method?.toUpperCase();
  const db = getStoreDatabase();
  const sourceClientId = getSourceClientId(req);

  // --------------------------------------------------------------------------
  // 1. POST /api/orders - Process New Genuine Customer Order
  // --------------------------------------------------------------------------
  if (method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        return res.status(400).json({ error: 'Malformed JSON payload.' });
      }
    }

    const payload = (body || {}) as Partial<CreateOrderPayload>;
    const customerAuth = await verifyCustomerSession(req, false);
    const authenticatedUserId = customerAuth.authenticated ? customerAuth.userId : undefined;

    try {
      const { order, idempotentReplay } = createGenuineOrder(db, payload, {
        authenticatedUserId,
        sourceClientId,
      });

      return res.status(idempotentReplay ? 200 : 201).json({
        success: true,
        order,
        idempotentReplay,
        message: idempotentReplay
          ? 'Existing order retrieved for idempotent checkout attempt.'
          : 'Order processed and registered securely on server.',
      });
    } catch (err: any) {
      if (err instanceof OrderServiceError) {
        return res.status(err.statusCode).json({
          error: err.message,
          code: err.code,
        });
      }
      return res.status(err?.statusCode || 400).json({
        error: err?.message || 'Unable to process order.',
        code: err?.code,
      });
    }
  }

  // --------------------------------------------------------------------------
  // 2. GET /api/orders - Validate Coupon, Track Order, Customer Orders, or Admin Ledger
  // --------------------------------------------------------------------------
  if (method === 'GET') {
    const action = typeof req.query?.action === 'string' ? req.query.action : '';
    if (action === 'validate_coupon') {
      const code = typeof req.query?.code === 'string' ? req.query.code : '';
      const subtotal = Number(req.query?.subtotal || 0);
      const validation = validateCouponForSubtotal(db, code, subtotal);
      return res.status(200).json({
        success: true,
        ...validation,
        discount: validation.discountAmount,
        message: validation.valid
          ? `Coupon ${validation.coupon?.code || ''} applied.`
          : validation.error || 'Invalid coupon code.',
      });
    }

    const trackQuery = typeof req.query?.track === 'string' ? req.query.track.trim() : '';
    if (trackQuery) {
      const trackedOrder = lookupPublicTrackedOrder(db, trackQuery);
      if (!trackedOrder) {
        return res.status(404).json({
          success: false,
          error: 'No matching order found. Please verify your Order ID, Roll Number, or Phone.',
        });
      }
      return res.status(200).json({
        success: true,
        order: trackedOrder,
      });
    }

    const scope = typeof req.query?.scope === 'string' ? req.query.scope : '';
    if (scope === 'mine') {
      const custAuth = await verifyCustomerSession(req, false);
      if (!custAuth.authenticated || !custAuth.userId) {
        return res.status(custAuth.statusCode || 401).json({ error: custAuth.error });
      }
      return res.status(200).json({
        success: true,
        orders: listCustomerOrders(db, custAuth.userId),
      });
    }

    const auth = await verifyAdminSessionAsync(req, false);
    if (!auth.authorized) {
      return res.status(auth.statusCode || 401).json({ error: auth.error });
    }

    return res.status(200).json({
      success: true,
      orders: listOrdersAdmin(db),
      officer: auth.identity,
      timestamp: new Date().toISOString(),
    });
  }

  // --------------------------------------------------------------------------
  // 3. PATCH /api/orders - Update Order Status or Cancel Order (Admin Protected)
  // --------------------------------------------------------------------------
  if (method === 'PATCH') {
    const auth = await verifyAdminSessionAsync(req, false);
    if (!auth.authorized) {
      return res.status(auth.statusCode || 401).json({ error: auth.error });
    }

    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        return res.status(400).json({ error: 'Malformed JSON payload.' });
      }
    }

    const { orderId, status, cancellationReason, expectedVersion } = body || {};
    if (!orderId || !status) {
      return res.status(400).json({ error: 'Missing orderId or status in update payload.' });
    }

    const requiredPermission = status === 'cancelled' ? 'cancelOrders' : 'updateOrderStatus';
    if (!hasAdminPermission(auth, requiredPermission)) {
      return res.status(403).json({
        error: `Forbidden: Role "${auth.identity?.roleTitle || auth.identity?.role}" lacks permission for this action.`,
      });
    }

    try {
      const result = updateOrderStatusAdmin(db, {
        orderId,
        status,
        cancellationReason,
        expectedVersion: typeof expectedVersion === 'number' ? expectedVersion : undefined,
        actorEmail: auth.identity?.email || 'system',
        sourceClientId,
      });

      return res.status(200).json({
        success: true,
        order: result.order,
        orderId: result.order.id,
        status: result.order.status,
        metaVersion: result.version,
        updatedBy: auth.identity?.email,
      });
    } catch (err: any) {
      if (err instanceof OrderServiceError) {
        return res.status(err.statusCode).json({ error: err.message, code: err.code });
      }
      return res.status(400).json({ error: err?.message || 'Unable to update order status.' });
    }
  }

  res.setHeader('Allow', 'GET, POST, PATCH');
  return res.status(405).json({ error: `Method ${method} Not Allowed on /api/orders.` });
}

