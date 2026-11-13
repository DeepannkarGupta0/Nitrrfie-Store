import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { EventEmitter } from 'node:events';
import {
  closeStoreDatabaseSingletonForTest,
  getStoreDatabase,
} from './db';
import { getAllCatalogProducts, getProductById, upsertCatalogProduct } from './cartService';
import { subscribeToCatalogEvents } from './productEvents';
import { addStaffMemberAdmin } from './orderService';
import { handleAdminOperations } from '../api/admin';
import { handleOrderProcessing } from '../api/orders';
import { handleProductsApi } from '../api/products';
import { handleNewsletterOperations } from '../api/newsletter';
import { handleSupportApi } from '../api/support';
import { setCustomerTokenVerifierForTest } from '../api/middleware';

const tempDbPaths: string[] = [];

function createTempDbPath(label: string): string {
  const dbPath = path.join(
    os.tmpdir(),
    `nitrr-prod-audit-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.db`
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
    'x-forwarded-for': `10.2.${Math.floor(Math.random() * 200)}.${Math.floor(Math.random() * 200)}`,
    ...opts.headers,
  };
  req.body = opts.body;
  req.query = opts.query || {};
  req.socket = { remoteAddress: '127.0.0.1' };
  return req;
}

function setupTestAccounts(db: ReturnType<typeof getStoreDatabase>) {
  addStaffMemberAdmin(db, {
    email: 'ops.second@nitrr.ac.in',
    role: 'operations_lead',
    actorEmail: 'heyvikrant24@gmail.com',
  });
  addStaffMemberAdmin(db, {
    email: 'hostel.coord@nitrr.ac.in',
    role: 'hostel_coordinator',
    actorEmail: 'heyvikrant24@gmail.com',
  });

  setCustomerTokenVerifierForTest(async (token) => {
    if (token === 'admin_a_jwt') {
      return { sub: 'clerk_admin_a', email: 'heyvikrant24@gmail.com' };
    }
    if (token === 'admin_b_jwt') {
      return { sub: 'clerk_admin_b', email: 'ops.second@nitrr.ac.in' };
    }
    if (token === 'hostel_jwt') {
      return { sub: 'clerk_hostel', email: 'hostel.coord@nitrr.ac.in' };
    }
    if (token === 'cust_a_jwt') {
      return { sub: 'clerk_cust_a', email: 'student.a@nitrr.ac.in' };
    }
    if (token === 'cust_b_jwt') {
      return { sub: 'clerk_cust_b', email: 'student.b@nitrr.ac.in' };
    }
    throw new Error('Unauthorized test token');
  });
}

after(() => {
  closeStoreDatabaseSingletonForTest();
  setCustomerTokenVerifierForTest(null);
  delete process.env.STORE_DB_PATH;
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

test('Test A: Product update syncs between Admin A, Admin B, public catalog API, rejects stale version (409) & oversized image (400)', async () => {
  process.env.STORE_DB_PATH = createTempDbPath('test-a-product');
  const db = getStoreDatabase();
  setupTestAccounts(db);

  const catalogEvents: Array<{ reason: string; productId?: string }> = [];
  const unsubCatalog = subscribeToCatalogEvents((ev) => {
    catalogEvents.push({ reason: ev.reason, productId: ev.productId });
  });

  const initialProduct = getAllCatalogProducts(db)[0];
  assert.ok(initialProduct);
  const initialVersion = initialProduct.version ?? 1;

  // Admin A updates product price and name with matching expectedVersion
  const reqPatchA = createMockReq({
    method: 'PATCH',
    url: '/api/products',
    headers: { authorization: 'Bearer admin_a_jwt' },
    body: {
      product: {
        ...initialProduct,
        name: 'Audit Updated Varsity Bomber',
        price: 2149,
      },
      expectedVersion: initialVersion,
    },
  });
  const resPatchA = createMockRes();
  await handleProductsApi(reqPatchA, resPatchA);
  assert.equal(resPatchA.statusCode, 200);
  assert.equal(resPatchA.body.product.name, 'Audit Updated Varsity Bomber');
  assert.equal(resPatchA.body.product.price, 2149);
  assert.equal(resPatchA.body.product.version, initialVersion + 1);
  assert.ok(
    catalogEvents.some(
      (e) => e.reason === 'product_upserted' && e.productId === initialProduct.id
    )
  );

  // Admin B fetches /api/admin -> sees updated product
  const reqAdminB = createMockReq({
    method: 'GET',
    url: '/api/admin',
    headers: { authorization: 'Bearer admin_b_jwt' },
  });
  const resAdminB = createMockRes();
  await handleAdminOperations(reqAdminB, resAdminB);
  assert.equal(resAdminB.statusCode, 200);
  const adminBProduct = resAdminB.body.dashboard.products.find(
    (p: any) => p.id === initialProduct.id
  );
  assert.equal(adminBProduct.name, 'Audit Updated Varsity Bomber');
  assert.equal(adminBProduct.price, 2149);
  assert.equal(adminBProduct.version, initialVersion + 1);

  // Public customer GET /api/products -> sees updated price & title immediately
  const reqPublic = createMockReq({ method: 'GET', url: '/api/products' });
  const resPublic = createMockRes();
  await handleProductsApi(reqPublic, resPublic);
  assert.equal(resPublic.statusCode, 200);
  const publicProduct = resPublic.body.products.find((p: any) => p.id === initialProduct.id);
  assert.equal(publicProduct.name, 'Audit Updated Varsity Bomber');
  assert.equal(publicProduct.price, 2149);

  // Admin B attempts stale concurrent update with initialVersion -> 409 VERSION_CONFLICT
  const reqStale = createMockReq({
    method: 'PATCH',
    url: '/api/products',
    headers: { authorization: 'Bearer admin_b_jwt' },
    body: {
      product: { ...initialProduct, price: 999 },
      expectedVersion: initialVersion,
    },
  });
  const resStale = createMockRes();
  await handleProductsApi(reqStale, resStale);
  assert.equal(resStale.statusCode, 409);
  assert.equal(resStale.body.code, 'VERSION_CONFLICT');

  // Admin A attempts oversized base64 image upload -> 400 IMAGE_TOO_LARGE (no silent fallback)
  const hugeDataUrl = `data:image/png;base64,${'A'.repeat(1_500_100)}`;
  const reqLargeImg = createMockReq({
    method: 'PATCH',
    url: '/api/products',
    headers: { authorization: 'Bearer admin_a_jwt' },
    body: {
      product: {
        ...resPatchA.body.product,
        image: hugeDataUrl,
      },
      expectedVersion: resPatchA.body.product.version,
    },
  });
  const resLargeImg = createMockRes();
  await handleProductsApi(reqLargeImg, resLargeImg);
  assert.equal(resLargeImg.statusCode, 400);
  assert.equal(resLargeImg.body.code, 'IMAGE_TOO_LARGE');

  unsubCatalog();
});

test('Test B: Inventory updates, checkout deduction, and cancellation restoration stay synchronized across Admin & Storefront', async () => {
  process.env.STORE_DB_PATH = createTempDbPath('test-b-inventory');
  const db = getStoreDatabase();
  setupTestAccounts(db);

  const product = getAllCatalogProducts(db)[0];
  assert.ok(product);
  upsertCatalogProduct(db, { ...product, stock: 5, inStock: true });

  // Admin A increases stock by +3 -> 8 units
  const reqAdjust = createMockReq({
    method: 'PATCH',
    url: '/api/products',
    headers: { authorization: 'Bearer admin_a_jwt' },
    body: { action: 'adjust_stock', productId: product.id, delta: 3 },
  });
  const resAdjust = createMockRes();
  await handleProductsApi(reqAdjust, resAdjust);
  assert.equal(resAdjust.statusCode, 200);
  assert.equal(resAdjust.body.product.stock, 8);

  // Storefront sees 8 units
  const reqStore = createMockReq({ method: 'GET', url: '/api/products' });
  const resStore = createMockRes();
  await handleProductsApi(reqStore, resStore);
  assert.equal(
    resStore.body.products.find((p: any) => p.id === product.id).stock,
    8
  );

  // Customer A places an order for 2 units -> stock becomes 6
  const reqOrder = createMockReq({
    method: 'POST',
    url: '/api/orders',
    headers: { authorization: 'Bearer cust_a_jwt' },
    body: {
      idempotencyKey: 'test-b-order-001',
      customerName: 'Ananya Verma',
      email: 'student.a@nitrr.ac.in',
      phone: '9876543210',
      handoverType: 'makerspace_desk',
      paymentMethod: 'cash_at_desk',
      items: [
        {
          productId: product.id,
          name: product.name,
          color: product.colorways[0].name,
          size: product.sizes[0] || 'M',
          price: product.price,
          quantity: 2,
          image: product.image,
        },
      ],
    },
  });
  const resOrder = createMockRes();
  await handleOrderProcessing(reqOrder, resOrder);
  assert.equal(resOrder.statusCode, 201);
  assert.equal(getProductById(db, product.id)?.stock, 6);

  // Admin B cancels order -> stock restores back to 8 on both DB and public endpoint
  const reqCancel = createMockReq({
    method: 'POST',
    url: '/api/admin',
    headers: { authorization: 'Bearer admin_b_jwt' },
    body: {
      action: 'cancel_order',
      orderId: resOrder.body.order.id,
      cancellationReason: 'Customer requested cancellation',
      expectedVersion: resOrder.body.order.version,
    },
  });
  const resCancel = createMockRes();
  await handleAdminOperations(reqCancel, resCancel);
  assert.equal(resCancel.statusCode, 200);

  const reqStoreAfter = createMockReq({ method: 'GET', url: '/api/products' });
  const resStoreAfter = createMockRes();
  await handleProductsApi(reqStoreAfter, resStoreAfter);
  assert.equal(
    resStoreAfter.body.products.find((p: any) => p.id === product.id).stock,
    8
  );
});

test('Test C: Order updates reflect across Admin A, Admin B, Customer A scope=mine, and public order tracker', async () => {
  process.env.STORE_DB_PATH = createTempDbPath('test-c-order-sync');
  const db = getStoreDatabase();
  setupTestAccounts(db);

  const product = getAllCatalogProducts(db)[0];
  assert.ok(product);
  upsertCatalogProduct(db, { ...product, stock: 10, inStock: true });

  // Customer A places order
  const reqPlace = createMockReq({
    method: 'POST',
    url: '/api/orders',
    headers: { authorization: 'Bearer cust_a_jwt' },
    body: {
      idempotencyKey: 'test-c-order-001',
      customerName: 'Siddharth Joshi',
      email: 'student.a@nitrr.ac.in',
      phone: '9876543211',
      handoverType: 'makerspace_desk',
      paymentMethod: 'upi_razorpay',
      utrNumber: '776655443322',
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
  });
  const resPlace = createMockRes();
  await handleOrderProcessing(reqPlace, resPlace);
  assert.equal(resPlace.statusCode, 201);
  const orderId = resPlace.body.order.id;

  // Admin A verifies payment & marks ready_for_handover
  const reqVerify = createMockReq({
    method: 'POST',
    url: '/api/admin',
    headers: { authorization: 'Bearer admin_a_jwt' },
    body: { action: 'verify_payment', orderId, expectedVersion: 1 },
  });
  const resVerify = createMockRes();
  await handleAdminOperations(reqVerify, resVerify);
  assert.equal(resVerify.statusCode, 200);

  const reqReady = createMockReq({
    method: 'POST',
    url: '/api/admin',
    headers: { authorization: 'Bearer admin_a_jwt' },
    body: {
      action: 'update_order_status',
      orderId,
      status: 'ready_for_handover',
      expectedVersion: resVerify.body.order.version,
    },
  });
  const resReady = createMockRes();
  await handleAdminOperations(reqReady, resReady);
  assert.equal(resReady.statusCode, 200);

  // Admin B sees ready_for_handover & paid
  const reqAdminB = createMockReq({
    method: 'GET',
    url: '/api/admin',
    headers: { authorization: 'Bearer admin_b_jwt' },
  });
  const resAdminB = createMockRes();
  await handleAdminOperations(reqAdminB, resAdminB);
  const seenByB = resAdminB.body.dashboard.orders.find((o: any) => o.id === orderId);
  assert.equal(seenByB.status, 'ready_for_handover');
  assert.equal(seenByB.paymentStatus, 'paid');

  // Customer A sees own order on ?scope=mine, Customer B does NOT
  const reqMineA = createMockReq({
    method: 'GET',
    url: '/api/orders?scope=mine',
    query: { scope: 'mine' },
    headers: { authorization: 'Bearer cust_a_jwt' },
  });
  const resMineA = createMockRes();
  await handleOrderProcessing(reqMineA, resMineA);
  assert.equal(resMineA.statusCode, 200);
  assert.equal(resMineA.body.orders.length, 1);
  assert.equal(resMineA.body.orders[0].status, 'ready_for_handover');

  const reqMineB = createMockReq({
    method: 'GET',
    url: '/api/orders?scope=mine',
    query: { scope: 'mine' },
    headers: { authorization: 'Bearer cust_b_jwt' },
  });
  const resMineB = createMockRes();
  await handleOrderProcessing(reqMineB, resMineB);
  assert.equal(resMineB.statusCode, 200);
  assert.equal(resMineB.body.orders.length, 0);

  // Public tracker shows ready_for_handover
  const reqTrack = createMockReq({
    method: 'GET',
    url: `/api/orders?track=${encodeURIComponent(orderId)}`,
    query: { track: orderId },
  });
  const resTrack = createMockRes();
  await handleOrderProcessing(reqTrack, resTrack);
  assert.equal(resTrack.statusCode, 200);
  assert.equal(resTrack.body.order.status, 'ready_for_handover');
});

test('Test D: Coupon create, edit, disable, delete lifecycle enforces immediate server validation', async () => {
  process.env.STORE_DB_PATH = createTempDbPath('test-d-coupon');
  const db = getStoreDatabase();
  setupTestAccounts(db);
  const product = getAllCatalogProducts(db)[0];
  upsertCatalogProduct(db, { ...product, price: 1000, stock: 10, inStock: true });

  // 1. Create coupon AUDIT15 (15% off min 500)
  const reqCreate = createMockReq({
    method: 'POST',
    url: '/api/admin',
    headers: { authorization: 'Bearer admin_a_jwt' },
    body: {
      action: 'create_coupon',
      coupon: {
        code: 'AUDIT15',
        discountType: 'percentage',
        discountValue: 15,
        minOrderAmount: 500,
        maxDiscount: 300,
        isActive: true,
        description: 'Audit 15% test promo',
      },
    },
  });
  const resCreate = createMockRes();
  await handleAdminOperations(reqCreate, resCreate);
  assert.equal(resCreate.statusCode, 201);

  // Validate returns 150 discount on ₹1000
  const reqVal1 = createMockReq({
    method: 'GET',
    url: '/api/orders?action=validate_coupon&code=AUDIT15&subtotal=1000',
    query: { action: 'validate_coupon', code: 'AUDIT15', subtotal: '1000' },
  });
  const resVal1 = createMockRes();
  await handleOrderProcessing(reqVal1, resVal1);
  assert.equal(resVal1.body.valid, true);
  assert.equal(resVal1.body.discountAmount, 150);

  // 2. Edit coupon to flat ₹250 off
  const reqEdit = createMockReq({
    method: 'POST',
    url: '/api/admin',
    headers: { authorization: 'Bearer admin_b_jwt' },
    body: {
      action: 'update_coupon',
      code: 'AUDIT15',
      updates: { discountType: 'fixed', discountValue: 250, minOrderAmount: 500 },
    },
  });
  const resEdit = createMockRes();
  await handleAdminOperations(reqEdit, resEdit);
  assert.equal(resEdit.statusCode, 200);
  assert.equal(resEdit.body.coupon.discountType, 'fixed');
  assert.equal(resEdit.body.coupon.discountValue, 250);

  const reqVal2 = createMockReq({
    method: 'GET',
    url: '/api/orders?action=validate_coupon&code=AUDIT15&subtotal=1000',
    query: { action: 'validate_coupon', code: 'AUDIT15', subtotal: '1000' },
  });
  const resVal2 = createMockRes();
  await handleOrderProcessing(reqVal2, resVal2);
  assert.equal(resVal2.body.valid, true);
  assert.equal(resVal2.body.discountAmount, 250);

  // 3. Disable coupon -> validation & checkout reject
  const reqDisable = createMockReq({
    method: 'POST',
    url: '/api/admin',
    headers: { authorization: 'Bearer admin_a_jwt' },
    body: { action: 'toggle_coupon', code: 'AUDIT15' },
  });
  const resDisable = createMockRes();
  await handleAdminOperations(reqDisable, resDisable);
  assert.equal(resDisable.statusCode, 200);
  assert.equal(resDisable.body.coupon.isActive, false);

  const reqVal3 = createMockReq({
    method: 'GET',
    url: '/api/orders?action=validate_coupon&code=AUDIT15&subtotal=1000',
    query: { action: 'validate_coupon', code: 'AUDIT15', subtotal: '1000' },
  });
  const resVal3 = createMockRes();
  await handleOrderProcessing(reqVal3, resVal3);
  assert.equal(resVal3.body.valid, false);

  // 4. Delete coupon -> removed from DB & audit logged
  const reqDelete = createMockReq({
    method: 'POST',
    url: '/api/admin',
    headers: { authorization: 'Bearer admin_a_jwt' },
    body: { action: 'delete_coupon', code: 'AUDIT15' },
  });
  const resDelete = createMockRes();
  await handleAdminOperations(reqDelete, resDelete);
  assert.equal(resDelete.statusCode, 200);

  const reqDash = createMockReq({
    method: 'GET',
    url: '/api/admin',
    headers: { authorization: 'Bearer admin_b_jwt' },
  });
  const resDash = createMockRes();
  await handleAdminOperations(reqDash, resDash);
  assert.equal(
    resDash.body.dashboard.coupons.some((c: any) => c.code === 'AUDIT15'),
    false
  );
  assert.ok(
    resDash.body.dashboard.auditLogs.some(
      (l: any) => l.action === 'COUPON_DELETED' && l.targetId === 'AUDIT15'
    )
  );
});

test('Test E & RBAC & Support: Persistence survives DB close/reopen, hostel_coordinator gets 403 on restricted routes, support inquiries visible in admin', async () => {
  const persistentPath = createTempDbPath('test-e-restart');
  process.env.STORE_DB_PATH = persistentPath;
  const db = getStoreDatabase();
  setupTestAccounts(db);

  // Submit public support inquiry
  const reqSupPost = createMockReq({
    method: 'POST',
    url: '/api/support',
    body: {
      organization: 'ACM Student Chapter NITRR',
      contactEmail: 'acm@nitrr.ac.in',
      estimatedQuantity: 75,
      notes: 'Custom embroidered windcheaters for winter coding camp.',
    },
  });
  const resSupPost = createMockRes();
  await handleSupportApi(reqSupPost, resSupPost);
  assert.equal(resSupPost.statusCode, 201);
  const inquiryId = resSupPost.body.inquiry.id;

  // Create a custom coupon & product tweak
  const product = getAllCatalogProducts(db)[0];
  await handleProductsApi(
    createMockReq({
      method: 'PATCH',
      url: '/api/products',
      headers: { authorization: 'Bearer admin_a_jwt' },
      body: {
        product: { ...product, price: 2499 },
        expectedVersion: product.version ?? 1,
      },
    }),
    createMockRes()
  );

  // RBAC: hostel_coordinator gets 403 on newsletter subscribers, coupons, staff add
  const resHostelNews = createMockRes();
  await handleNewsletterOperations(
    createMockReq({
      method: 'GET',
      url: '/api/newsletter/subscribers',
      headers: { authorization: 'Bearer hostel_jwt' },
    }),
    resHostelNews
  );
  assert.equal(resHostelNews.statusCode, 403);

  const resHostelCoupon = createMockRes();
  await handleAdminOperations(
    createMockReq({
      method: 'POST',
      url: '/api/admin',
      headers: { authorization: 'Bearer hostel_jwt' },
      body: {
        action: 'create_coupon',
        coupon: {
          code: 'ILLEGAL10',
          discountType: 'percentage',
          discountValue: 10,
          minOrderAmount: 100,
          isActive: true,
          description: 'Should be rejected',
        },
      },
    }),
    resHostelCoupon
  );
  assert.equal(resHostelCoupon.statusCode, 403);

  // Simulate full backend restart by closing SQLite singleton and reopening from disk
  closeStoreDatabaseSingletonForTest();
  const dbReopened = getStoreDatabase();
  assert.equal(getProductById(dbReopened, product.id)?.price, 2499);

  // Admin can retrieve support inquiry after restart
  const resSupGet = createMockRes();
  await handleSupportApi(
    createMockReq({
      method: 'GET',
      url: '/api/support',
      headers: { authorization: 'Bearer admin_a_jwt' },
    }),
    resSupGet
  );
  assert.equal(resSupGet.statusCode, 200);
  assert.ok(resSupGet.body.inquiries.some((i: any) => i.id === inquiryId));

  // Unauthenticated /api/support GET is 401
  const resSupUnauth = createMockRes();
  await handleSupportApi(
    createMockReq({ method: 'GET', url: '/api/support' }),
    resSupUnauth
  );
  assert.equal(resSupUnauth.statusCode, 401);
});

test('Test F: Unavailable database fails explicitly with HTTP 500 JSON (never fabricates fallback success)', async () => {
  closeStoreDatabaseSingletonForTest();
  process.env.STORE_DB_PATH = '/dev/null/impossible-dir/store.db';

  const resProducts = createMockRes();
  await handleProductsApi(createMockReq({ method: 'GET', url: '/api/products' }), resProducts);
  assert.equal(resProducts.statusCode, 500);
  assert.equal(resProducts.body.success, false);
  assert.ok(typeof resProducts.body.error === 'string' && resProducts.body.error.length > 0);

  const resAdmin = createMockRes();
  await handleAdminOperations(
    createMockReq({
      method: 'GET',
      url: '/api/admin',
      headers: { authorization: 'Bearer admin_a_jwt' },
    }),
    resAdmin
  );
  assert.equal(resAdmin.statusCode, 500);
  assert.equal(resAdmin.body.success, false);

  closeStoreDatabaseSingletonForTest();
});
