import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { EventEmitter } from 'node:events';
import { getStoreDatabase } from './db';
import {
  addOrIncrementCartItem,
  getAllCatalogProducts,
  getProductById,
  getUserCart,
  mergeGuestCart,
  removeCartItem,
  setCartItemQuantity,
  upsertCatalogProduct,
  validateGuestCartItems,
} from './cartService';
import { subscribeToUserCartEvents } from './cartEvents';
import { handleCartOperations } from '../api/cart';
import { handleOrderProcessing } from '../api/orders';
import { setCustomerTokenVerifierForTest } from '../api/middleware';

function createTempDbPath(label: string): string {
  return path.join(
    os.tmpdir(),
    `nitrr-store-test-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.db`
  );
}

function createMockRes() {
  const res: any = new EventEmitter();
  res.statusCode = 200;
  res.headers = new Map<string, string>();
  res.body = undefined;
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
    'x-forwarded-for': `10.0.${Math.floor(Math.random() * 200)}.${Math.floor(Math.random() * 200)}`,
    ...opts.headers,
  };
  req.body = opts.body;
  req.query = opts.query || {};
  req.socket = { remoteAddress: '127.0.0.1' };
  return req;
}

test('Case 1 & 4: Guest user adds items -> signs in / creates account -> guest cart merges to DB account cart', async () => {
  const dbPath = createTempDbPath('case1');
  process.env.STORE_DB_PATH = dbPath;
  const db = getStoreDatabase();
  const products = getAllCatalogProducts(db);
  const firstProduct = products[0];
  assert.ok(firstProduct);

  setCustomerTokenVerifierForTest(async (token) => {
    if (token === 'token_new_user') return { sub: 'user_new_account_001' };
    throw new Error('Invalid token');
  });

  // Step 1: Guest validates items against /api/cart/validate
  const validateReq = createMockReq({
    method: 'POST',
    url: '/api/cart/validate',
    body: {
      items: [
        {
          productId: firstProduct.id,
          colorName: firstProduct.colorways[0].name,
          size: firstProduct.sizes[0],
          quantity: 2,
        },
      ],
    },
  });
  const validateRes = createMockRes();
  await handleCartOperations(validateReq, validateRes);
  assert.equal(validateRes.statusCode, 200);
  assert.equal(validateRes.body.items.length, 1);
  assert.equal(validateRes.body.items[0].quantity, 2);

  // Step 2: Guest signs in / creates new account -> POST /api/cart/merge
  const mergeReq = createMockReq({
    method: 'POST',
    url: '/api/cart/merge',
    headers: {
      authorization: 'Bearer token_new_user',
      'x-client-instance-id': 'browser-a',
    },
    body: {
      items: [
        {
          productId: firstProduct.id,
          colorName: firstProduct.colorways[0].name,
          size: firstProduct.sizes[0],
          quantity: 2,
        },
      ],
    },
  });
  const mergeRes = createMockRes();
  await handleCartOperations(mergeReq, mergeRes);
  assert.equal(mergeRes.statusCode, 200);
  assert.equal(mergeRes.body.items.length, 1);
  assert.equal(mergeRes.body.items[0].quantity, 2);
  assert.equal(mergeRes.body.items[0].product.price, firstProduct.price);

  setCustomerTokenVerifierForTest(null);
  try {
    fs.unlinkSync(dbPath);
  } catch {
    // ignore
  }
});

test('Case 2 & 3: Second device retrieves DB cart & signing out preserves saved account cart', async () => {
  const dbPath = createTempDbPath('case2-3');
  process.env.STORE_DB_PATH = dbPath;
  const db = getStoreDatabase();
  const [prodA, prodB] = getAllCatalogProducts(db);

  setCustomerTokenVerifierForTest(async (token) => {
    if (token === 'token_device_1' || token === 'token_device_2') {
      return { sub: 'user_cross_device_002' };
    }
    throw new Error('Unauthorized');
  });

  // Device 1 adds item
  const addReq = createMockReq({
    method: 'POST',
    url: '/api/cart/items',
    headers: {
      authorization: 'Bearer token_device_1',
      'x-client-instance-id': 'device-1',
    },
    body: {
      productId: prodB.id,
      colorName: prodB.colorways[0].name,
      size: prodB.sizes[1] || prodB.sizes[0],
      quantity: 3,
    },
  });
  const addRes = createMockRes();
  await handleCartOperations(addReq, addRes);
  assert.equal(addRes.statusCode, 200);
  assert.equal(addRes.body.items.length, 1);

  // Device 1 signs out (client clears UI only; no DELETE /api/cart). Device 2 signs in later -> GET /api/cart
  const device2Req = createMockReq({
    method: 'GET',
    url: '/api/cart',
    headers: {
      authorization: 'Bearer token_device_2',
      'x-client-instance-id': 'device-2',
    },
  });
  const device2Res = createMockRes();
  await handleCartOperations(device2Req, device2Res);
  assert.equal(device2Res.statusCode, 200);
  assert.equal(device2Res.body.items.length, 1);
  assert.equal(device2Res.body.items[0].product.id, prodB.id);
  assert.equal(device2Res.body.items[0].quantity, 3);

  // Verify cart still intact for Device 1 after signing back in (no silent deletion)
  const reloginReq = createMockReq({
    method: 'POST',
    url: '/api/cart/merge',
    headers: {
      authorization: 'Bearer token_device_1',
      'x-client-instance-id': 'device-1',
    },
    body: { items: [] },
  });
  const reloginRes = createMockRes();
  await handleCartOperations(reloginReq, reloginRes);
  assert.equal(reloginRes.statusCode, 200);
  assert.equal(reloginRes.body.items.length, 1);
  assert.equal(reloginRes.body.items[0].quantity, 3);

  assert.ok(prodA.id);
  setCustomerTokenVerifierForTest(null);
  try {
    fs.unlinkSync(dbPath);
  } catch {
    // ignore
  }
});

test('Case 5 & 6: Merge guest cart with existing account cart (same variant sums capped at stock; different variants stay separate)', () => {
  const dbPath = createTempDbPath('case5-6');
  process.env.STORE_DB_PATH = dbPath;
  const db = getStoreDatabase();
  const prod = getAllCatalogProducts(db)[0];

  // Set stock to 5 cleanly in DB
  upsertCatalogProduct(db, { ...prod, stock: 5, inStock: true });

  const userId = 'user_merge_005';
  const color1 = prod.colorways[0];
  const color2 = prod.colorways[1] || { name: 'Alternate Obsidian', hex: '#000000' };
  const sizeM = prod.sizes[0] || 'M';
  const sizeL = prod.sizes[1] || 'L';

  // Pre-existing account cart: (color1, sizeM) qty 3 + (color1, sizeL) qty 1
  addOrIncrementCartItem(db, userId, {
    productId: prod.id,
    colorName: color1.name,
    colorHex: color1.hex,
    size: sizeM,
    quantity: 3,
  });
  addOrIncrementCartItem(db, userId, {
    productId: prod.id,
    colorName: color1.name,
    colorHex: color1.hex,
    size: sizeL,
    quantity: 1,
  });

  // Guest cart adds:
  // - matching (color1, sizeM) qty 4 -> 3 + 4 = 7, capped at stock 5 with warning
  // - new custom design variant on same product -> separate item
  // - new colorway (color2, sizeM) -> separate item
  const merged = mergeGuestCart(db, userId, [
    {
      productId: prod.id,
      colorName: color1.name,
      colorHex: color1.hex,
      size: sizeM,
      quantity: 4,
    },
    {
      productId: prod.id,
      colorName: color2.name,
      colorHex: color2.hex,
      size: sizeM,
      quantity: 2,
    },
    {
      productId: prod.id,
      colorName: color1.name,
      colorHex: color1.hex,
      size: sizeM,
      quantity: 1,
      customDesign: {
        text: 'NITRR26',
        placement: 'back_embroidery',
        color: '#ffffff',
        fontSize: 18,
      },
    },
  ]);

  assert.equal(merged.items.length, 4, 'Should have 4 distinct variant rows and zero duplicates');
  const matchingVariant = merged.items.find(
    (i) => i.selectedColor.name === color1.name && i.selectedSize === sizeM && !i.customDesign
  );
  assert.ok(matchingVariant);
  assert.equal(matchingVariant.quantity, 5, 'Combined quantity should be capped at stock (5)');
  assert.ok(
    merged.warnings.some((w) => w.includes('capped at available stock (5)')),
    'Should warn user when merged quantity hits inventory limit'
  );

  try {
    fs.unlinkSync(dbPath);
  } catch {
    // ignore
  }
});

test('Case 7 & 8: Concurrent / interleaved updates, item removal sync, and real-time SSE broadcasts', async () => {
  const dbPath = createTempDbPath('case7-8');
  process.env.STORE_DB_PATH = dbPath;
  const db = getStoreDatabase();
  const [prod1, prod2] = getAllCatalogProducts(db);
  const userId = 'user_realtime_007';

  const events: Array<{ version: number; sourceClientId?: string }> = [];
  const unsubscribe = subscribeToUserCartEvents(userId, (evt) => {
    events.push({ version: evt.version, sourceClientId: evt.sourceClientId });
  });

  // Simulate two devices updating simultaneously
  const res1 = addOrIncrementCartItem(
    db,
    userId,
    {
      productId: prod1.id,
      colorName: prod1.colorways[0].name,
      size: prod1.sizes[0],
      quantity: 1,
    },
    'tab-A'
  );
  const res2 = addOrIncrementCartItem(
    db,
    userId,
    {
      productId: prod2.id,
      colorName: prod2.colorways[0].name,
      size: prod2.sizes[0],
      quantity: 2,
    },
    'tab-B'
  );

  const item1Id = res1.items[0].cartItemId;
  const item2Id = res2.items.find((i) => i.product.id === prod2.id)!.cartItemId;

  // Concurrent quantity updates across tabs
  setCartItemQuantity(db, userId, item1Id, 4, 'tab-A');
  removeCartItem(db, userId, item2Id, 'tab-B');

  const finalCart = getUserCart(db, userId);
  assert.equal(finalCart.items.length, 1);
  assert.equal(finalCart.items[0].cartItemId, item1Id);
  assert.equal(finalCart.items[0].quantity, 4);

  assert.equal(events.length, 4);
  assert.ok(events[3].version > events[0].version);
  assert.equal(events[3].sourceClientId, 'tab-B');

  unsubscribe();
  try {
    fs.unlinkSync(dbPath);
  } catch {
    // ignore
  }
});

test('Case 9: Unavailable & out-of-stock products, server-trusted prices, and atomic inventory deduction ONLY on order placement', async () => {
  const dbPath = createTempDbPath('case9');
  process.env.STORE_DB_PATH = dbPath;
  const db = getStoreDatabase();
  const products = getAllCatalogProducts(db);
  const target = products[0];
  const outOfStockProd = products[1];

  upsertCatalogProduct(db, { ...target, stock: 2, inStock: true });
  upsertCatalogProduct(db, { ...outOfStockProd, stock: 0, inStock: false });

  setCustomerTokenVerifierForTest(async (token) => {
    if (token === 'token_buyer') return { sub: 'user_buyer_009' };
    throw new Error('Unauthorized');
  });

  // 1. Adding out-of-stock item directly fails with 409
  const oosReq = createMockReq({
    method: 'POST',
    url: '/api/cart/items',
    headers: { authorization: 'Bearer token_buyer' },
    body: {
      productId: outOfStockProd.id,
      colorName: outOfStockProd.colorways[0].name,
      size: outOfStockProd.sizes[0],
      quantity: 1,
    },
  });
  const oosRes = createMockRes();
  await handleCartOperations(oosReq, oosRes);
  assert.equal(oosRes.statusCode, 409);

  // 2. Guest merge preserves out-of-stock / deleted items with clear warnings (never silently dropped)
  const merged = mergeGuestCart(db, 'user_buyer_009', [
    {
      productId: outOfStockProd.id,
      colorName: outOfStockProd.colorways[0].name,
      size: outOfStockProd.sizes[0],
      quantity: 1,
    },
    {
      productId: 'non-existent-sku',
      colorName: 'Black',
      size: 'L',
      quantity: 1,
    },
  ]);
  assert.equal(merged.items.length, 2);
  assert.equal(merged.hasStockIssues, true);
  assert.ok(merged.warnings.length >= 2);

  // Clean cart for checkout test: add 2 units of `target` (note: adding to cart MUST NOT reduce DB stock!)
  const user2 = 'user_checkout_009';
  setCustomerTokenVerifierForTest(async () => ({ sub: user2 }));
  addOrIncrementCartItem(db, user2, {
    productId: target.id,
    colorName: target.colorways[0].name,
    size: target.sizes[0],
    quantity: 2,
  });
  assert.equal(getProductById(db, target.id)!.stock, 2, 'Cart add must NOT reserve/deduct stock');

  // 3. Tampered client prices on POST /api/orders must be ignored; stock rejected if exceeding available (3 > 2)
  const overOrderReq = createMockReq({
    method: 'POST',
    url: '/api/orders',
    headers: { authorization: 'Bearer valid_buyer_2' },
    body: {
      customerName: 'Vikram Student',
      rollNumber: '22115011',
      email: 'vikram@nitrr.ac.in',
      phone: '9876543210',
      handoverType: 'makerspace_desk',
      paymentMethod: 'cash_at_desk',
      items: [
        {
          productId: target.id,
          name: target.name,
          color: target.colorways[0].name,
          size: target.sizes[0],
          price: 1, // Tampered!
          quantity: 3, // Exceeds 2!
        },
      ],
      total: 3,
    },
  });
  const overOrderRes = createMockRes();
  await handleOrderProcessing(overOrderReq, overOrderRes);
  assert.equal(overOrderRes.statusCode, 409);
  assert.equal(overOrderRes.body.code, 'INSUFFICIENT_STOCK');
  assert.equal(getProductById(db, target.id)!.stock, 2, 'Failed order must NOT deduct stock');

  // 4. Valid order succeeds, trusts DB price (not tampered price: 1), deducts stock to 0, clears user's DB cart
  const validOrderReq = createMockReq({
    method: 'POST',
    url: '/api/orders',
    headers: { authorization: 'Bearer valid_buyer_2' },
    body: {
      customerName: 'Vikram Student',
      rollNumber: '22115011',
      email: 'vikram@nitrr.ac.in',
      phone: '9876543210',
      handoverType: 'makerspace_desk',
      paymentMethod: 'cash_at_desk',
      items: [
        {
          productId: target.id,
          name: target.name,
          color: target.colorways[0].name,
          size: target.sizes[0],
          price: 1, // Tampered client price
          quantity: 2,
        },
      ],
      total: 2, // Tampered client total
    },
  });
  const validOrderRes = createMockRes();
  await handleOrderProcessing(validOrderReq, validOrderRes);
  assert.equal(validOrderRes.statusCode, 201);
  assert.equal(validOrderRes.body.order.items[0].price, target.price);
  assert.equal(validOrderRes.body.order.total, target.price * 2);
  assert.equal(getProductById(db, target.id)!.stock, 0);
  assert.equal(getProductById(db, target.id)!.inStock, false);
  assert.equal(getUserCart(db, user2).items.length, 0, 'Authenticated DB cart should clear after checkout');

  setCustomerTokenVerifierForTest(null);
  try {
    fs.unlinkSync(dbPath);
  } catch {
    // ignore
  }
});

test('Case 10: Ownership isolation & unauthorized access rejection (401/404) + guest validation', async () => {
  const dbPath = createTempDbPath('case10');
  process.env.STORE_DB_PATH = dbPath;
  const db = getStoreDatabase();
  const prod = getAllCatalogProducts(db)[0];

  // Unauthenticated GET /api/cart must return 401
  const unauthReq = createMockReq({
    method: 'GET',
    url: '/api/cart',
  });
  const unauthRes = createMockRes();
  await handleCartOperations(unauthReq, unauthRes);
  assert.equal(unauthRes.statusCode, 401);

  setCustomerTokenVerifierForTest(async (token) => {
    if (token === 'token_alice') return { sub: 'user_alice' };
    if (token === 'token_bob') return { sub: 'user_bob' };
    throw new Error('Invalid token');
  });

  // Alice adds an item
  const aliceAddReq = createMockReq({
    method: 'POST',
    url: '/api/cart/items',
    headers: { authorization: 'Bearer token_alice' },
    body: {
      productId: prod.id,
      colorName: prod.colorways[0].name,
      size: prod.sizes[0],
      quantity: 2,
    },
  });
  const aliceAddRes = createMockRes();
  await handleCartOperations(aliceAddReq, aliceAddRes);
  assert.equal(aliceAddRes.statusCode, 200);
  const aliceCartItemId = aliceAddRes.body.items[0].cartItemId;

  // Bob attempts to modify Alice's cartItemId -> rejected with 404 (not found for Bob's account)
  const bobPatchReq = createMockReq({
    method: 'PATCH',
    url: '/api/cart/items',
    headers: { authorization: 'Bearer token_bob' },
    body: {
      cartItemId: aliceCartItemId,
      quantity: 10,
    },
  });
  const bobPatchRes = createMockRes();
  await handleCartOperations(bobPatchReq, bobPatchRes);
  assert.equal(bobPatchRes.statusCode, 404);

  // Alice's cart remains untouched
  assert.equal(getUserCart(db, 'user_alice').items[0].quantity, 2);
  assert.equal(validateGuestCartItems(db, []).items.length, 0);

  setCustomerTokenVerifierForTest(null);
  try {
    fs.unlinkSync(dbPath);
  } catch {
    // ignore
  }
});
