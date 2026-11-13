import type { ApiRequest, ApiResponse } from './types.ts';
import {
  setSecurityHeaders,
  validateOrigin,
  enforceRateLimit,
  hasAdminPermission,
  resolveStaffFromCustomerSession,
  verifyAdminSessionAsync,
  verifyCustomerSession,
} from './middleware.ts';
import { getStoreDatabase } from '../server/db.ts';
import { getAdminMeta, subscribeToAdminEvents } from '../server/adminEvents.ts';
import {
  OrderServiceError,
  addStaffMemberAdmin,
  bulkVerifyPendingOrders,
  computeAdminDashboard,
  createCouponAdmin,
  deleteCouponAdmin,
  deleteOrderAdmin,
  removeStaffMemberAdmin,
  toggleCouponAdmin,
  updateCouponAdmin,
  updateOrderStatusAdmin,
  updateStaffRoleAdmin,
  verifyOrderPayment,
} from '../server/orderService.ts';

function getSourceClientId(req: ApiRequest): string | undefined {
  const raw = req.headers['x-client-instance-id'];
  return typeof raw === 'string' && raw.trim() ? raw.trim().slice(0, 80) : undefined;
}

function getSubPath(req: ApiRequest): string {
  const url = (req as any).originalUrl || (req as any).url || '';
  const cleanUrl = url.split('?')[0];
  const idx = cleanUrl.indexOf('/api/admin');
  if (idx === -1) return '';
  return cleanUrl.slice(idx + '/api/admin'.length);
}

async function handleAdminEventsStream(req: ApiRequest, res: ApiResponse) {
  if (!validateOrigin(req, res)) return;
  const auth = await verifyAdminSessionAsync(req, true);
  if (!auth.authorized) {
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
  const meta = getAdminMeta(db);

  res.write(
    `event: connected\ndata: ${JSON.stringify({
      version: meta.version,
      updatedAt: meta.updatedAt,
      officerEmail: auth.identity?.email,
    })}\n\n`
  );

  const unsubscribe = subscribeToAdminEvents((event) => {
    try {
      res.write(`event: admin_updated\ndata: ${JSON.stringify(event)}\n\n`);
    } catch {
      // ignore socket errors
    }
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

export async function handleAdminOperations(req: ApiRequest, res: ApiResponse) {
  const subPath = getSubPath(req);
  const method = req.method?.toUpperCase() || 'GET';

  if (
    method === 'GET' &&
    (subPath === '/events' || subPath === '/events/' || req.query?.stream === 'events')
  ) {
    return handleAdminEventsStream(req, res);
  }

  setSecurityHeaders(res);

  if (!validateOrigin(req, res)) return;
  if (!enforceRateLimit(req, res, 90)) return;

  let db;
  try {
    db = getStoreDatabase();
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || 'Central store database unavailable.',
      code: 'DB_UNAVAILABLE',
    });
  }
  const sourceClientId = getSourceClientId(req);

  // Check current user's staff authorization status against centralized staff_roster
  if (method === 'GET' && req.query?.action === 'me') {
    const auth = await verifyAdminSessionAsync(req, false);
    if (auth.authorized && auth.identity) {
      return res.status(200).json({
        success: true,
        authorized: true,
        identity: auth.identity,
      });
    }

    const session = await verifyCustomerSession(req, false);
    if (!session.authenticated || !session.userId) {
      return res.status(session.statusCode || 401).json({
        success: false,
        authorized: false,
        error: session.error || 'Authentication required.',
      });
    }

    const identity = await resolveStaffFromCustomerSession({
      userId: session.userId,
      email: session.email,
    });
    return res.status(200).json({
      success: true,
      authorized: Boolean(identity),
      identity: identity || undefined,
    });
  }

  // STRICT SECURITY CHECK: All operational admin actions require verified staff authorization
  const auth = await verifyAdminSessionAsync(req, false);
  if (!auth.authorized || !auth.identity) {
    return res.status(auth.statusCode || 401).json({
      error: auth.error || 'Access Denied: Administrative authorization required.',
    });
  }

  const actorEmail = auth.identity.email || 'system';
  const verifiedByLabel = auth.identity.roleTitle
    ? `${actorEmail} (${auth.identity.roleTitle})`
    : actorEmail;

  // --------------------------------------------------------------------------
  // 1. GET /api/admin - Unified Operational Dashboard Snapshot
  // --------------------------------------------------------------------------
  if (method === 'GET') {
    if (!hasAdminPermission(auth, 'viewDashboard')) {
      return res.status(403).json({ error: 'Forbidden: Missing dashboard read permission.' });
    }

    const from = typeof req.query?.from === 'string' ? req.query.from : undefined;
    const to = typeof req.query?.to === 'string' ? req.query.to : undefined;
    const dashboard = computeAdminDashboard(db, { from, to });

    return res.status(200).json({
      success: true,
      officer: auth.identity,
      dashboard,
      system: {
        serverTimestamp: new Date().toISOString(),
        clerkIntegration: 'active',
        environment: process.env.NODE_ENV || 'production',
      },
      message: 'Centralized admin dashboard synced.',
    });
  }

  // --------------------------------------------------------------------------
  // 2. POST /api/admin - Mutating Operations (Payments, Status, Coupons, Staff)
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

    const payload = body || {};
    const { action } = payload;

    try {
      if (action === 'verify_payment') {
        if (!hasAdminPermission(auth, 'verifyPayments')) {
          return res.status(403).json({
            error: 'Forbidden: Your role does not allow verifying payments.',
          });
        }
        const { order, version } = verifyOrderPayment(db, {
          orderId: payload.orderId,
          utrNumber: payload.utrNumber,
          expectedVersion:
            typeof payload.expectedVersion === 'number' ? payload.expectedVersion : undefined,
          verifiedByLabel,
          actorEmail,
          sourceClientId,
        });

        return res.status(200).json({
          success: true,
          orderId: order.id,
          order,
          action: 'verify_payment',
          verificationStatus: order.verificationStatus,
          paymentStatus: order.paymentStatus,
          utrNumber: order.utrNumber,
          verifiedBy: order.verifiedBy,
          verifiedAt: order.verifiedAt,
          metaVersion: version,
        });
      }

      if (action === 'bulk_verify_payments') {
        if (!hasAdminPermission(auth, 'verifyPayments')) {
          return res.status(403).json({
            error: 'Forbidden: Your role does not allow bulk payment verification.',
          });
        }
        const result = bulkVerifyPendingOrders(db, {
          verifiedByLabel,
          actorEmail,
          sourceClientId,
        });
        return res.status(200).json({
          success: true,
          verifiedCount: result.verifiedCount,
          orders: result.orders,
          metaVersion: result.version,
        });
      }

      if (action === 'update_order_status' || action === 'cancel_order') {
        const targetStatus = action === 'cancel_order' ? 'cancelled' : payload.status;
        const requiredPerm = targetStatus === 'cancelled' ? 'cancelOrders' : 'updateOrderStatus';
        if (!hasAdminPermission(auth, requiredPerm)) {
          return res.status(403).json({
            error: 'Forbidden: Your role does not have permission for this order action.',
          });
        }
        const result = updateOrderStatusAdmin(db, {
          orderId: payload.orderId,
          status: targetStatus,
          cancellationReason: payload.cancellationReason,
          expectedVersion:
            typeof payload.expectedVersion === 'number' ? payload.expectedVersion : undefined,
          actorEmail,
          sourceClientId,
        });
        return res.status(200).json({
          success: true,
          order: result.order,
          metaVersion: result.version,
        });
      }

      if (action === 'create_coupon') {
        if (!hasAdminPermission(auth, 'manageCoupons')) {
          return res.status(403).json({
            error: 'Forbidden: Your role cannot create promotional coupons.',
          });
        }
        const result = createCouponAdmin(db, payload.coupon || payload, actorEmail, sourceClientId);
        return res.status(201).json({
          success: true,
          coupon: result.coupon,
          metaVersion: result.version,
        });
      }

      if (action === 'toggle_coupon') {
        if (!hasAdminPermission(auth, 'manageCoupons')) {
          return res.status(403).json({
            error: 'Forbidden: Your role cannot modify promotional coupons.',
          });
        }
        const result = toggleCouponAdmin(db, payload.code, actorEmail, sourceClientId);
        return res.status(200).json({
          success: true,
          coupon: result.coupon,
          metaVersion: result.version,
        });
      }

      if (action === 'update_coupon') {
        if (!hasAdminPermission(auth, 'manageCoupons')) {
          return res.status(403).json({
            error: 'Forbidden: Your role cannot edit promotional coupons.',
          });
        }
        const updates = payload.updates || payload.coupon || payload;
        const targetCode = payload.code || updates?.code;
        const result = updateCouponAdmin(db, targetCode, updates, actorEmail, sourceClientId);
        return res.status(200).json({
          success: true,
          coupon: result.coupon,
          metaVersion: result.version,
        });
      }

      if (action === 'delete_coupon') {
        if (!hasAdminPermission(auth, 'manageCoupons')) {
          return res.status(403).json({
            error: 'Forbidden: Your role cannot delete promotional coupons.',
          });
        }
        const result = deleteCouponAdmin(db, payload.code, actorEmail, sourceClientId);
        return res.status(200).json({
          success: true,
          deletedCode: result.deletedCode,
          metaVersion: result.version,
        });
      }

      if (action === 'add_staff') {
        if (!hasAdminPermission(auth, 'manageStaff')) {
          return res.status(403).json({
            error: 'Forbidden: Only Super Administrators or Operations Leads can manage staff access.',
          });
        }
        const result = addStaffMemberAdmin(db, {
          email: payload.email,
          role: payload.role,
          actorEmail,
          sourceClientId,
        });
        return res.status(201).json({
          success: true,
          staff: result.staff,
          metaVersion: result.version,
        });
      }

      if (action === 'update_staff_role') {
        if (!hasAdminPermission(auth, 'manageStaff')) {
          return res.status(403).json({
            error: 'Forbidden: Only Super Administrators or Operations Leads can update staff roles.',
          });
        }
        const result = updateStaffRoleAdmin(db, {
          email: payload.email,
          role: payload.role,
          actorEmail,
          sourceClientId,
        });
        return res.status(200).json({
          success: true,
          staff: result.staff,
          metaVersion: result.version,
        });
      }

      if (action === 'remove_staff') {
        if (!hasAdminPermission(auth, 'manageStaff')) {
          return res.status(403).json({
            error: 'Forbidden: Only Super Administrators or Operations Leads can remove staff access.',
          });
        }
        const result = removeStaffMemberAdmin(db, {
          email: payload.email,
          actorEmail,
          sourceClientId,
        });
        return res.status(200).json({
          success: true,
          removedEmail: result.removedEmail,
          metaVersion: result.version,
        });
      }

      return res.status(400).json({ error: `Unsupported admin action: ${action}` });
    } catch (err: any) {
      if (err instanceof OrderServiceError) {
        return res.status(err.statusCode).json({ error: err.message, code: err.code });
      }
      return res.status(400).json({ error: err?.message || 'Unable to execute admin operation.' });
    }
  }

  // --------------------------------------------------------------------------
  // 3. DELETE /api/admin - Delete Order Record (Strict Permission Check)
  // --------------------------------------------------------------------------
  if (method === 'DELETE') {
    if (!hasAdminPermission(auth, 'deleteOrders')) {
      return res.status(403).json({
        error: 'Forbidden: Your role cannot permanently delete orders. Use Cancel Order instead.',
      });
    }

    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        return res.status(400).json({ error: 'Malformed JSON payload.' });
      }
    }

    const orderId = body?.orderId || req.query?.orderId;
    const expectedVersion =
      typeof body?.expectedVersion === 'number' ? body.expectedVersion : undefined;

    try {
      const result = deleteOrderAdmin(db, {
        orderId,
        expectedVersion,
        actorEmail,
        sourceClientId,
      });

      return res.status(200).json({
        success: true,
        deletedOrderId: result.deletedOrderId,
        deletedBy: actorEmail,
        metaVersion: result.version,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      if (err instanceof OrderServiceError) {
        return res.status(err.statusCode).json({ error: err.message, code: err.code });
      }
      return res.status(400).json({ error: err?.message || 'Failed to delete order.' });
    }
  }

  res.setHeader('Allow', 'GET, POST, DELETE');
  return res.status(405).json({ error: `Method ${method} Not Allowed on /api/admin.` });
}

