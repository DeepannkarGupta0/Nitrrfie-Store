# NIT Raipur Store — Admin Panel CRUD & Cross-Session Revalidation Testing Guide

This document defines the end-to-end verification protocol for all administrative **Create, Read, Update, and Delete (CRUD)** workflows across **Products**, **Coupons**, and **Orders**, ensuring every mutation persists to the centralized SQLite database (`./data/store.db`), enforces RBAC and optimistic concurrency, records immutable audit logs, and triggers real-time state revalidation across all connected administrator and customer sessions.

---

## 1. Architecture & Revalidation Mechanics Under Test

### 1.1 Single Source of Truth & Transport Contracts
| Domain | Frontend Mutator (`CartContext` / UI) | API Endpoint & Methods | Authoritative Server Handler | DB Tables Updated |
| :--- | :--- | :--- | :--- | :--- |
| **Products** | `AddProductPortal`, `EditProductModal`, `ProductCatalogPanel` | `GET / POST / PATCH / DELETE /api/products` | `handleProductsApi` → `cartService.ts` | `products`, `audit_logs`, `admin_meta` |
| **Coupons** | `CouponsManager` | `POST /api/admin` (`create_coupon`, `update_coupon`, `toggle_coupon`, `delete_coupon`) & `GET /api/orders?action=validate_coupon` | `handleAdminOperations` / `handleOrderProcessing` → `orderService.ts` | `coupons`, `audit_logs`, `admin_meta` |
| **Orders & Payments** | `AdminView`, `VerificationDesk`, `HostelDeliveryLogistics` | `GET /api/admin`, `GET / POST / PATCH /api/orders`, `POST / DELETE /api/admin` | `handleAdminOperations` / `handleOrderProcessing` → `orderService.ts` | `orders`, `products` (stock), `coupons` (`usage_count`), `audit_logs`, `admin_meta` |

### 1.2 Real-Time Cross-Session Revalidation Channels
Connected sessions stay synchronized via two Server-Sent Events (SSE) streams plus resilient fallback listeners in `src/context/CartContext.tsx`:

1. **Admin Operational Stream (`GET /api/admin/events?token=<jwt>`)**
   - Emits `event: connected` on subscription with `{ version, updatedAt, officerEmail }`.
   - Emits `event: admin_updated` with `{ type: 'admin_updated', reason, version, updatedAt, actorEmail, targetId, sourceClientId }` whenever `bumpAdminVersion()` runs.
   - **Echo Deduplication**: Requests include `X-Client-Instance-Id`. If `payload.sourceClientId === CLIENT_INSTANCE_ID` and `payload.version <= adminMetaVersionRef.current`, the originating tab skips a redundant duplicate re-fetch (while still having refreshed directly from its mutation response). **All other connected admin tabs/browsers** have a different `CLIENT_INSTANCE_ID` and immediately trigger `refreshAdminDashboard(true)`.
   - **Fallback Triggers**: `8000ms` interval poll (when tab is visible), `window.focus`, `document.visibilitychange`, `window.online`, and `6000ms` SSE auto-reconnect on error.

2. **Public Catalog Stream (`GET /api/products/events`)**
   - Emits `event: connected` on subscription and `event: catalog_updated` with `{ type: 'catalog_updated', reason, productId?, updatedAt }` whenever a product is upserted/deleted/stock-adjusted OR when an order reserves or restores stock.
   - All connected **customer and admin** sessions receive `catalog_updated` and immediately run `refreshCatalogProducts()`.
   - **Fallback Triggers**: `30000ms` interval poll (when tab is visible), `window.focus`, `document.visibilitychange`, `window.online`, and `8000ms` SSE auto-reconnect on error.

3. **Customer Bag & Coupon Auto-Revalidation**
   - Guest/authenticated carts validate stock and applied coupons against live backend state on `validateCartForCheckout()`, when `products` or `adminLastSyncedAt` update, and during `POST /api/orders`.
   - Authenticated customer bags also subscribe to `/api/cart/events?token=<jwt>` (`event: cart_updated`).

---

## 2. Test Environment & Multi-Session Setup

### 2.1 Concurrent Test Sessions
Run all cross-session tests with **three simultaneous browser contexts** against the running server (default `http://127.0.0.1:3000`):

| Session Label | Browser Context | Account / Role | Purpose |
| :--- | :--- | :--- | :--- |
| **Session A (Actor Admin)** | Chrome Normal Window | `super_admin` or `operations_lead` | Executes CRUD mutations in Admin Dashboard & DevTools Network verification |
| **Session B (Observer Admin)** | Chrome Incognito or Firefox | Second authorized staff user (e.g., `operations_lead` or `verification_desk`) | Verifies real-time `admin_updated` SSE push, UI revalidation, and `409` conflict handling |
| **Session C (Customer)** | Safari / Mobile viewport / Separate Profile | Signed-in student or Guest shopper | Verifies `catalog_updated` SSE push, storefront updates, coupon invalidation, and checkout integrity |

### 2.2 Required Tooling & Inspection Panels
- **Browser DevTools → Network tab**: Filter by `Fetch/XHR` and `EventStream` (`events`) to confirm HTTP status codes, `Authorization: Bearer ...` headers, `X-Client-Instance-Id` headers, and live SSE frames.
- **Automated Integration Suite**: Covers server/DB/API invariants using isolated temporary SQLite databases (without polluting `./data/store.db`).

---

## 3. Role-Based Access Control (RBAC) Verification Matrix

Before running functional CRUD cases, verify authorization boundaries across roles configured in `src/config/clerk.ts` and `src/api/middleware.ts`:

| Operation / Endpoint | Unauthenticated / Non-Staff | `hostel_coordinator` | `verification_desk` | `operations_lead` / `super_admin` |
| :--- | :--- | :--- | :--- | :--- |
| `GET /api/admin` | `401` / `403` | `200` | `200` | `200` |
| `GET /api/admin/events` | `401` / `403` | `200` SSE | `200` SSE | `200` SSE |
| `POST / PATCH /api/products` | `401` / `403` | `200` | `200` | `200` |
| `DELETE /api/products` | `401` / `403` | `403 Forbidden` | `403 Forbidden` | `200` |
| `POST /api/admin` (`*_coupon`) | `401` / `403` | `403 Forbidden` | `200` / `201` | `200` / `201` |
| `POST /api/admin` (`verify_payment`, `update_order_status`, `cancel_order`) | `401` / `403` | `200` | `200` | `200` |
| `DELETE /api/admin` (Delete Order) | `401` / `403` | `403 Forbidden` | `403 Forbidden` | `200` |

> **Verification Check**: Log in as `hostel_coordinator` and verify Delete Product buttons, Coupons tab (`canManageCoupons`), and Delete Order buttons (`canDeleteOrders`) are hidden in UI **and** manual `fetch()` calls with that user's Bearer token return HTTP `403`.

---

## 4. Products CRUD & Revalidation Test Cases

### `PROD-01`: Create New Product (`AddProductPortal` → `POST /api/products`)
- **Actor**: Session A (`Add Product Portal` tab).
- **Steps**:
  1. Fill title (`Test Collegiate Fleece`), price (`1299`), MRP (`1599`), category, society, sizes (`S, M, L`), colorways, and upload a primary + secondary image (`< 1MB` each) or preset URL.
  2. Click **Publish Product**.
- **Backend Verification**:
  - Network shows `POST /api/products` with JSON body `{ product: { id, slug, ... } }`, `Authorization: Bearer ...`, and `X-Client-Instance-Id`.
  - Response is `200 OK` with `{ success: true, product: { ..., version: 1 }, metaVersion }`.
  - Audit Log tab displays a new `PRODUCT_CREATED` entry with `officerEmail` = Session A's email.
- **Cross-Session Revalidation**:
  - **Session B**: Receives `admin_updated` (`reason: "product_created"`) on `/api/admin/events` and `catalog_updated` (`reason: "product_upserted"`) on `/api/products/events`; `Test Collegiate Fleece` appears automatically in Session B's `Product Catalog` without manual reload.
  - **Session C**: Receives `catalog_updated`; navigating or viewing `ShopView` / Search displays the new product and allows opening its detail page.
  - **Persistence**: Hard-refresh Session A, B, and C (`Ctrl+Shift+R`) and confirm the product remains present.

### `PROD-02`: Create Product With Explicit `0` Stock (`Pre-Order / Sold Out`)
- **Actor**: Session A (`Add Product Portal`).
- **Steps**: Set Stock Target to `0`, submit product.
- **Expected**:
  - `POST /api/products` sends `stock: 0` and `inStock: false` (never coerced to default `50`).
  - Both Session B (`Product Catalog`) and Session C (`ShopView` / `ProductDetailView`) display **Out of Stock** and disable Add-to-Bag.

### `PROD-03`: Duplicate Existing Product (`ProductCatalogPanel` → `POST /api/products`)
- **Actor**: Session A (`Product Catalog` tab).
- **Steps**: Click the Duplicate (Copy) icon on an edited product (whose `version > 1`).
- **Expected**:
  - Copy button locks while request is in flight (`disabled` state).
  - Payload creates a **new** `id` and `slug` without reusing the source product's `id`, `slug`, or `version`.
  - Returns `200 OK` with `version: 1` on the copy; Session B receives the new copy automatically.

### `PROD-04`: Update Product Price, Metadata & Stock (`EditProductModal` → `PATCH /api/products`)
- **Actor**: Session A (`Product Catalog` → **Edit**).
- **Precondition**: Session C has the target product open in `ProductDetailView` (with `quantity = 3` selected) **and** in `CartDrawer` (quantity `3`).
- **Steps**:
  1. Change selling price from `1299` to `999` and reduce `stock` from `20` to `2`.
  2. Click **Save Changes**.
- **Backend Verification**:
  - `PATCH /api/products` sends `{ product: { ... }, expectedVersion }`.
  - Response is `200 OK` with incremented `product.version` and `metaVersion`.
  - `audit_logs` records `PRODUCT_UPDATED`.
- **Cross-Session Revalidation**:
  - **Session B**: Card updates immediately to `₹999` and `Units: 2`.
  - **Session C (`ProductDetailView`)**: Price updates to `₹999`, and quantity stepper **clamps** from `3` to `2` **without** resetting the customer's selected color/size or scrolling the page to the top.
  - **Session C (Cart)**: Triggering cart sync / `validateCartForCheckout()` updates unit price to `₹999` from server authority and adjusts/warns that stock dropped to `2`.

### `PROD-05`: Quick Toggle Out-of-Stock / Adjust Stock (`PATCH /api/products`)
- **Actor**: Session A.
- **Steps**: Click the **In Stock / Out of Stock** pill on a product card in `ProductCatalogPanel`. (Also test toggling a product with `stock === 0` back to In Stock).
- **Expected**:
  - When `stock > 0`: Sends `PATCH /api/products`, toggles `inStock`, updates Session B & Session C (`Add to Bag` becomes disabled).
  - When `stock === 0`: UI prevents false toggle and prompts admin to add inventory via Edit modal; server `parseProductRow` also enforces `inStock = row.in_stock === 1 && row.stock > 0`.

### `PROD-06`: Optimistic Concurrency Conflict (`409 VERSION_CONFLICT`) on Concurrent Product Edit
- **Actor**: Session A and Session B simultaneously.
- **Steps**:
  1. Open `EditProductModal` on the **same product** (`version: V`) in both Session A and Session B before either saves.
  2. Save a price change in **Session A** first (`200 OK`, DB version becomes `V + 1`).
  3. Immediately click **Save Changes** in **Session B** (which still holds stale `expectedVersion: V` in the open modal state — or replay stale `expectedVersion` via DevTools). *(Note: if Session B's catalog updated in background via SSE, verify via a delayed request or DevTools `fetch` with `expectedVersion: V`.)*
- **Expected**:
  - Server responds `409 Conflict` with `{ code: "VERSION_CONFLICT", error: "Product ... was updated by another administrator. Refreshing latest catalog state." }`.
  - Client `CartContext.updateProduct` catches `409`, triggers `[refreshCatalogProducts(), refreshAdminDashboard(true)]`, displays error toast/banner, and does **not** overwrite Session A's newer edit.

### `PROD-07`: Payload & Image Validation (`400` Boundaries)
- **Steps**:
  1. Upload two ~1MB images (`~1.33MB` base64 each, total JSON payload ~`2.8MB`) in `AddProductPortal` / `EditProductModal`: confirm `express.json({ limit: '4mb' })` accepts `< 1MB` each (`200 OK`) rather than failing with `413 Payload Too Large`.
  2. Upload a file `> 1MB`: confirm client/server rejects with `IMAGE_TOO_LARGE` (`400`) and displays inline error without false success.
  3. Attempt `POST /api/products` via `fetch` with `image: "javascript:alert(1)"`: confirm server rejects with `400 INVALID_IMAGE`.

### `PROD-08`: Delete Product (`ProductCatalogPanel` → `DELETE /api/products`)
- **Actor**: Session A (`super_admin` or `operations_lead`).
- **Precondition**: Product exists in Session B's catalog and Session C's storefront/cart.
- **Steps**: Click Trash icon → Confirm in modal (**Yes, Delete Product**).
- **Expected**:
  - `DELETE /api/products` with `{ productId }` returns `200 OK`.
  - `audit_logs` records `PRODUCT_DELETED`.
  - **Session B**: Product disappears immediately from `ProductCatalogPanel` and KPI stock counts update.
  - **Session C**: Product disappears from `ShopView` / `HomeView` / Search; if Session C was viewing that item's `ProductDetailView` or had it in cart, bag validation flags it as unavailable and checkout rejects it cleanly.

---

## 5. Coupons CRUD & Revalidation Test Cases

### `COUP-01`: Create Percentage & Fixed Coupons (`CouponsManager` → `POST /api/admin`)
- **Actor**: Session A (`Vouchers & Promo Codes` tab).
- **Steps**:
  1. Click **Create Voucher Code**.
  2. Create `AUDITTEST20` (`20% off`, `minOrderAmount: 500`, `maxDiscount: 300`, future expiry date).
  3. Submit (**Deploy Promo Voucher**).
- **Backend Verification**:
  - `POST /api/admin` sends `{ action: 'create_coupon', coupon: { ... } }`.
  - Returns `201 Created` with `{ success: true, coupon, metaVersion }`.
  - `audit_logs` records `COUPON_CREATED` for `AUDITTEST20`.
- **Cross-Session Revalidation**:
  - **Session B**: `AUDITTEST20` appears immediately in `CouponsManager` table and `Active Campaigns` KPI increments without reload.
  - **Session C**: Entering `AUDITTEST20` in `CartDrawer` / `CartView` hits `GET /api/orders?action=validate_coupon&code=AUDITTEST20&subtotal=...` (`200 OK`, `valid: true`) and discounts cart total.

### `COUP-02`: Duplicate & Invalid Coupon Creation Validation
- **Steps**:
  1. Attempt creating `AUDITTEST20` again → `409 Conflict` (`COUPON_EXISTS`), error banner displayed in `CouponsManager`.
  2. Attempt creating percentage coupon with `discountValue: 95` via API → `400 Bad Request` (`INVALID_COUPON`).
  3. Attempt creating code shorter than 3 chars → rejected client & server (`400 INVALID_COUPON`).

### `COUP-03`: Update Coupon Terms (`CouponsManager` Edit → `POST /api/admin` `update_coupon`)
- **Actor**: Session A.
- **Precondition**: Session C currently has `AUDITTEST20` applied in their active cart (`subtotal: ₹800`).
- **Steps**:
  1. Click Edit (`Edit3`) on `AUDITTEST20`.
  2. Raise `minOrderAmount` from `500` to `2000` (or change discount from `20%` to `10%`, or set `expiresAt` to a past date).
  3. Click **Save Voucher Changes**.
- **Backend & Cross-Session Verification**:
  - `POST /api/admin` (`action: 'update_coupon'`) returns `200 OK`; `audit_logs` records `COUPON_UPDATED`.
  - **Session B**: Table updates immediately with the new terms.
  - **Session C**: If Session C's cart triggers revalidation (on focus, visibility, `adminLastSyncedAt`, item change, or **Proceed to Checkout** → `validateCartForCheckout()`):
    - When `minOrderAmount` increased above cart subtotal (`2000 > 800`) or coupon expired: `appliedCoupon` is **automatically cleared** and toast informs the customer.
    - When discount changed (`20%` → `10%`): `appliedCoupon` discount updates to the new value.
  - Even if Session C bypasses UI and submits `POST /api/orders` with `couponCode: "AUDITTEST20"`, the server rejects with `400 INVALID_COUPON`.

### `COUP-04`: Toggle Coupon Disabled / Enabled (`toggle_coupon`)
- **Actor**: Session A.
- **Steps**: Click **Disable** on `AUDITTEST20`.
- **Expected**:
  - `POST /api/admin` (`action: 'toggle_coupon', code: 'AUDITTEST20'`) returns `200 OK` (`isActive: false`), `audit_logs` records `COUPON_TOGGLED`.
  - **Session B**: Badge flips immediately from `Active` to `Disabled` and `Active Campaigns` KPI decrements.
  - **Session C**: `GET /api/orders?action=validate_coupon&code=AUDITTEST20&subtotal=1000` returns `{ valid: false, discountAmount: 0, message: "...currently disabled" }`. Active cart applying it strips the coupon on validation/checkout.
  - Re-click **Enable** → `isActive: true` propagates to Session B & C.

### `COUP-05`: Delete Coupon (`delete_coupon`)
- **Actor**: Session A.
- **Precondition**: Session C has `AUDITTEST20` applied in cart.
- **Steps**: Click Trash icon on `AUDITTEST20` → Confirm **Delete Voucher**.
- **Expected**:
  - `POST /api/admin` (`action: 'delete_coupon', code: 'AUDITTEST20'`) returns `200 OK`; `audit_logs` records `COUPON_DELETED`.
  - **Session B**: Row disappears immediately from `CouponsManager` table.
  - **Session C**: Validation returns `valid: false`; checkout rejects `AUDITTEST20` with `400 INVALID_COUPON`; refreshing Admin/Customer preserves deletion.

---

## 6. Orders CRUD, Payment Verification & Revalidation Test Cases

### `ORD-01`: Customer Order Creation → Admin Real-Time Notification (`POST /api/orders`)
- **Actor**: Session C (Checkout).
- **Steps**:
  1. Add an in-stock item (e.g., stock `10`) with optional active coupon to cart.
  2. Complete Checkout using `Direct UPI` and an alphanumeric UTR (e.g., `SBIN004819201`) or 12-digit UTR, plus optional receipt screenshot.
  3. Submit Order.
- **Backend Verification**:
  - `POST /api/orders` returns `201 Created` (`version: 1`, `status: 'confirmed'`, `verificationStatus: 'utr_submitted'`, `paymentStatus: 'pending_verification'`, server-recomputed totals, decremented product stock `10 → 9`).
  - Repeating identical `idempotencyKey` returns `200 OK` (`idempotentReplay: true`) without double-charging stock or creating a second order.
- **Cross-Session Revalidation**:
  - **Session A & Session B**: Both receive `admin_updated` (`reason: "order_created"`) AND `catalog_updated` (`reason: "order_stock_reserved"`).
  - New order appears immediately in `Fulfillment Queue`, `Payment Desk` (`Awaiting Review`), KPI counters (`Genuine Orders`, `Pending Verify`, `Gross Revenue`), and `Customer Directory`.
  - Product stock drops to `9` in `Product Catalog` and Session C's storefront.

### `ORD-02`: Public Tracking Privacy & Scope Checks (`GET /api/orders`)
- **Steps**:
  1. `GET /api/orders?track=<ORDER_ID>` (unauthenticated): returns `200 OK` with **masked** `customerName` (e.g., `Rohan D.`), **masked** `utrNumber` (`••••••••9201`), and **redacted** `deliveryAddress.addressLine` / `phone` / `email`.
  2. `GET /api/orders` (unauthenticated): returns `401`/`403`.
  3. `GET /api/orders?scope=mine` (authenticated Customer C): returns only Customer C's own `user_id` orders.

### `ORD-03`: Payment Verification — Single & Bulk (`VerificationDesk` → `POST /api/admin`)
- **Actor**: Session A (`Payment Desk` tab).
- **Precondition**: Session B has `Fulfillment Queue` or `Payment Desk` open, and also test with Session B having the target order's detail modal open!
- **Steps**:
  1. Click **Inspect Uploaded Payment Slip** → click **Approve This Slip** (verify button disables while awaiting, modal only closes after `200 OK`).
  2. *(Separately with ≥2 UTR orders)* Click **Approve All Pending** (`bulk_verify_payments`).
- **Backend Verification**:
  - Single approve sends `POST /api/admin` `{ action: 'verify_payment', orderId, utrNumber, expectedVersion }`.
  - Returns `200 OK`: `verificationStatus: 'desk_verified'`, `paymentStatus: 'paid'`, `status: 'preparing'`, `version` incremented.
  - `audit_logs` records `PAYMENT_VERIFIED`.
  - Duplicate UTR check: attempting to assign the same UTR to another non-cancelled order returns `409 DUPLICATE_UTR`.
- **Cross-Session Revalidation**:
  - **Session B**: Order moves automatically from `Awaiting Review` to `Desk Verified`, `Pending Verify` KPI decrements, `Verified Revenue` KPI increases, and Session B's open Order Detail Modal live-updates its status badge to **Garment In Production** / **desk verified** without closing or showing stale state.
  - **Session C**: Tracking modal (`TrackOrderModal`) / `ProfileView` reflects `desk_verified` & `preparing`.

### `ORD-04`: Order Status Progression (`AdminView` / `HostelDeliveryLogistics`)
- **Actor**: Session A (`Fulfillment Queue` dropdown or modal **Mark Ready / Mark Collected**, AND `Shipping & Logistics` **Dispatch Courier / Mark Handed Over**).
- **Steps**:
  1. Advance order `preparing` → `ready_for_handover` → `delivered`.
  2. Verify logistics action button disables (`Updating...`) while request is in flight.
- **Expected**:
  - Sends `POST /api/admin` `{ action: 'update_order_status', orderId, status, expectedVersion }` (or `PATCH /api/orders` via API).
  - Returns `200 OK` with incremented `order.version`; `audit_logs` records `ORDER_STATUS_UPDATE`.
  - **Session B**: Order status badge & KPI counts (`In Production`, `Ready`, `Delivered`) update across `Fulfillment Queue`, `Shipping & Logistics`, and open Order Detail Modal.

### `ORD-05`: Cancel Order & Automatic Inventory Restoration (`cancel_order`)
- **Actor**: Session A.
- **Precondition**: Note current stock of items in the order (e.g., `9`) and whether `paymentStatus` is `'paid'`.
- **Steps**:
  1. Select `Cancelled` on an active order → enter reason (`Student requested size exchange`) → confirm cancellation.
  2. Afterward, try dispatching/verifying/reactivating the cancelled order via API (`PATCH /api/orders` or `verify_payment`).
- **Expected**:
  - `POST /api/admin` (`action: 'cancel_order'`) returns `200 OK` with `status: 'cancelled'`, `cancellationReason`, and `refundStatus: 'pending'` (if `paid`) or `'none'` (if unpaid).
  - `products` stock is restored (`9 → 10`) inside the same SQLite transaction.
  - `audit_logs` records `ORDER_CANCELLED`.
  - Attempting to reactivate or verify a cancelled order returns `409` (`ALREADY_CANCELLED` / `ORDER_CANCELLED`).
  - **Session B & Session C**: Session B sees cancelled status & restored product stock; Session C sees `catalog_updated` (`order_cancelled_stock_restored`) restoring available stock on the storefront.

### `ORD-06`: Permanent Order Deletion (`DELETE /api/admin`)
- **Actor**: Session A (`super_admin` or `operations_lead`).
- **Precondition**: Open the **same order's** Detail Modal in **Session B** before deleting in Session A!
- **Steps**:
  1. In Session A, delete a **non-cancelled** test order via Delete button → confirmation modal.
  2. Observe Session B's open modal and dashboard.
- **Expected**:
  - `DELETE /api/admin` sends `{ orderId, expectedVersion }`, returns `200 OK`.
  - Stock is restored for non-cancelled orders (and **not** double-restored if order was already `cancelled`), `audit_logs` records `ORDER_DELETED`.
  - **Session B**: Receives `admin_updated` (`reason: "order_deleted"`); the order disappears from the table **and** Session B's open Order Detail Modal closes cleanly (`selectedOrder` sync effect sets `null`) with zero console errors.
  - **Session C**: Restored stock reflects on storefront via `catalog_updated`.

### `ORD-07`: Concurrent Order Mutation Conflict (`409 VERSION_CONFLICT`)
- **Actor**: Session A and Session B.
- **Steps**:
  1. Both sessions hold order at `version: 1`.
  2. Session A updates status to `ready_for_handover` (`version` becomes `2`).
  3. Using a stale `expectedVersion: 1` (e.g., simultaneous click before SSE lands or DevTools replay), Session B sends `update_order_status`, `verify_payment`, or `DELETE /api/admin`.
- **Expected**:
  - Server returns `409 Conflict` (`code: "VERSION_CONFLICT"`).
  - Client `CartContext` triggers `refreshAdminDashboard(true)` and notifies the admin without overwriting Session A's update.

---

## 7. Real-Time SSE, Fallback Sync & Persistence Edge Cases

### `SYNC-01`: Verify EventStream Frames & Source Client Deduplication
1. Open DevTools → **Network** → `events` (`EventStream` tab) in both Session A and Session B.
2. Perform a coupon toggle in Session A.
3. **Verify**:
   - Both streams receive `admin_updated` with matching `version` and Session A's `sourceClientId`.
   - Session B triggers exactly one `GET /api/admin` dashboard fetch immediately after receiving the event.
   - Session A does **not** trigger an extra redundant `GET /api/admin` loop from its own echoed SSE event (only its mutation's direct refresh).

### `SYNC-02`: SSE Connection Interruption & 8-Second Polling / Reconnect Recovery
1. In Session B, temporarily block `/api/admin/events` in DevTools Network Request Blocking (or toggle **Offline** briefly).
2. Perform a product price edit + coupon creation in Session A.
3. Unblock `/api/admin/events` / restore network in Session B (do **not** reload page).
4. **Verify**:
   - Either the `8000ms` visible-tab poll, `online` listener, `focus` listener, or `6000ms` SSE reconnect brings Session B fully into sync with Session A's changes within ≤8 seconds.

### `SYNC-03`: Date Range Filter Synchronization (`adminDateRange`)
1. In Session A (`Fulfillment Queue`), switch Window preset (`Today`, `Last 7 Days`, `All Time`) or custom dates (`from`/`to`).
2. **Verify**: `GET /api/admin?from=...&to=...` fires and KPI cards reflect server-recomputed filtered stats while Session A mutations still trigger `catalog_updated` / `admin_updated`.

### `SYNC-04`: Server Restart Persistence
1. After executing `PROD-01`, `COUP-01`, and `ORD-01`, restart the Node/Express server (`npm run dev` / `npm run start`).
2. Reload Session A, B, and C.
3. **Verify**: All created/updated/deleted products, coupons, orders, stock counts, and audit log entries persist from `./data/store.db` with zero state loss.

### `SYNC-05`: Backend Error Handling (No Silent Local Fallback)
1. Simulate an authorization failure (`401`/`403`) or invalid input (`400`/`409`) during any Admin CRUD action.
2. **Verify**: The UI displays the genuine server error banner/toast, keeps inputs editable or reverts unsaved optimism, and **never** shows a fake success message or saves admin changes into `localStorage`.

---

## 8. Automated Test Execution & Sign-Off Checklist

### 8.1 Run Automated Integration Suite
Run the full backend & logic test suite (uses isolated temp SQLite files in `os.tmpdir()`, leaving `./data/store.db` untouched):

```bash
npx tsx --test \
  src/server/adminOrderIntegrity.test.ts \
  src/server/cartService.test.ts \
  src/server/newsletterService.test.ts \
  src/checkout/checkoutLogic.test.ts \
  src/utils/cartLogic.test.ts
```

Run build and static type checks:

```bash
npm run lint && npm run build
```

### 8.2 Verification Sign-Off Table
| Test Group | Key Assertions Verified | Pass Criteria | Status |
| :--- | :--- | :--- | :--- |
| **RBAC Matrix** | Role permissions enforced in UI & API (`401`/`403`) | Unauthorized roles blocked server-side | [ ] |
| **Products CRUD (`PROD-01`–`08`)** | Create, 0-stock, duplicate, update, stock toggle, `409` OCC, delete | Persists in DB; `catalog_updated` + `admin_updated` sync Session B & C | [ ] |
| **Coupons CRUD (`COUP-01`–`05`)** | Create (`201`), update, toggle, delete, cart invalidation | Active customer bags revalidate & reject disabled/deleted coupons | [ ] |
| **Orders CRUD (`ORD-01`–`07`)** | Checkout (`201`), tracking privacy, single/bulk verify, status flow, cancel stock restore, delete modal sync, `409` OCC | Transactional stock + revenue KPIs + live modal sync across admins | [ ] |
| **SSE & Persistence (`SYNC-01`–`05`)** | Echo dedup, SSE reconnect/8s poll, date filters, restart survival, error honesty | Zero stale state across tabs/browsers/restarts; no fake local saves | [ ] |
