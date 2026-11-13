import type { DatabaseSync } from 'node:sqlite';
import { runInTransaction } from './db.ts';
import {
  clearUserCart,
  getAllCatalogProducts,
  getProductById,
  normalizeCustomDesign,
} from './cartService.ts';
import { bumpAdminVersion, getAdminMeta, recordAuditLog } from './adminEvents.ts';
import { broadcastCatalogEvent } from './productEvents.ts';
import {
  getRoleTitleForRole,
  normalizeAdminRole,
} from '../config/clerk.ts';
import { PRIMARY_OWNER_EMAIL } from './staffConfig.ts';
import type { CreateOrderPayload } from '../api/types.ts';
import type {
  AdminDashboardPayload,
  AdminDashboardStats,
  AdminOperationalAlert,
  AdminUser,
  AuditLogEntry,
  Coupon,
  CustomerSummary,
  Order,
  OrderItem,
  Product,
  PublicTrackedOrder,
  StaffMember,
} from '../types/store.ts';

export class OrderServiceError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode = 400, code = 'ORDER_ERROR') {
    super(message);
    this.name = 'OrderServiceError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

interface OrderDbRow {
  id: string;
  user_id: string | null;
  utr_number: string | null;
  idempotency_key: string | null;
  status: string;
  total: number;
  version: number;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  refund_status: string | null;
  updated_by: string | null;
  payload_json: string;
  created_at: string;
  updated_at: string;
}

interface CouponDbRow {
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_discount: number | null;
  expires_at: string | null;
  is_active: number;
  usage_count: number;
  description: string;
  created_at: string;
  updated_at: string;
}

interface AuditLogDbRow {
  id: string;
  timestamp: string;
  officer_email: string;
  action: AuditLogEntry['action'];
  target_id: string | null;
  details: string;
}

interface StaffRosterDbRow {
  email: string;
  role: string;
  role_title: string;
  added_by: string | null;
  created_at: string;
  updated_at: string;
}

export function sanitizeString(str: unknown): string {
  if (typeof str !== 'string') return '';
  return str.replace(/[<>]/g, '').trim();
}

function sanitizeReceiptDataUrl(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  if (!/^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/i.test(trimmed)) {
    return undefined;
  }
  if (trimmed.length > 600_000) return undefined;
  return trimmed;
}

function parseOrderRow(row: OrderDbRow): Order {
  const parsed = JSON.parse(row.payload_json) as Order;
  return {
    ...parsed,
    id: row.id,
    status: (row.status as Order['status']) || parsed.status,
    total: typeof row.total === 'number' ? row.total : parsed.total,
    version: typeof row.version === 'number' ? row.version : parsed.version ?? 1,
    idempotencyKey: row.idempotency_key || parsed.idempotencyKey,
    cancelledAt: row.cancelled_at || parsed.cancelledAt,
    cancellationReason: row.cancellation_reason || parsed.cancellationReason,
    refundStatus: (row.refund_status as Order['refundStatus']) || parsed.refundStatus,
    updatedBy: row.updated_by || parsed.updatedBy,
    updatedAt: row.updated_at || parsed.updatedAt,
  };
}

function parseCouponRow(row: CouponDbRow): Coupon {
  return {
    code: row.code,
    discountType: row.discount_type,
    discountValue: row.discount_value,
    minOrderAmount: row.min_order_amount,
    maxDiscount: row.max_discount ?? undefined,
    expiresAt: row.expires_at ?? undefined,
    isActive: row.is_active === 1,
    usageCount: row.usage_count,
    description: row.description,
  };
}

function parseStaffRow(row: StaffRosterDbRow): StaffMember {
  const role = normalizeAdminRole(row.role);
  return {
    email: row.email,
    role,
    roleTitle: row.role_title || getRoleTitleForRole(role),
    isProtectedOwner: row.email.toLowerCase().trim() === PRIMARY_OWNER_EMAIL,
    addedBy: row.added_by ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function maskCustomerName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return parts[0] || 'Student';
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

function maskUtrNumber(utr: string | undefined): string | undefined {
  if (!utr) return undefined;
  const clean = utr.trim();
  if (clean.length <= 4) return '••••';
  return `${'•'.repeat(Math.min(8, clean.length - 4))}${clean.slice(-4)}`;
}

export function toPublicTrackedOrder(order: Order): PublicTrackedOrder {
  return {
    id: order.id,
    createdAt: order.createdAt,
    customerName: maskCustomerName(order.customerName),
    rollNumber: order.rollNumber,
    handoverType: order.handoverType,
    deliveryAddress: order.deliveryAddress
      ? {
          city: order.deliveryAddress.city,
          state: order.deliveryAddress.state,
          pincode: order.deliveryAddress.pincode,
        }
      : undefined,
    hostelDetails: order.hostelDetails
      ? {
          hostelName: order.hostelDetails.hostelName,
        }
      : undefined,
    items: order.items.map((item) => ({
      name: item.name,
      color: item.color,
      size: item.size,
      price: item.price,
      quantity: item.quantity,
      image: item.image,
    })),
    total: order.total,
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    verificationStatus: order.verificationStatus,
    utrNumber: maskUtrNumber(order.utrNumber),
    verifiedBy: order.verifiedBy,
    verifiedAt: order.verifiedAt,
    cancelledAt: order.cancelledAt,
    cancellationReason: order.cancellationReason,
  };
}

function restoreOrderInventory(db: DatabaseSync, items: OrderItem[], now: string) {
  const byProduct = new Map<string, number>();
  for (const item of items) {
    if (!item.productId) continue;
    const qty = Math.max(0, Math.floor(Number(item.quantity) || 0));
    if (qty > 0) {
      byProduct.set(item.productId, (byProduct.get(item.productId) || 0) + qty);
    }
  }

  for (const [productId, restoreQty] of byProduct.entries()) {
    const product = getProductById(db, productId);
    if (!product) continue;
    const nextStock = Math.max(0, (product.stock ?? 0) + restoreQty);
    const nextInStock = nextStock > 0 ? 1 : 0;
    const nextVersion = (product.version ?? 1) + 1;
    const updatedProduct: Product = {
      ...product,
      stock: nextStock,
      inStock: nextInStock === 1,
      version: nextVersion,
    };
    db.prepare(
      `UPDATE products SET stock = ?, in_stock = ?, version = ?, data_json = ?, updated_at = ? WHERE id = ?`
    ).run(nextStock, nextInStock, nextVersion, JSON.stringify(updatedProduct), now, productId);
  }
}

export function validateCouponForSubtotal(
  db: DatabaseSync,
  rawCode: string,
  subtotal: number
): { valid: boolean; coupon?: Coupon; discountAmount: number; error?: string } {
  const code = sanitizeString(rawCode).toUpperCase();
  if (!code) {
    return { valid: false, discountAmount: 0, error: 'Please enter a coupon code.' };
  }

  const row = db
    .prepare(`SELECT * FROM coupons WHERE code = ? LIMIT 1`)
    .get(code) as unknown as CouponDbRow | undefined;

  if (!row) {
    return { valid: false, discountAmount: 0, error: 'Invalid or unrecognized coupon code.' };
  }

  const coupon = parseCouponRow(row);
  if (!coupon.isActive) {
    return { valid: false, discountAmount: 0, error: 'This coupon code is currently inactive.' };
  }

  if (coupon.expiresAt) {
    const expiresMs = Date.parse(coupon.expiresAt);
    if (Number.isFinite(expiresMs) && expiresMs < Date.now()) {
      return { valid: false, discountAmount: 0, error: 'This coupon code has expired.' };
    }
  }

  const safeSubtotal = Math.max(0, Number(subtotal) || 0);
  if (safeSubtotal < coupon.minOrderAmount) {
    return {
      valid: false,
      discountAmount: 0,
      error: `Minimum order value of ₹${coupon.minOrderAmount} required for this code.`,
    };
  }

  let discountAmount = 0;
  if (coupon.discountType === 'percentage') {
    discountAmount = Math.round((safeSubtotal * coupon.discountValue) / 100);
    if (coupon.maxDiscount && coupon.maxDiscount > 0) {
      discountAmount = Math.min(discountAmount, coupon.maxDiscount);
    }
  } else {
    discountAmount = coupon.discountValue;
  }
  discountAmount = Math.min(safeSubtotal, Math.max(0, discountAmount));

  return { valid: true, coupon, discountAmount };
}

export function createGenuineOrder(
  db: DatabaseSync,
  payload: Partial<CreateOrderPayload>,
  authContext: { authenticatedUserId?: string; sourceClientId?: string }
): { order: Order; idempotentReplay: boolean } {
  const customerName = sanitizeString(payload.customerName);
  const email = sanitizeString(payload.email).toLowerCase();
  const phone = sanitizeString(payload.phone).replace(/\D/g, '');

  if (!customerName || customerName.length < 2) {
    throw new OrderServiceError('Customer name is required (min 2 characters).', 400, 'INVALID_NAME');
  }
  if (!email || !email.includes('@') || email.length > 100) {
    throw new OrderServiceError('A valid email address is required.', 400, 'INVALID_EMAIL');
  }
  if (phone.length < 10) {
    throw new OrderServiceError('A valid 10-digit mobile number is required.', 400, 'INVALID_PHONE');
  }
  if (!payload.items || !Array.isArray(payload.items) || payload.items.length === 0) {
    throw new OrderServiceError('Order must include at least one item.', 400, 'EMPTY_ORDER');
  }

  const handoverType = payload.handoverType || 'makerspace_desk';
  if (!['makerspace_desk', 'home_delivery', 'hostel_delivery'].includes(handoverType)) {
    throw new OrderServiceError('Invalid handover type specified.', 400, 'INVALID_HANDOVER');
  }

  if (handoverType === 'home_delivery' || handoverType === 'hostel_delivery') {
    const addr = payload.deliveryAddress;
    if (
      !addr ||
      !sanitizeString(addr.addressLine) ||
      !sanitizeString(addr.city) ||
      !sanitizeString(addr.state) ||
      !sanitizeString(addr.pincode)
    ) {
      throw new OrderServiceError(
        'Delivery address, city, state, and PIN code are required for courier delivery.',
        400,
        'MISSING_ADDRESS'
      );
    }
  }

  const paymentMethod: Order['paymentMethod'] =
    payload.paymentMethod === 'cash_at_desk' ? 'cash_at_desk' : 'upi_razorpay';

  const cleanRoll = sanitizeString(payload.rollNumber).toUpperCase();
  const cleanUtr = paymentMethod === 'upi_razorpay' ? sanitizeString(payload.utrNumber) : '';
  const cleanReceipt =
    paymentMethod === 'upi_razorpay' ? sanitizeReceiptDataUrl(payload.paymentReceiptImage) : undefined;
  const cleanIdempotencyKey = sanitizeString(payload.idempotencyKey).slice(0, 120) || undefined;

  if (cleanUtr && !(/^[0-9]{12}$/.test(cleanUtr) || /^[A-Za-z0-9]{10,18}$/.test(cleanUtr))) {
    throw new OrderServiceError(
      'UPI Reference/UTR must be a valid 12-digit or 10–18 character alphanumeric transaction ID.',
      400,
      'INVALID_UTR'
    );
  }

  const txResult = runInTransaction(db, () => {
    if (cleanIdempotencyKey) {
      const existingByKey = db
        .prepare(`SELECT * FROM orders WHERE idempotency_key = ? LIMIT 1`)
        .get(cleanIdempotencyKey) as unknown as OrderDbRow | undefined;
      if (existingByKey) {
        return { order: parseOrderRow(existingByKey), idempotentReplay: true };
      }
    }

    if (cleanUtr) {
      const dupUtr = db
        .prepare(`SELECT id FROM orders WHERE utr_number = ? AND status != 'cancelled' LIMIT 1`)
        .get(cleanUtr) as { id: string } | undefined;
      if (dupUtr) {
        throw new OrderServiceError(
          'This UPI UTR has already been registered with another order. Duplicate payment proof rejected.',
          409,
          'DUPLICATE_UTR'
        );
      }
    }

    const requestedByProduct = new Map<string, number>();
    const orderItems: OrderItem[] = [];

    for (let idx = 0; idx < payload.items!.length; idx++) {
      const item = payload.items![idx];
      const qty = Math.max(1, Math.floor(Number(item.quantity) || 1));
      const trustedProduct = getProductById(db, item.productId);

      if (!trustedProduct) {
        throw new OrderServiceError(
          `Product "${sanitizeString(item.name) || item.productId}" is no longer available.`,
          409,
          'PRODUCT_UNAVAILABLE'
        );
      }

      const availableStock = Math.max(0, trustedProduct.stock ?? 50);
      const totalRequestedForProduct = (requestedByProduct.get(trustedProduct.id) || 0) + qty;
      requestedByProduct.set(trustedProduct.id, totalRequestedForProduct);

      if (trustedProduct.inStock === false || availableStock <= 0) {
        throw new OrderServiceError(`"${trustedProduct.name}" is out of stock.`, 409, 'OUT_OF_STOCK');
      }

      if (totalRequestedForProduct > availableStock) {
        throw new OrderServiceError(
          `Insufficient inventory for "${trustedProduct.name}": requested ${totalRequestedForProduct}, available ${availableStock}.`,
          409,
          'INSUFFICIENT_STOCK'
        );
      }

      const customDesign = normalizeCustomDesign(item.customDesign);
      orderItems.push({
        id: item.productId || `item-${idx + 1}`,
        productId: trustedProduct.id,
        name: trustedProduct.name,
        color: sanitizeString(item.color) || trustedProduct.colorways[0]?.name || 'Standard',
        size: sanitizeString(item.size) || trustedProduct.sizes[0] || 'Free Size',
        price: trustedProduct.price,
        quantity: qty,
        image: trustedProduct.image || '/assets/aistudio/nitrr_new_logo_new_155e66c7.png',
        customDesign,
      });
    }

    const now = new Date().toISOString();

    for (const [productId, qty] of requestedByProduct.entries()) {
      const prod = getProductById(db, productId)!;
      const nextStock = Math.max(0, (prod.stock ?? 50) - qty);
      const nextInStock = nextStock > 0 ? 1 : 0;
      const nextVersion = (prod.version ?? 1) + 1;
      const updatedJson = JSON.stringify({
        ...prod,
        stock: nextStock,
        inStock: nextInStock === 1,
        version: nextVersion,
      });
      db.prepare(
        `UPDATE products SET stock = ?, in_stock = ?, version = ?, data_json = ?, updated_at = ? WHERE id = ?`
      ).run(nextStock, nextInStock, nextVersion, updatedJson, now, productId);
    }

    const calculatedSubtotal = orderItems.reduce((acc, i) => acc + i.price * i.quantity, 0);
    const cleanCoupon = sanitizeString(payload.couponCode).toUpperCase() || undefined;
    let discountAmount = 0;
    let appliedCouponCode: string | undefined;

    if (cleanCoupon) {
      const couponCheck = validateCouponForSubtotal(db, cleanCoupon, calculatedSubtotal);
      if (!couponCheck.valid || !couponCheck.coupon) {
        throw new OrderServiceError(
          couponCheck.error || 'Coupon code is invalid or no longer eligible for this order.',
          400,
          'INVALID_COUPON'
        );
      }
      discountAmount = couponCheck.discountAmount;
      appliedCouponCode = couponCheck.coupon.code;
      db.prepare(`UPDATE coupons SET usage_count = usage_count + 1, updated_at = ? WHERE code = ?`).run(
        now,
        couponCheck.coupon.code
      );
    }

    const finalTotal = Math.max(0, calculatedSubtotal - discountAmount);

    let orderId = '';
    for (let attempt = 0; attempt < 5; attempt++) {
      const randomSuffix = Math.floor(10000 + Math.random() * 90000);
      const candidate = `NITRR-${new Date().getFullYear()}-${randomSuffix}`;
      const clash = db.prepare(`SELECT 1 FROM orders WHERE id = ? LIMIT 1`).get(candidate);
      if (!clash) {
        orderId = candidate;
        break;
      }
    }
    if (!orderId) {
      orderId = `NITRR-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
    }

    // Strict Payment Integrity: UPI orders with UTR or receipt begin in pending_verification until officer confirms
    const paymentStatus: Order['paymentStatus'] =
      paymentMethod === 'cash_at_desk' ? 'pay_on_handover' : 'pending_verification';
    const verificationStatus: Order['verificationStatus'] =
      paymentMethod === 'cash_at_desk'
        ? 'unverified'
        : cleanUtr
          ? 'utr_submitted'
          : cleanReceipt
            ? 'whatsapp_verified'
            : 'unverified';

    const order: Order = {
      id: orderId,
      createdAt: now,
      customerName,
      rollNumber: cleanRoll,
      email,
      phone,
      handoverType,
      deliveryAddress:
        handoverType === 'home_delivery' || handoverType === 'hostel_delivery'
          ? {
              addressLine: sanitizeString(payload.deliveryAddress?.addressLine),
              city: sanitizeString(payload.deliveryAddress?.city),
              state: sanitizeString(payload.deliveryAddress?.state),
              pincode: sanitizeString(payload.deliveryAddress?.pincode),
              landmark: sanitizeString(payload.deliveryAddress?.landmark),
            }
          : undefined,
      pickupDeskDetails:
        handoverType === 'makerspace_desk'
          ? {
              desk: 'Makerspace Desk (Ground Floor, Main Bldg)',
              timing: '4:00 PM – 7:30 PM (Mon–Sat)',
            }
          : undefined,
      hostelDetails:
        handoverType === 'hostel_delivery' && payload.hostelDetails
          ? {
              hostelName: sanitizeString(payload.hostelDetails.hostelName),
              roomNumber: sanitizeString(payload.hostelDetails.roomNumber),
            }
          : undefined,
      items: orderItems,
      subtotal: calculatedSubtotal,
      discountAmount: discountAmount > 0 ? discountAmount : undefined,
      couponCode: appliedCouponCode,
      handoverFee: 0,
      total: finalTotal,
      status: 'confirmed',
      paymentMethod,
      paymentStatus,
      verificationStatus,
      utrNumber: cleanUtr || undefined,
      paymentReceiptImage: cleanReceipt,
      whatsappVerified: Boolean(cleanReceipt),
      version: 1,
      idempotencyKey: cleanIdempotencyKey,
      refundStatus: 'none',
      updatedAt: now,
    };

    db.prepare(`
      INSERT INTO orders (
        id, user_id, utr_number, idempotency_key, status, total, version,
        cancelled_at, cancellation_reason, refund_status, updated_by,
        payload_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL, 'none', NULL, ?, ?, ?)
    `).run(
      order.id,
      authContext.authenticatedUserId || null,
      order.utrNumber || null,
      cleanIdempotencyKey || null,
      order.status,
      order.total,
      1,
      JSON.stringify(order),
      now,
      now
    );

    recordAuditLog(db, {
      officerEmail: email,
      action: 'ORDER_CREATED',
      targetId: order.id,
      details: `Genuine customer order placed for ₹${order.total} (${order.items.length} line item(s), ${paymentMethod === 'cash_at_desk' ? 'Cash at Desk' : cleanUtr ? `UTR ${cleanUtr} awaiting verification` : 'UPI awaiting verification'}).`,
    });

    return { order, idempotentReplay: false };
  });

  if (!txResult.idempotentReplay) {
    if (authContext.authenticatedUserId) {
      clearUserCart(db, authContext.authenticatedUserId, authContext.sourceClientId);
    }
    bumpAdminVersion(db, 'order_created', email, txResult.order.id, authContext.sourceClientId);
    broadcastCatalogEvent({
      type: 'catalog_updated',
      reason: 'order_stock_reserved',
      updatedAt: txResult.order.updatedAt || new Date().toISOString(),
    });
  }

  return txResult;
}

export function verifyOrderPayment(
  db: DatabaseSync,
  params: {
    orderId: string;
    utrNumber?: string;
    expectedVersion?: number;
    verifiedByLabel: string;
    actorEmail: string;
    sourceClientId?: string;
  }
): { order: Order; version: number } {
  const cleanOrderId = sanitizeString(params.orderId);
  if (!cleanOrderId) {
    throw new OrderServiceError('orderId is required for payment verification.', 400, 'MISSING_ORDER_ID');
  }
  const cleanUtr = sanitizeString(params.utrNumber);

  const txResult = runInTransaction(db, () => {
    const row = db
      .prepare(`SELECT * FROM orders WHERE id = ? LIMIT 1`)
      .get(cleanOrderId) as unknown as OrderDbRow | undefined;

    if (!row) {
      throw new OrderServiceError(`Order ${cleanOrderId} was not found.`, 404, 'ORDER_NOT_FOUND');
    }

    if (typeof params.expectedVersion === 'number' && row.version !== params.expectedVersion) {
      throw new OrderServiceError(
        `Order ${cleanOrderId} was modified by another administrator. Please review the refreshed state.`,
        409,
        'VERSION_CONFLICT'
      );
    }

    const current = parseOrderRow(row);
    if (current.status === 'cancelled') {
      throw new OrderServiceError(
        'Cannot verify payment on a cancelled order.',
        409,
        'ORDER_CANCELLED'
      );
    }

    if (cleanUtr) {
      const dupUtr = db
        .prepare(`SELECT id FROM orders WHERE utr_number = ? AND id != ? AND status != 'cancelled' LIMIT 1`)
        .get(cleanUtr, cleanOrderId) as { id: string } | undefined;
      if (dupUtr) {
        throw new OrderServiceError(
          `UTR ${cleanUtr} is already assigned to order ${dupUtr.id}.`,
          409,
          'DUPLICATE_UTR'
        );
      }
    }

    const now = new Date().toISOString();
    const nextVersion = row.version + 1;
    const nextStatus: Order['status'] = current.status === 'confirmed' ? 'preparing' : current.status;
    const nextUtr = cleanUtr || current.utrNumber || 'Verified by Officer';

    const updated: Order = {
      ...current,
      utrNumber: nextUtr,
      verificationStatus: 'desk_verified',
      paymentStatus: 'paid',
      status: nextStatus,
      verifiedBy: params.verifiedByLabel,
      verifiedAt: now,
      version: nextVersion,
      updatedBy: params.actorEmail,
      updatedAt: now,
    };

    db.prepare(`
      UPDATE orders
      SET utr_number = ?, status = ?, version = ?, updated_by = ?, payload_json = ?, updated_at = ?
      WHERE id = ?
    `).run(
      updated.utrNumber || null,
      updated.status,
      nextVersion,
      params.actorEmail,
      JSON.stringify(updated),
      now,
      cleanOrderId
    );

    recordAuditLog(db, {
      officerEmail: params.actorEmail,
      action: 'PAYMENT_VERIFIED',
      targetId: cleanOrderId,
      details: `Verified payment${updated.utrNumber ? ` (UTR ${updated.utrNumber})` : ''} and marked order as paid.`,
    });

    return updated;
  });

  const meta = bumpAdminVersion(
    db,
    'payment_verified',
    params.actorEmail,
    cleanOrderId,
    params.sourceClientId
  );

  return { order: txResult, version: meta.version };
}

export function bulkVerifyPendingOrders(
  db: DatabaseSync,
  params: {
    verifiedByLabel: string;
    actorEmail: string;
    sourceClientId?: string;
  }
): { verifiedCount: number; orders: Order[]; version: number } {
  const verifiedOrders = runInTransaction(db, () => {
    const rows = db
      .prepare(`SELECT * FROM orders WHERE status != 'cancelled' ORDER BY created_at DESC`)
      .all() as unknown as OrderDbRow[];

    const now = new Date().toISOString();
    const updatedList: Order[] = [];

    for (const row of rows) {
      const order = parseOrderRow(row);
      if (order.verificationStatus !== 'utr_submitted') continue;

      const nextVersion = row.version + 1;
      const nextStatus: Order['status'] = order.status === 'confirmed' ? 'preparing' : order.status;
      const updated: Order = {
        ...order,
        verificationStatus: 'desk_verified',
        paymentStatus: 'paid',
        status: nextStatus,
        verifiedBy: params.verifiedByLabel,
        verifiedAt: now,
        version: nextVersion,
        updatedBy: params.actorEmail,
        updatedAt: now,
      };

      db.prepare(`
        UPDATE orders
        SET status = ?, version = ?, updated_by = ?, payload_json = ?, updated_at = ?
        WHERE id = ?
      `).run(updated.status, nextVersion, params.actorEmail, JSON.stringify(updated), now, order.id);

      updatedList.push(updated);
    }

    if (updatedList.length > 0) {
      recordAuditLog(db, {
        officerEmail: params.actorEmail,
        action: 'PAYMENT_VERIFIED',
        targetId: updatedList.map((o) => o.id).join(', '),
        details: `Bulk verified ${updatedList.length} pending UTR order(s).`,
      });
    }

    return updatedList;
  });

  const meta =
    verifiedOrders.length > 0
      ? bumpAdminVersion(db, 'bulk_verify_payments', params.actorEmail, undefined, params.sourceClientId)
      : getAdminMeta(db);

  return {
    verifiedCount: verifiedOrders.length,
    orders: verifiedOrders,
    version: meta.version,
  };
}

const VALID_ORDER_STATUSES: ReadonlyArray<Order['status']> = [
  'confirmed',
  'preparing',
  'ready_for_handover',
  'delivered',
  'cancelled',
];

export function updateOrderStatusAdmin(
  db: DatabaseSync,
  params: {
    orderId: string;
    status: Order['status'];
    cancellationReason?: string;
    expectedVersion?: number;
    actorEmail: string;
    sourceClientId?: string;
  }
): { order: Order; version: number } {
  const cleanOrderId = sanitizeString(params.orderId);
  if (!cleanOrderId || !VALID_ORDER_STATUSES.includes(params.status)) {
    throw new OrderServiceError('Valid orderId and order status are required.', 400, 'INVALID_STATUS');
  }

  const updated = runInTransaction(db, () => {
    const row = db
      .prepare(`SELECT * FROM orders WHERE id = ? LIMIT 1`)
      .get(cleanOrderId) as unknown as OrderDbRow | undefined;

    if (!row) {
      throw new OrderServiceError(`Order ${cleanOrderId} not found.`, 404, 'ORDER_NOT_FOUND');
    }

    if (typeof params.expectedVersion === 'number' && row.version !== params.expectedVersion) {
      throw new OrderServiceError(
        `Order ${cleanOrderId} was updated by another administrator. Syncing latest state.`,
        409,
        'VERSION_CONFLICT'
      );
    }

    const current = parseOrderRow(row);
    if (current.status === 'cancelled' && params.status !== 'cancelled') {
      throw new OrderServiceError(
        'Cancelled orders cannot be reactivated after inventory restoration.',
        409,
        'ALREADY_CANCELLED'
      );
    }

    const now = new Date().toISOString();
    const nextVersion = row.version + 1;
    const isCancelling = current.status !== 'cancelled' && params.status === 'cancelled';

    let nextOrder: Order = {
      ...current,
      status: params.status,
      version: nextVersion,
      updatedBy: params.actorEmail,
      updatedAt: now,
    };

    if (isCancelling) {
      restoreOrderInventory(db, current.items, now);
      const reason = sanitizeString(params.cancellationReason) || 'Cancelled by store administrator';
      const refundNeeded = current.paymentStatus === 'paid';
      nextOrder = {
        ...nextOrder,
        cancelledAt: now,
        cancellationReason: reason,
        refundStatus: refundNeeded ? 'pending' : 'none',
        refundAmount: refundNeeded ? current.total : 0,
      };
    }

    db.prepare(`
      UPDATE orders
      SET status = ?, version = ?, cancelled_at = ?, cancellation_reason = ?,
          refund_status = ?, updated_by = ?, payload_json = ?, updated_at = ?
      WHERE id = ?
    `).run(
      nextOrder.status,
      nextVersion,
      nextOrder.cancelledAt || null,
      nextOrder.cancellationReason || null,
      nextOrder.refundStatus || 'none',
      params.actorEmail,
      JSON.stringify(nextOrder),
      now,
      cleanOrderId
    );

    recordAuditLog(db, {
      officerEmail: params.actorEmail,
      action: isCancelling ? 'ORDER_CANCELLED' : 'ORDER_STATUS_UPDATE',
      targetId: cleanOrderId,
      details: isCancelling
        ? `Cancelled order and restored stock (${nextOrder.cancellationReason}).${nextOrder.refundStatus === 'pending' ? ` Refund ₹${nextOrder.refundAmount} flagged as pending.` : ''}`
        : `Updated order status from ${current.status} to ${params.status}.`,
    });

    return nextOrder;
  });

  const meta = bumpAdminVersion(
    db,
    params.status === 'cancelled' ? 'order_cancelled' : 'order_status_updated',
    params.actorEmail,
    cleanOrderId,
    params.sourceClientId
  );

  if (params.status === 'cancelled') {
    broadcastCatalogEvent({
      type: 'catalog_updated',
      reason: 'order_cancelled_stock_restored',
      updatedAt: meta.updatedAt,
    });
  }

  return { order: updated, version: meta.version };
}

export function deleteOrderAdmin(
  db: DatabaseSync,
  params: {
    orderId: string;
    expectedVersion?: number;
    actorEmail: string;
    sourceClientId?: string;
  }
): { deletedOrderId: string; version: number } {
  const cleanOrderId = sanitizeString(params.orderId);
  if (!cleanOrderId) {
    throw new OrderServiceError('orderId is required to delete an order record.', 400, 'MISSING_ORDER_ID');
  }

  runInTransaction(db, () => {
    const row = db
      .prepare(`SELECT * FROM orders WHERE id = ? LIMIT 1`)
      .get(cleanOrderId) as unknown as OrderDbRow | undefined;

    if (!row) {
      throw new OrderServiceError(`Order ${cleanOrderId} not found.`, 404, 'ORDER_NOT_FOUND');
    }

    if (typeof params.expectedVersion === 'number' && row.version !== params.expectedVersion) {
      throw new OrderServiceError(
        `Order ${cleanOrderId} was modified by another administrator before deletion.`,
        409,
        'VERSION_CONFLICT'
      );
    }

    const order = parseOrderRow(row);
    const now = new Date().toISOString();
    if (order.status !== 'cancelled') {
      restoreOrderInventory(db, order.items, now);
    }

    db.prepare(`DELETE FROM orders WHERE id = ?`).run(cleanOrderId);

    recordAuditLog(db, {
      officerEmail: params.actorEmail,
      action: 'ORDER_DELETED',
      targetId: cleanOrderId,
      details: `Deleted order record (${order.customerName}, ₹${order.total})${order.status !== 'cancelled' ? ' and restored stock' : ''}.`,
    });
  });

  const meta = bumpAdminVersion(
    db,
    'order_deleted',
    params.actorEmail,
    cleanOrderId,
    params.sourceClientId
  );

  broadcastCatalogEvent({
    type: 'catalog_updated',
    reason: 'order_deleted_stock_restored',
    updatedAt: meta.updatedAt,
  });

  return { deletedOrderId: cleanOrderId, version: meta.version };
}

export function listOrdersAdmin(db: DatabaseSync): Order[] {
  const rows = db
    .prepare(`SELECT * FROM orders ORDER BY created_at DESC`)
    .all() as unknown as OrderDbRow[];
  return rows.map(parseOrderRow);
}

export function listCustomerOrders(db: DatabaseSync, userId: string): Order[] {
  const rows = db
    .prepare(`SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC`)
    .all(userId) as unknown as OrderDbRow[];
  return rows.map(parseOrderRow);
}

export function lookupPublicTrackedOrder(db: DatabaseSync, rawQuery: string): PublicTrackedOrder | null {
  const q = sanitizeString(rawQuery);
  if (!q) return null;

  const upper = q.toUpperCase();
  const digits = q.replace(/\D/g, '');

  const byId = db
    .prepare(`SELECT * FROM orders WHERE UPPER(id) = ? LIMIT 1`)
    .get(upper) as unknown as OrderDbRow | undefined;

  if (byId) return toPublicTrackedOrder(parseOrderRow(byId));

  const rows = db
    .prepare(`SELECT * FROM orders ORDER BY created_at DESC`)
    .all() as unknown as OrderDbRow[];

  for (const row of rows) {
    const order = parseOrderRow(row);
    if (order.rollNumber && order.rollNumber.toUpperCase() === upper) {
      return toPublicTrackedOrder(order);
    }
    if (digits.length === 10 && order.phone.replace(/\D/g, '').endsWith(digits)) {
      return toPublicTrackedOrder(order);
    }
  }

  return null;
}

export function listCoupons(db: DatabaseSync): Coupon[] {
  const rows = db
    .prepare(`SELECT * FROM coupons ORDER BY created_at DESC, code ASC`)
    .all() as unknown as CouponDbRow[];
  return rows.map(parseCouponRow);
}

export function createCouponAdmin(
  db: DatabaseSync,
  input: Omit<Coupon, 'usageCount'>,
  actorEmail: string,
  sourceClientId?: string
): { coupon: Coupon; version: number } {
  const code = sanitizeString(input.code).toUpperCase().replace(/\s+/g, '');
  if (!code || code.length < 3) {
    throw new OrderServiceError('Coupon code must be at least 3 characters.', 400, 'INVALID_COUPON');
  }
  const discountType = input.discountType === 'fixed' ? 'fixed' : 'percentage';
  const discountValue = Math.max(1, Math.round(Number(input.discountValue) || 0));
  if (discountType === 'percentage' && discountValue > 90) {
    throw new OrderServiceError('Percentage discount cannot exceed 90%.', 400, 'INVALID_COUPON');
  }
  const minOrderAmount = Math.max(0, Math.round(Number(input.minOrderAmount) || 0));
  const maxDiscount =
    typeof input.maxDiscount === 'number' && input.maxDiscount > 0
      ? Math.round(input.maxDiscount)
      : undefined;
  const expiresAt = sanitizeString(input.expiresAt) || undefined;
  const description = sanitizeString(input.description) || `${code} official promotion`;

  const created = runInTransaction(db, () => {
    const existing = db.prepare(`SELECT code FROM coupons WHERE code = ? LIMIT 1`).get(code);
    if (existing) {
      throw new OrderServiceError(`Coupon code "${code}" already exists.`, 409, 'COUPON_EXISTS');
    }
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO coupons (
        code, discount_type, discount_value, min_order_amount, max_discount,
        expires_at, is_active, usage_count, description, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)
    `).run(
      code,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscount ?? null,
      expiresAt ?? null,
      input.isActive === false ? 0 : 1,
      description,
      now,
      now
    );

    recordAuditLog(db, {
      officerEmail: actorEmail,
      action: 'COUPON_CREATED',
      targetId: code,
      details: `Created promo code ${code} (${discountType === 'percentage' ? `${discountValue}%` : `₹${discountValue}`} off, min order ₹${minOrderAmount}).`,
    });

    const row = db.prepare(`SELECT * FROM coupons WHERE code = ?`).get(code) as unknown as CouponDbRow;
    return parseCouponRow(row);
  });

  const meta = bumpAdminVersion(db, 'coupon_created', actorEmail, code, sourceClientId);
  return { coupon: created, version: meta.version };
}

export function toggleCouponAdmin(
  db: DatabaseSync,
  rawCode: string,
  actorEmail: string,
  sourceClientId?: string
): { coupon: Coupon; version: number } {
  const code = sanitizeString(rawCode).toUpperCase();
  if (!code) {
    throw new OrderServiceError('Coupon code is required.', 400, 'INVALID_COUPON');
  }

  const toggled = runInTransaction(db, () => {
    const row = db
      .prepare(`SELECT * FROM coupons WHERE code = ? LIMIT 1`)
      .get(code) as unknown as CouponDbRow | undefined;

    if (!row) {
      throw new OrderServiceError(`Coupon "${code}" not found.`, 404, 'COUPON_NOT_FOUND');
    }

    const nextActive = row.is_active === 1 ? 0 : 1;
    const now = new Date().toISOString();
    db.prepare(`UPDATE coupons SET is_active = ?, updated_at = ? WHERE code = ?`).run(
      nextActive,
      now,
      code
    );

    recordAuditLog(db, {
      officerEmail: actorEmail,
      action: 'COUPON_TOGGLED',
      targetId: code,
      details: `${nextActive === 1 ? 'Activated' : 'Deactivated'} promo code ${code}.`,
    });

    const updated = db.prepare(`SELECT * FROM coupons WHERE code = ?`).get(code) as unknown as CouponDbRow;
    return parseCouponRow(updated);
  });

  const meta = bumpAdminVersion(db, 'coupon_toggled', actorEmail, code, sourceClientId);
  return { coupon: toggled, version: meta.version };
}

export function updateCouponAdmin(
  db: DatabaseSync,
  rawCode: string,
  updates: Partial<Omit<Coupon, 'code' | 'usageCount'>>,
  actorEmail: string,
  sourceClientId?: string
): { coupon: Coupon; version: number } {
  const code = sanitizeString(rawCode).toUpperCase();
  if (!code) {
    throw new OrderServiceError('Coupon code is required.', 400, 'INVALID_COUPON');
  }

  const updated = runInTransaction(db, () => {
    const row = db
      .prepare(`SELECT * FROM coupons WHERE code = ? LIMIT 1`)
      .get(code) as unknown as CouponDbRow | undefined;

    if (!row) {
      throw new OrderServiceError(`Coupon "${code}" not found.`, 404, 'COUPON_NOT_FOUND');
    }

    const discountType =
      updates.discountType === 'fixed' || updates.discountType === 'percentage'
        ? updates.discountType
        : row.discount_type;
    const discountValue =
      updates.discountValue !== undefined
        ? Math.max(1, Math.round(Number(updates.discountValue) || 0))
        : row.discount_value;
    if (discountType === 'percentage' && discountValue > 90) {
      throw new OrderServiceError('Percentage discount cannot exceed 90%.', 400, 'INVALID_COUPON');
    }
    const minOrderAmount =
      updates.minOrderAmount !== undefined
        ? Math.max(0, Math.round(Number(updates.minOrderAmount) || 0))
        : row.min_order_amount;
    const maxDiscount =
      discountType === 'fixed'
        ? null
        : updates.maxDiscount !== undefined
          ? typeof updates.maxDiscount === 'number' && updates.maxDiscount > 0
            ? Math.round(updates.maxDiscount)
            : null
          : row.max_discount;
    const expiresAt =
      updates.expiresAt !== undefined
        ? sanitizeString(updates.expiresAt) || null
        : row.expires_at;
    const isActive =
      updates.isActive !== undefined ? (updates.isActive ? 1 : 0) : row.is_active;
    const description =
      updates.description !== undefined
        ? sanitizeString(updates.description) || `${code} official promotion`
        : row.description;

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE coupons
      SET discount_type = ?, discount_value = ?, min_order_amount = ?, max_discount = ?,
          expires_at = ?, is_active = ?, description = ?, updated_at = ?
      WHERE code = ?
    `).run(
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscount,
      expiresAt,
      isActive,
      description,
      now,
      code
    );

    recordAuditLog(db, {
      officerEmail: actorEmail,
      action: 'COUPON_UPDATED',
      targetId: code,
      details: `Updated promo code ${code} (${discountType === 'percentage' ? `${discountValue}%` : `₹${discountValue}`} off, min order ₹${minOrderAmount}, ${isActive ? 'active' : 'disabled'}).`,
    });

    const nextRow = db.prepare(`SELECT * FROM coupons WHERE code = ?`).get(code) as unknown as CouponDbRow;
    return parseCouponRow(nextRow);
  });

  const meta = bumpAdminVersion(db, 'coupon_updated', actorEmail, code, sourceClientId);
  return { coupon: updated, version: meta.version };
}

export function deleteCouponAdmin(
  db: DatabaseSync,
  rawCode: string,
  actorEmail: string,
  sourceClientId?: string
): { deletedCode: string; version: number } {
  const code = sanitizeString(rawCode).toUpperCase();
  if (!code) {
    throw new OrderServiceError('Coupon code is required.', 400, 'INVALID_COUPON');
  }

  runInTransaction(db, () => {
    const existing = db.prepare(`SELECT code FROM coupons WHERE code = ? LIMIT 1`).get(code);
    if (!existing) {
      throw new OrderServiceError(`Coupon "${code}" not found.`, 404, 'COUPON_NOT_FOUND');
    }

    db.prepare(`DELETE FROM coupons WHERE code = ?`).run(code);
    recordAuditLog(db, {
      officerEmail: actorEmail,
      action: 'COUPON_DELETED',
      targetId: code,
      details: `Deleted promo code ${code} from catalog promotions.`,
    });
  });

  const meta = bumpAdminVersion(db, 'coupon_deleted', actorEmail, code, sourceClientId);
  return { deletedCode: code, version: meta.version };
}

export function listStaffRoster(db: DatabaseSync): StaffMember[] {
  const rows = db
    .prepare(`SELECT * FROM staff_roster ORDER BY created_at ASC, email ASC`)
    .all() as unknown as StaffRosterDbRow[];
  return rows.map(parseStaffRow);
}

export function addStaffMemberAdmin(
  db: DatabaseSync,
  params: {
    email: string;
    role?: AdminUser['role'];
    actorEmail: string;
    sourceClientId?: string;
  }
): { staff: StaffMember; version: number } {
  const email = sanitizeString(params.email).toLowerCase();
  if (!email || !email.includes('@')) {
    throw new OrderServiceError('A valid institutional email address is required.', 400, 'INVALID_EMAIL');
  }

  const role = normalizeAdminRole(params.role || 'operations_lead');
  const roleTitle = getRoleTitleForRole(role);

  const member = runInTransaction(db, () => {
    const existing = db.prepare(`SELECT email FROM staff_roster WHERE email = ? LIMIT 1`).get(email);
    if (existing) {
      throw new OrderServiceError(`${email} is already registered on the staff roster.`, 409, 'STAFF_EXISTS');
    }
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO staff_roster (email, role, role_title, added_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(email, role, roleTitle, params.actorEmail, now, now);

    recordAuditLog(db, {
      officerEmail: params.actorEmail,
      action: 'STAFF_ADDED',
      targetId: email,
      details: `Added ${email} to central staff roster as ${roleTitle}.`,
    });

    const row = db
      .prepare(`SELECT * FROM staff_roster WHERE email = ?`)
      .get(email) as unknown as StaffRosterDbRow;
    return parseStaffRow(row);
  });

  const meta = bumpAdminVersion(db, 'staff_added', params.actorEmail, email, params.sourceClientId);
  return { staff: member, version: meta.version };
}

export function updateStaffRoleAdmin(
  db: DatabaseSync,
  params: {
    email: string;
    role: AdminUser['role'];
    actorEmail: string;
    sourceClientId?: string;
  }
): { staff: StaffMember; version: number } {
  const email = sanitizeString(params.email).toLowerCase();
  if (!email || !email.includes('@')) {
    throw new OrderServiceError('Valid staff email is required.', 400, 'INVALID_EMAIL');
  }
  if (email === PRIMARY_OWNER_EMAIL) {
    throw new OrderServiceError(
      'Primary owner role is permanently locked to Super Administrator.',
      403,
      'PROTECTED_OWNER'
    );
  }

  const role = normalizeAdminRole(params.role);
  const roleTitle = getRoleTitleForRole(role);

  const updated = runInTransaction(db, () => {
    const existing = db
      .prepare(`SELECT * FROM staff_roster WHERE email = ? LIMIT 1`)
      .get(email) as unknown as StaffRosterDbRow | undefined;

    if (!existing) {
      throw new OrderServiceError(`${email} was not found on the staff roster.`, 404, 'STAFF_NOT_FOUND');
    }

    const now = new Date().toISOString();
    db.prepare(`UPDATE staff_roster SET role = ?, role_title = ?, updated_at = ? WHERE email = ?`).run(
      role,
      roleTitle,
      now,
      email
    );

    recordAuditLog(db, {
      officerEmail: params.actorEmail,
      action: 'STAFF_ROLE_UPDATED',
      targetId: email,
      details: `Updated ${email} role from ${existing.role_title} to ${roleTitle}.`,
    });

    const row = db
      .prepare(`SELECT * FROM staff_roster WHERE email = ?`)
      .get(email) as unknown as StaffRosterDbRow;
    return parseStaffRow(row);
  });

  const meta = bumpAdminVersion(db, 'staff_role_updated', params.actorEmail, email, params.sourceClientId);
  return { staff: updated, version: meta.version };
}

export function removeStaffMemberAdmin(
  db: DatabaseSync,
  params: {
    email: string;
    actorEmail: string;
    sourceClientId?: string;
  }
): { removedEmail: string; version: number } {
  const email = sanitizeString(params.email).toLowerCase();
  if (!email) {
    throw new OrderServiceError('Staff email is required.', 400, 'INVALID_EMAIL');
  }
  if (email === PRIMARY_OWNER_EMAIL) {
    throw new OrderServiceError('Primary owner account cannot be removed.', 403, 'PROTECTED_OWNER');
  }
  if (email === params.actorEmail.toLowerCase().trim()) {
    throw new OrderServiceError('You cannot remove your own active staff account.', 400, 'SELF_REMOVE_BLOCKED');
  }

  runInTransaction(db, () => {
    const existing = db.prepare(`SELECT email FROM staff_roster WHERE email = ? LIMIT 1`).get(email);
    if (!existing) {
      throw new OrderServiceError(`${email} is not on the staff roster.`, 404, 'STAFF_NOT_FOUND');
    }

    db.prepare(`DELETE FROM staff_roster WHERE email = ?`).run(email);
    recordAuditLog(db, {
      officerEmail: params.actorEmail,
      action: 'STAFF_REMOVED',
      targetId: email,
      details: `Removed ${email} from central staff roster.`,
    });
  });

  const meta = bumpAdminVersion(db, 'staff_removed', params.actorEmail, email, params.sourceClientId);
  return { removedEmail: email, version: meta.version };
}

export function listAuditLogs(db: DatabaseSync, limit = 150): AuditLogEntry[] {
  const rows = db
    .prepare(`SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ?`)
    .all(limit) as unknown as AuditLogDbRow[];

  return rows.map((row) => ({
    id: row.id,
    timestamp: row.timestamp,
    officerEmail: row.officer_email,
    action: row.action,
    targetId: row.target_id ?? undefined,
    details: row.details,
  }));
}

function parseBoundaryMs(raw: string | undefined, isEnd: boolean): number | null {
  if (!raw || !raw.trim()) return null;
  const trimmed = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const ms = Date.parse(`${trimmed}${isEnd ? 'T23:59:59.999Z' : 'T00:00:00.000Z'}`);
    return Number.isFinite(ms) ? ms : null;
  }
  const ms = Date.parse(trimmed);
  return Number.isFinite(ms) ? ms : null;
}

export function computeAdminDashboard(
  db: DatabaseSync,
  filters: { from?: string; to?: string } = {}
): AdminDashboardPayload {
  const allOrders = listOrdersAdmin(db);
  const products = getAllCatalogProducts(db);
  const coupons = listCoupons(db);
  const auditLogs = listAuditLogs(db);
  const staffRoster = listStaffRoster(db);
  const meta = getAdminMeta(db);

  const fromMs = parseBoundaryMs(filters.from, false);
  const toMs = parseBoundaryMs(filters.to, true);

  const orders = allOrders.filter((o) => {
    const createdMs = Date.parse(o.createdAt);
    if (!Number.isFinite(createdMs)) return true;
    if (fromMs !== null && createdMs < fromMs) return false;
    if (toMs !== null && createdMs > toMs) return false;
    return true;
  });

  const activeOrders = orders.filter((o) => o.status !== 'cancelled');
  const lowStockCount = products.filter((p) => {
    const stock = Math.max(0, p.stock ?? 50);
    return p.inStock !== false && stock > 0 && stock <= 5;
  }).length;
  const outOfStockCount = products.filter((p) => p.inStock === false || (p.stock ?? 50) <= 0).length;

  const stats: AdminDashboardStats = {
    totalCount: orders.length,
    confirmedCount: orders.filter((o) => o.status === 'confirmed').length,
    pendingVerificationCount: activeOrders.filter((o) => o.paymentStatus !== 'paid').length,
    preparingCount: orders.filter((o) => o.status === 'preparing').length,
    readyCount: orders.filter((o) => o.status === 'ready_for_handover').length,
    deliveredCount: orders.filter((o) => o.status === 'delivered').length,
    cancelledCount: orders.filter((o) => o.status === 'cancelled').length,
    hostelDeliveries: activeOrders.filter((o) => o.handoverType === 'hostel_delivery').length,
    courierDeliveries: activeOrders.filter((o) => o.handoverType === 'home_delivery').length,
    deskPickups: activeOrders.filter((o) => o.handoverType === 'makerspace_desk').length,
    verifiedPayments: activeOrders.filter((o) => o.paymentStatus === 'paid').length,
    grossRevenue: activeOrders.reduce((sum, o) => sum + o.total, 0),
    verifiedRevenue: activeOrders
      .filter((o) => o.paymentStatus === 'paid')
      .reduce((sum, o) => sum + o.total, 0),
    pendingRevenue: activeOrders
      .filter((o) => o.paymentStatus !== 'paid')
      .reduce((sum, o) => sum + o.total, 0),
    lowStockCount,
    outOfStockCount,
  };

  // Derive genuine customer roster strictly from persisted orders (excluding cancelled orders from spend)
  const customerMap = new Map<string, CustomerSummary>();
  for (const order of orders) {
    const key = (order.email || order.rollNumber || order.id).toLowerCase().trim();
    const isCancelled = order.status === 'cancelled';
    const existing = customerMap.get(key);
    if (!existing) {
      customerMap.set(key, {
        id: key,
        name: order.customerName,
        rollNumber: order.rollNumber,
        email: order.email,
        phone: order.phone,
        orderCount: isCancelled ? 0 : 1,
        totalSpent: isCancelled ? 0 : order.total,
        lastOrderDate: order.createdAt,
        lastDeliveryType: order.handoverType,
        lastOrderStatus: order.status,
      });
    } else {
      if (!isCancelled) {
        existing.orderCount += 1;
        existing.totalSpent += order.total;
      }
      if (order.createdAt > existing.lastOrderDate) {
        existing.lastOrderDate = order.createdAt;
        existing.lastDeliveryType = order.handoverType;
        existing.lastOrderStatus = order.status;
      }
    }
  }

  const customers = Array.from(customerMap.values()).sort((a, b) =>
    b.lastOrderDate.localeCompare(a.lastOrderDate)
  );

  // Operational alerts computed centrally for all administrators
  const alerts: AdminOperationalAlert[] = [];
  const pendingUtrCount = activeOrders.filter((o) => o.verificationStatus === 'utr_submitted').length;
  if (pendingUtrCount > 0) {
    alerts.push({
      id: 'alert-pending-utr',
      severity: 'warning',
      title: `${pendingUtrCount} UPI payment(s) awaiting officer verification`,
      description: 'Verify submitted 12-digit UTR numbers in Verification Desk before dispatching.',
      targetTab: 'verification',
    });
  }

  const pendingRefundCount = orders.filter(
    (o) => o.status === 'cancelled' && o.refundStatus === 'pending'
  ).length;
  if (pendingRefundCount > 0) {
    alerts.push({
      id: 'alert-pending-refunds',
      severity: 'critical',
      title: `${pendingRefundCount} cancelled paid order(s) require refund settlement`,
      description: 'Review cancelled orders in the Order Ledger to process customer refunds.',
      targetTab: 'orders',
    });
  }

  if (outOfStockCount > 0) {
    alerts.push({
      id: 'alert-out-of-stock',
      severity: 'critical',
      title: `${outOfStockCount} catalog SKU(s) are currently out of stock`,
      description: 'Restock or archive depleted items in the Inventory tab.',
      targetTab: 'inventory',
    });
  } else if (lowStockCount > 0) {
    alerts.push({
      id: 'alert-low-stock',
      severity: 'warning',
      title: `${lowStockCount} catalog SKU(s) running low (≤ 5 units left)`,
      description: 'Check stock levels in the Inventory tab to prevent checkout shortages.',
      targetTab: 'inventory',
    });
  }

  return {
    orders,
    stats,
    products,
    coupons,
    customers,
    auditLogs,
    staffRoster,
    alerts,
    meta: {
      version: meta.version,
      updatedAt: meta.updatedAt,
      from: filters.from || null,
      to: filters.to || null,
    },
  };
}
