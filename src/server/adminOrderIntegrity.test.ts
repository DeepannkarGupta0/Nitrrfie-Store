import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { EventEmitter } from 'node:events';
import { getStoreDatabase, seedCatalogIfEmpty } from './db';
import {
  addOrIncrementCartItem,
  getAllCatalogProducts,
  getProductById,
  upsertCatalogProduct,
} from './cartService';
import { subscribeToAdminEvents } from './adminEvents';
import {
  OrderServiceError,
  addStaffMemberAdmin,
  computeAdminDashboard,
  createGenuineOrder,
  updateOrderStatusAdmin,
  verifyOrderPayment,
} from './orderService';
import { handleAdminOperations } from '../api/admin';
import { handleOrderProcessing } from '../api/orders';
import { handleProductsApi } from '../api/products';
import { createSupportInquiry } from '../api/support';
import { setCustomerTokenVerifierForTest } from '../api/middleware';

const tempDbPaths: string[] = [];

function createTempDbPath(label: string): string {
  const dbPath = path.join(
    os.tmpdir(),
    `nitrr-admin-integrity-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.db`
  );
  tempDbPaths.push(dbPath);
  return dbPath;
}

function createMockRes() {
  const res: any = new EventEmitter();
  res.statusCode = 200;
  res.headers = new Map<string, string>();
  res.body = undefined;
  res.chunks = [];
  res.setHeader = (k: string, v: string) => res.headers.set(k.toLowerCase(), String(v));
  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data: any) => {
    res.body = data;
    return res;
  };
  res.send = (data: any) => {
    res.body = data;
    return res;
  };
  res.write = (chunk: string) => {
    res.chunks.push(chunk);
    return true;
  };
  return res;
}

function createMockReq(opts: {
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: any;
  query?: Record<string, string>;
}) {
  const req: any = new EventEmitter();
  req.method = opts.method;
  req.url = opts.url;
  req.originalUrl = opts.url;
  req.headers = {
    'x-forwarded-for': `10.1.${Math.floor(Math.random() * 200)}.${Math.floor(Math.random() * 200)}`,
    ...opts.headers,
  };
  req.body = opts.body;
  req.query = opts.query || {};
  req.socket = { remoteAddress: '127.0.0.1' };
  return req;
}

after(() => {
  setCustomerTokenVerifierForTest(null);
  for (const p of tempDbPaths) {
    for (const suffix of ['', '-wal', '-shm']) {
      try {
        if (fs.existsSync(p + suffix)) fs.unlinkSync(p + suffix);
      } catch {
        // ignore cleanup errors
      }
    }
  }
});

test('1. Fresh database initializes cleanly with 0 dummy orders, 0 revenue, 0 audit logs, and central owner roster', () => {
  process.env.STORE_DB_PATH = createTempDbPath('fresh-clean');
  const db = getStoreDatabase();

  const dashboard = computeAdminDashboard(db);
  assert.equal(dashboard.orders.length, 0);
  assert.equal(dashboard.stats.totalCount, 0);
  assert.equal(dashboard.stats.grossRevenue, 0);
  assert.equal(dashboard.stats.verifiedRevenue, 0);
  assert.equal(dashboard.stats.pendingRevenue, 0);
  assert.equal(dashboard.stats.cancelledCount, 0);
  assert.equal(dashboard.auditLogs.length, 0);
  assert.equal(dashboard.customers.length, 0);
  assert.ok(dashboard.products.length > 0);
  assert.ok(dashboard.coupons.every((c) => c.usageCount === 0));

  const owner = dashboard.staffRoster.find((s) => s.email === 'heyvikrant24@gmail.com');
  assert.ok(owner);
  assert.equal(owner.role, 'super_admin');
});

test('2. Cart mutations and failed checkouts create zero orders and preserve product inventory', () => {
  process.env.STORE_DB_PATH = createTempDbPath('zero-ghost-orders');
  const db = getStoreDatabase();
  const product = getAllCatalogProducts(db)[0];
  assert.ok(product);

  upsertCatalogProduct(db, { ...product, stock: 2, inStock: true });

  // Adding items to user cart must not create any order
  addOrIncrementCartItem(db, 'student_user_1', {
    productId: product.id,
    colorName: product.colorways[0].name,
    colorHex: product.colorways[0].hex,
    size: product.sizes[0] || 'M',
    quantity: 2,
  });
  assert.equal(computeAdminDashboard(db).orders.length, 0);

  // Attempting checkout exceeding stock fails cleanly with 0 orders created
  assert.throws(
    () =>
      createGenuineOrder(
        db,
        {
          customerName: 'Aarav Sharma',
          email: 'aarav@nitrr.ac.in',
          phone: '9876543210',
          rollNumber: '23115001',
          handoverType: 'makerspace_desk',
          paymentMethod: 'upi_razorpay',
          utrNumber: '123456789012',
          items: [
            {
              productId: product.id,
              name: product.name,
              color: product.colorways[0].name,
              size: product.sizes[0] || 'M',
              price: product.price,
              quantity: 5,
              image: product.image,
            },
          ],
        },
        { authenticatedUserId: 'student_user_1' }
      ),
    (err: any) => err instanceof OrderServiceError && err.code === 'INSUFFICIENT_STOCK'
  );

  assert.equal(computeAdminDashboard(db).orders.length, 0);
  assert.equal(getProductById(db, product.id)?.stock, 2);
});

test('3. Idempotent checkout and strict payment integrity (UPI starts pending_verification, Cash starts pay_on_handover)', async () => {
  process.env.STORE_DB_PATH = createTempDbPath('idempotency-payment');
  const db = getStoreDatabase();
  const product = getAllCatalogProducts(db)[0];
  assert.ok(product);
  upsertCatalogProduct(db, { ...product, stock: 10, inStock: true });

  setCustomerTokenVerifierForTest(async (token) => {
    if (token === 'student_jwt_1') return { sub: 'student_001' };
    throw new Error('Unauthorized');
  });

  const checkoutPayload = {
    idempotencyKey: 'idem-checkout-key-001',
    customerName: 'Priya Verma',
    email: 'priya@nitrr.ac.in',
    phone: '9123456789',
    rollNumber: '23115045',
    handoverType: 'makerspace_desk',
    paymentMethod: 'upi_razorpay',
    utrNumber: '445566778899',
    items: [
      {
        productId: product.id,
        name: product.name,
        color: product.colorways[0].name,
        size: product.sizes[0] || 'L',
        price: 1, // tampered client price must be ignored
        quantity: 2,
        image: product.image,
      },
    ],
  };

  // First submission -> 201 Created, server price, pending_verification
  const req1 = createMockReq({
    method: 'POST',
    url: '/api/orders',
    headers: { authorization: 'Bearer student_jwt_1' },
    body: checkoutPayload,
  });
  const res1 = createMockRes();
  await handleOrderProcessing(req1, res1);
  assert.equal(res1.statusCode, 201);
  assert.equal(res1.body.idempotentReplay, false);
  assert.equal(res1.body.order.paymentStatus, 'pending_verification');
  assert.equal(res1.body.order.verificationStatus, 'utr_submitted');
  assert.equal(res1.body.order.total, product.price * 2);
  assert.equal(getProductById(db, product.id)?.stock, 8);

  // Duplicate retry with identical idempotencyKey -> 200 Replay, zero duplicate order/stock loss
  const req2 = createMockReq({
    method: 'POST',
    url: '/api/orders',
    headers: { authorization: 'Bearer student_jwt_1' },
    body: checkoutPayload,
  });
  const res2 = createMockRes();
  await handleOrderProcessing(req2, res2);
  assert.equal(res2.statusCode, 200);
  assert.equal(res2.body.idempotentReplay, true);
  assert.equal(res2.body.order.id, res1.body.order.id);
  assert.equal(getProductById(db, product.id)?.stock, 8);

  // Duplicate UTR on different idempotency key -> 409 Conflict
  const reqDupUtr = createMockReq({
    method: 'POST',
    url: '/api/orders',
    headers: { authorization: 'Bearer student_jwt_1' },
    body: {
      ...checkoutPayload,
      idempotencyKey: 'idem-checkout-key-002',
    },
  });
  const resDupUtr = createMockRes();
  await handleOrderProcessing(reqDupUtr, resDupUtr);
  assert.equal(resDupUtr.statusCode, 409);
  assert.equal(resDupUtr.body.code, 'DUPLICATE_UTR');

  // Cash at desk -> pay_on_handover
  const reqCash = createMockReq({
    method: 'POST',
    url: '/api/orders',
    headers: { authorization: 'Bearer student_jwt_1' },
    body: {
      ...checkoutPayload,
      idempotencyKey: 'idem-checkout-key-cash',
      paymentMethod: 'cash_at_desk',
      utrNumber: undefined,
    },
  });
  const resCash = createMockRes();
  await handleOrderProcessing(reqCash, resCash);
  assert.equal(resCash.statusCode, 201);
  assert.equal(resCash.body.order.paymentStatus, 'pay_on_handover');
  assert.equal(resCash.body.order.verificationStatus, 'unverified');
  assert.equal(computeAdminDashboard(db).orders.length, 2);
});

test('4 & 5. Officer payment verification updates metrics; cancellation restores stock and flags pending refund', () => {
  process.env.STORE_DB_PATH = createTempDbPath('verify-and-cancel');
  const db = getStoreDatabase();
  const product = getAllCatalogProducts(db)[0];
  assert.ok(product);
  upsertCatalogProduct(db, { ...product, stock: 10, inStock: true });

  const { order } = createGenuineOrder(
    db,
    {
      customerName: 'Rohan Patel',
      email: 'rohan@nitrr.ac.in',
      phone: '9988776655',
      rollNumber: '23115099',
      handoverType: 'hostel_delivery',
      deliveryAddress: {
        addressLine: 'Sirpur Hostel Room 104',
        city: 'Raipur',
        state: 'Chhattisgarh',
        pincode: '492010',
      },
      hostelDetails: { hostelName: 'Sirpur Hostel', roomNumber: '104' },
      paymentMethod: 'upi_razorpay',
      utrNumber: '998877665544',
      items: [
        {
          productId: product.id,
          name: product.name,
          color: product.colorways[0].name,
          size: product.sizes[0] || 'M',
          price: product.price,
          quantity: 3,
          image: product.image,
        },
      ],
    },
    {}
  );

  assert.equal(getProductById(db, product.id)?.stock, 7);
  let dash = computeAdminDashboard(db);
  assert.equal(dash.stats.pendingVerificationCount, 1);
  assert.equal(dash.stats.pendingRevenue, product.price * 3);
  assert.equal(dash.stats.verifiedRevenue, 0);

  // Admin verifies payment
  const verified = verifyOrderPayment(db, {
    orderId: order.id,
    expectedVersion: order.version,
    verifiedByLabel: 'heyvikrant24@gmail.com (Super Admin)',
    actorEmail: 'heyvikrant24@gmail.com',
  });
  assert.equal(verified.order.paymentStatus, 'paid');
  assert.equal(verified.order.verificationStatus, 'desk_verified');
  assert.equal(verified.order.status, 'preparing');

  dash = computeAdminDashboard(db);
  assert.equal(dash.stats.verifiedRevenue, product.price * 3);
  assert.equal(dash.stats.pendingRevenue, 0);
  assert.ok(dash.auditLogs.some((l) => l.action === 'PAYMENT_VERIFIED' && l.targetId === order.id));

  // Admin cancels paid order -> restores 3 units stock and excludes from grossRevenue
  const cancelled = updateOrderStatusAdmin(db, {
    orderId: order.id,
    status: 'cancelled',
    cancellationReason: 'Student requested size swap refund',
    expectedVersion: verified.order.version,
    actorEmail: 'ops2@nitrr.ac.in',
  });
  assert.equal(cancelled.order.status, 'cancelled');
  assert.equal(cancelled.order.refundStatus, 'pending');
  assert.equal(getProductById(db, product.id)?.stock, 10);

  dash = computeAdminDashboard(db);
  assert.equal(dash.stats.cancelledCount, 1);
  assert.equal(dash.stats.grossRevenue, 0);
  assert.equal(dash.stats.verifiedRevenue, 0);
  assert.ok(dash.alerts.some((a) => a.id === 'alert-pending-refunds'));

  // Cannot reactivate cancelled order
  assert.throws(
    () =>
      updateOrderStatusAdmin(db, {
        orderId: order.id,
        status: 'delivered',
        expectedVersion: cancelled.order.version,
        actorEmail: 'heyvikrant24@gmail.com',
      }),
    (err: any) => err instanceof OrderServiceError && err.statusCode === 409
  );
});

test('6 & 7. Multi-admin identical views, SSE broadcast, optimistic 409 conflicts, and strict RBAC enforcement', async () => {
  process.env.STORE_DB_PATH = createTempDbPath('multi-admin-rbac');
  const db = getStoreDatabase();
  const product = getAllCatalogProducts(db)[0];
  assert.ok(product);

  // Add second operations admin and a verification_desk officer into centralized DB roster
  addStaffMemberAdmin(db, {
    email: 'ops2@nitrr.ac.in',
    role: 'operations_lead',
    actorEmail: 'heyvikrant24@gmail.com',
  });

  setCustomerTokenVerifierForTest(async (token) => {
    if (token === 'admin_a_jwt') {
      return { sub: 'clerk_admin_a', email: 'heyvikrant24@gmail.com' };
    }
    if (token === 'admin_b_jwt') {
      return { sub: 'clerk_admin_b', email: 'ops2@nitrr.ac.in' };
    }
    if (token === 'desk_jwt') {
      return { sub: 'clerk_desk', email: 'store@nitrr.ac.in' };
    }
    if (token === 'customer_jwt') {
      return { sub: 'clerk_customer', email: 'random.student@gmail.com' };
    }
    throw new Error('Invalid token');
  });

  // Track real-time SSE broadcast events
  const observedEvents: Array<{ reason: string; version: number; targetId?: string }> = [];
  const unsubscribe = subscribeToAdminEvents((ev) => {
    observedEvents.push({ reason: ev.reason, version: ev.version, targetId: ev.targetId });
  });

  const { order } = createGenuineOrder(
    db,
    {
      customerName: 'Neha Singh',
      email: 'neha@nitrr.ac.in',
      phone: '9000011111',
      rollNumber: '23115077',
      handoverType: 'makerspace_desk',
      paymentMethod: 'upi_razorpay',
      utrNumber: '112233445566',
      items: [
        {
          productId: product.id,
          name: product.name,
          color: product.colorways[0].name,
          size: product.sizes[0] || 'S',
          price: product.price,
          quantity: 1,
          image: product.image,
        },
      ],
    },
    {}
  );

  // Admin A and Admin B fetch /api/admin from two separate accounts/clients
  const reqAdminA = createMockReq({
    method: 'GET',
    url: '/api/admin',
    headers: {
      authorization: 'Bearer admin_a_jwt',
      'x-user-email': 'heyvikrant24@gmail.com',
      'x-client-instance-id': 'admin-device-a',
    },
  });
  const resAdminA = createMockRes();
  await handleAdminOperations(reqAdminA, resAdminA);
  assert.equal(resAdminA.statusCode, 200);

  const reqAdminB = createMockReq({
    method: 'GET',
    url: '/api/admin',
    headers: {
      authorization: 'Bearer admin_b_jwt',
      'x-user-email': 'ops2@nitrr.ac.in',
      'x-client-instance-id': 'admin-device-b',
    },
  });
  const resAdminB = createMockRes();
  await handleAdminOperations(reqAdminB, resAdminB);
  assert.equal(resAdminB.statusCode, 200);

  // Both admins must receive the exact same central dashboard dataset
  assert.deepEqual(resAdminA.body.dashboard, resAdminB.body.dashboard);
  assert.ok(observedEvents.some((e) => e.reason === 'order_created' && e.targetId === order.id));

  // Admin A verifies payment (version 1 -> 2), then Admin B submits stale expectedVersion=1 -> 409 Conflict
  const reqVerifyA = createMockReq({
    method: 'POST',
    url: '/api/admin',
    headers: {
      authorization: 'Bearer admin_a_jwt',
      'x-user-email': 'heyvikrant24@gmail.com',
    },
    body: {
      action: 'verify_payment',
      orderId: order.id,
      expectedVersion: 1,
    },
  });
  const resVerifyA = createMockRes();
  await handleAdminOperations(reqVerifyA, resVerifyA);
  assert.equal(resVerifyA.statusCode, 200);
  assert.equal(resVerifyA.body.order.version, 2);

  const reqStaleB = createMockReq({
    method: 'POST',
    url: '/api/admin',
    headers: {
      authorization: 'Bearer admin_b_jwt',
      'x-user-email': 'ops2@nitrr.ac.in',
    },
    body: {
      action: 'update_order_status',
      orderId: order.id,
      status: 'delivered',
      expectedVersion: 1, // stale version!
    },
  });
  const resStaleB = createMockRes();
  await handleAdminOperations(reqStaleB, resStaleB);
  assert.equal(resStaleB.statusCode, 409);
  assert.equal(resStaleB.body.code, 'VERSION_CONFLICT');

  // RBAC: verification_desk can read GET /api/admin (200), but gets 403 on destructive delete/staff/product delete
  const reqDeskRead = createMockReq({
    method: 'GET',
    url: '/api/admin',
    headers: {
      authorization: 'Bearer desk_jwt',
      'x-user-email': 'store@nitrr.ac.in',
    },
  });
  const resDeskRead = createMockRes();
  await handleAdminOperations(reqDeskRead, resDeskRead);
  assert.equal(resDeskRead.statusCode, 200);
  assert.deepEqual(resDeskRead.body.dashboard.stats, resVerifyA.statusCode === 200 ? computeAdminDashboard(db).stats : {});

  const reqDeskDeleteOrder = createMockReq({
    method: 'DELETE',
    url: '/api/admin',
    headers: {
      authorization: 'Bearer desk_jwt',
      'x-user-email': 'store@nitrr.ac.in',
    },
    body: { orderId: order.id },
  });
  const resDeskDeleteOrder = createMockRes();
  await handleAdminOperations(reqDeskDeleteOrder, resDeskDeleteOrder);
  assert.equal(resDeskDeleteOrder.statusCode, 403);

  const reqDeskAddStaff = createMockReq({
    method: 'POST',
    url: '/api/admin',
    headers: {
      authorization: 'Bearer desk_jwt',
      'x-user-email': 'store@nitrr.ac.in',
    },
    body: { action: 'add_staff', email: 'unauthorized@nitrr.ac.in', role: 'super_admin' },
  });
  const resDeskAddStaff = createMockRes();
  await handleAdminOperations(reqDeskAddStaff, resDeskAddStaff);
  assert.equal(resDeskAddStaff.statusCode, 403);

  const reqDeskDeleteProduct = createMockReq({
    method: 'DELETE',
    url: '/api/products',
    headers: {
      authorization: 'Bearer desk_jwt',
      'x-user-email': 'store@nitrr.ac.in',
    },
    body: { productId: product.id },
  });
  const resDeskDeleteProduct = createMockRes();
  await handleProductsApi(reqDeskDeleteProduct, resDeskDeleteProduct);
  assert.equal(resDeskDeleteProduct.statusCode, 403);

  // Non-staff authenticated Clerk customer gets 403 on /api/admin, /api/orders ledger, and /api/products POST
  const reqCustAdmin = createMockReq({
    method: 'GET',
    url: '/api/admin',
    headers: {
      authorization: 'Bearer customer_jwt',
      'x-user-email': 'random.student@gmail.com',
    },
  });
  const resCustAdmin = createMockRes();
  await handleAdminOperations(reqCustAdmin, resCustAdmin);
  assert.equal(resCustAdmin.statusCode, 403);

  const reqCustOrders = createMockReq({
    method: 'GET',
    url: '/api/orders',
    headers: {
      authorization: 'Bearer customer_jwt',
      'x-user-email': 'random.student@gmail.com',
    },
  });
  const resCustOrders = createMockRes();
  await handleOrderProcessing(reqCustOrders, resCustOrders);
  assert.equal(resCustOrders.statusCode, 403);

  const reqCustCreateProduct = createMockReq({
    method: 'POST',
    url: '/api/products',
    headers: {
      authorization: 'Bearer customer_jwt',
      'x-user-email': 'random.student@gmail.com',
    },
    body: { product },
  });
  const resCustCreateProduct = createMockRes();
  await handleProductsApi(reqCustCreateProduct, resCustCreateProduct);
  assert.equal(resCustCreateProduct.statusCode, 403);

  // Server-side date-range filtering returns consistent filtered stats
  const futureRange = computeAdminDashboard(db, { from: '2099-01-01', to: '2099-12-31' });
  assert.equal(futureRange.orders.length, 0);
  assert.equal(futureRange.stats.totalCount, 0);
  assert.equal(futureRange.stats.grossRevenue, 0);

  // Spoofing x-user-email on a non-staff customer JWT must fail closed with 403 across all admin endpoints
  const reqSpoofAdmin = createMockReq({
    method: 'GET',
    url: '/api/admin',
    headers: {
      authorization: 'Bearer customer_jwt',
      'x-user-email': 'heyvikrant24@gmail.com',
    },
  });
  const resSpoofAdmin = createMockRes();
  await handleAdminOperations(reqSpoofAdmin, resSpoofAdmin);
  assert.equal(resSpoofAdmin.statusCode, 403);

  const reqSpoofMe = createMockReq({
    method: 'GET',
    url: '/api/admin?action=me',
    query: { action: 'me' },
    headers: {
      authorization: 'Bearer customer_jwt',
      'x-user-email': 'heyvikrant24@gmail.com',
    },
  });
  const resSpoofMe = createMockRes();
  await handleAdminOperations(reqSpoofMe, resSpoofMe);
  assert.equal(resSpoofMe.statusCode, 200);
  assert.equal(resSpoofMe.body.authorized, false);
  assert.equal(resSpoofMe.body.identity, undefined);

  const reqSpoofOrders = createMockReq({
    method: 'GET',
    url: '/api/orders',
    headers: {
      authorization: 'Bearer customer_jwt',
      'x-user-email': 'heyvikrant24@gmail.com',
    },
  });
  const resSpoofOrders = createMockRes();
  await handleOrderProcessing(reqSpoofOrders, resSpoofOrders);
  assert.equal(resSpoofOrders.statusCode, 403);

  const reqSpoofProducts = createMockReq({
    method: 'POST',
    url: '/api/products',
    headers: {
      authorization: 'Bearer customer_jwt',
      'x-user-email': 'heyvikrant24@gmail.com',
    },
    body: { product },
  });
  const resSpoofProducts = createMockRes();
  await handleProductsApi(reqSpoofProducts, resSpoofProducts);
  assert.equal(resSpoofProducts.statusCode, 403);

  unsubscribe();
});

test('8 & 9. Public tracking masks PII, SVG receipts are rejected, and support inquiries persist cleanly', async () => {
  process.env.STORE_DB_PATH = createTempDbPath('pii-svg-support');
  const db = getStoreDatabase();
  const product = getAllCatalogProducts(db)[0];
  assert.ok(product);
  upsertCatalogProduct(db, { ...product, stock: 5, inStock: true });

  // SVG data URL in paymentReceiptImage must be sanitized/stripped (prevents stored XSS)
  const { order } = createGenuineOrder(
    db,
    {
      customerName: 'Vikramaditya Rao',
      email: 'vikram@nitrr.ac.in',
      phone: '9827103849',
      rollNumber: '22115010',
      handoverType: 'home_delivery',
      deliveryAddress: {
        addressLine: 'Flat 302, Private Tower',
        city: 'Raipur',
        state: 'Chhattisgarh',
        pincode: '492010',
      },
      paymentMethod: 'upi_razorpay',
      utrNumber: '408219384910',
      paymentReceiptImage: 'data:image/svg+xml;base64,PHN2ZyBvbmxvYWQ9YWxlcnQoMSk+PC9zdmc+',
      items: [
        {
          productId: product.id,
          name: product.name,
          color: product.colorways[0].name,
          size: product.sizes[0] || 'M',
          price: product.price,
          quantity: 1,
          image: product.image,
        },
      ],
    },
    {}
  );

  assert.equal(order.paymentReceiptImage, undefined);

  // Public tracking endpoint redacts addressLine, masks customerName & utrNumber
  const reqTrack = createMockReq({
    method: 'GET',
    url: `/api/orders?track=${encodeURIComponent(order.id)}`,
    query: { track: order.id },
  });
  const resTrack = createMockRes();
  await handleOrderProcessing(reqTrack, resTrack);
  assert.equal(resTrack.statusCode, 200);
  assert.equal(resTrack.body.order.customerName, 'Vikramaditya R.');
  assert.equal(resTrack.body.order.utrNumber, '••••••••4910');
  assert.equal(resTrack.body.order.deliveryAddress.addressLine, undefined);
  assert.equal(resTrack.body.order.deliveryAddress.city, 'Raipur');

  // Support inquiry persistence and validation
  const inquiry = createSupportInquiry(db, {
    organization: 'Robotix Club NITRR',
    contactEmail: 'robotix@nitrr.ac.in',
    estimatedQuantity: 50,
    notes: 'Category: Varsity Jackets & Hoodies — Batch drop for annual symposium.',
  });
  assert.match(inquiry.id, /^INQ-\d{4}-[A-F0-9]{6}$/);
  assert.equal(inquiry.estimatedQuantity, 50);

  assert.throws(
    () =>
      createSupportInquiry(db, {
        organization: 'X',
        contactEmail: 'invalid',
        estimatedQuantity: 2,
        notes: 'ok',
      }),
    Error
  );
});

test('10. Roll-number-free checkout and server coupon validation & discounting work end-to-end', async () => {
  process.env.STORE_DB_PATH = createTempDbPath('checkout-coupon-integrity');
  const db = getStoreDatabase();
  const product = getAllCatalogProducts(db)[0];
  assert.ok(product);
  upsertCatalogProduct(db, { ...product, price: 1200, originalPrice: 1500, stock: 10, inStock: true });

  // 1. Validate active coupon via API (NITRR10 = 10% off min ₹999)
  const validReq = createMockReq({
    method: 'GET',
    url: '/api/orders?action=validate_coupon&code=NITRR10&subtotal=1200',
    query: { action: 'validate_coupon', code: 'NITRR10', subtotal: '1200' },
  });
  const validRes = createMockRes();
  await handleOrderProcessing(validReq, validRes);
  assert.equal(validRes.statusCode, 200);
  assert.equal(validRes.body.valid, true);
  assert.equal(validRes.body.discountAmount, 120);
  assert.equal(validRes.body.discount, 120);

  // 2. Validate invalid coupon code returns clear failure message
  const invalidReq = createMockReq({
    method: 'GET',
    url: '/api/orders?action=validate_coupon&code=FAKECODE99&subtotal=1200',
    query: { action: 'validate_coupon', code: 'FAKECODE99', subtotal: '1200' },
  });
  const invalidRes = createMockRes();
  await handleOrderProcessing(invalidReq, invalidRes);
  assert.equal(invalidRes.statusCode, 200);
  assert.equal(invalidRes.body.valid, false);
  assert.equal(invalidRes.body.discountAmount, 0);
  assert.match(invalidRes.body.message, /Invalid or unrecognized/i);

  // 3. Create order WITHOUT rollNumber (campus pickup, no delivery address needed) + valid coupon
  const { order } = createGenuineOrder(
    db,
    {
      customerName: 'Rohan Deshmukh',
      email: 'rohan.deshmukh@example.com',
      phone: '9876543210',
      handoverType: 'makerspace_desk',
      paymentMethod: 'upi_razorpay',
      utrNumber: '519203847561',
      couponCode: 'NITRR10',
      items: [
        {
          productId: product.id,
          name: product.name,
          color: product.colorways[0].name,
          size: product.sizes[0] || 'M',
          price: 1200,
          quantity: 1,
          image: product.image,
        },
      ],
    },
    {}
  );

  assert.equal(order.rollNumber, '');
  assert.equal(order.subtotal, 1200);
  assert.equal(order.discountAmount, 120);
  assert.equal(order.total, 1080);
  assert.equal(order.couponCode, 'NITRR10');
  assert.equal(order.deliveryAddress, undefined);

  // 4. Attempting checkout with an invalid coupon must reject with 400 INVALID_COUPON
  assert.throws(
    () =>
      createGenuineOrder(
        db,
        {
          customerName: 'Rohan Deshmukh',
          email: 'rohan.deshmukh@example.com',
          phone: '9876543210',
          handoverType: 'makerspace_desk',
          paymentMethod: 'cash_at_desk',
          couponCode: 'NONEXISTENT',
          items: [
            {
              productId: product.id,
              name: product.name,
              color: product.colorways[0].name,
              size: product.sizes[0] || 'M',
              price: 1200,
              quantity: 1,
              image: product.image,
            },
          ],
        },
        {}
      ),
    (err: any) => err?.code === 'INVALID_COUPON' && err?.statusCode === 400
  );
});

test('11. Alphanumeric UTR validation and non-destructive broken product URL repair', () => {
  process.env.STORE_DB_PATH = createTempDbPath('utr-image-repair');
  const db = getStoreDatabase();
  const product = getAllCatalogProducts(db)[0];
  assert.ok(product);

  // Alphanumeric 10-18 char bank UTRs must be accepted on server matching client regex
  upsertCatalogProduct(db, { ...product, stock: 5, inStock: true });
  const { order } = createGenuineOrder(
    db,
    {
      customerName: 'Ananya Verma',
      email: 'ananya@nitrr.ac.in',
      phone: '9876543211',
      handoverType: 'makerspace_desk',
      paymentMethod: 'upi_razorpay',
      utrNumber: 'SBIN004819201',
      items: [
        {
          productId: product.id,
          name: product.name,
          color: product.colorways[0].name,
          size: product.sizes[0] || 'M',
          price: product.price,
          quantity: 1,
          image: product.image,
        },
      ],
    },
    {}
  );
  assert.equal(order.utrNumber, 'SBIN004819201');
  assert.equal(order.verificationStatus, 'utr_submitted');

  // Legacy broken Unsplash photo-1622445268121-ac11f17a4591 URL in existing DB row is repaired without overwriting price/stock
  const netrify = getProductById(db, 'netrify-13');
  assert.ok(netrify);
  const customStock = 17;
  const customPrice = 777;
  const brokenJson = JSON.stringify({
    ...netrify,
    stock: customStock,
    price: customPrice,
    image: 'https://images.unsplash.com/photo-1622445268121-ac11f17a4591?q=80&w=1200&auto=format&fit=crop',
  });
  db.prepare(`UPDATE products SET data_json = ?, stock = ?, price = ? WHERE id = ?`).run(
    brokenJson,
    customStock,
    customPrice,
    'netrify-13'
  );

  seedCatalogIfEmpty(db);
  const repaired = getProductById(db, 'netrify-13');
  assert.ok(repaired);
  assert.ok(!repaired.image.includes('photo-1622445268121-ac11f17a4591'));
  assert.equal(repaired.image, '/images/catalog/normalized/nitrr-black-coregrad-tee.jpg');
  assert.equal(repaired.stock, customStock);
  assert.equal(repaired.price, customPrice);
});
