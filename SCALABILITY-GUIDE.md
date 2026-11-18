# Store scalability and free-tier hardening

## Implemented in this update
- Added a hardened, all-or-nothing `reserve_inventory(jsonb)` function.
  - Rejects empty/malformed item arrays, non-positive quantities and oversized quantities.
  - Consolidates duplicate product IDs.
  - Locks stock rows through conditional updates and processes product IDs in sorted order.
  - PostgreSQL rolls back the entire function call if any item is unavailable, so partial reservations cannot remain.
  - Function execution remains restricted to `service_role`.
- Added order-history and inventory indexes.
- Enabled AVIF/WebP output and responsive image widths in Next Image.
- Displayed the existing deterministic product SKU as `ITEM NO.` on product cards.

## Apply the database migration
Run `supabase/migrations/202611170001_scalability_inventory.sql` in Supabase SQL Editor after the previous migrations.

## Free improvements to do before launch
1. Keep product/catalog pages cacheable. Never cache `/api/orders/*`, `/api/account/*`, cart, checkout, inventory writes, or admin endpoints.
2. Use `next/image` for every product image. Prefer compressed WebP/AVIF source images (aim for ~100–250 KB per product image where visual quality permits) and avoid uploading huge PNGs.
3. Keep product images at a consistent aspect ratio and provide width/height or `fill` with a stable aspect-ratio container.
4. Add database indexes for columns used in filters and joins; inspect slow queries in Supabase Query Performance.
5. Use pagination for admin orders and catalogue lists; never fetch an unlimited order history.
6. Avoid calling `currentUser()` or querying profile data on public pages unless needed. Keep public catalogue pages independent of authentication.
7. Debounce search input and avoid firing a database request for every keystroke.
8. Use one Supabase server client per request/runtime module as already designed; do not create a new client repeatedly inside loops.
9. Keep uploads bounded by file type and size; resize payment proofs client-side before upload. Do not accept unbounded base64 payloads.
10. Add idempotency to order placement before enabling high-volume checkout. A retry from the browser/network should not create a second order or payment.
11. Ensure cancellation/refund/admin rejection releases stock exactly once. The current stock reservation is atomic at reservation time; verify all later cancellation paths before production.
12. Add a scheduled cleanup only if you introduce expiring reservations. Do not expire a stock hold while payment proof is awaiting manual review.
13. Use rate limiting for login, order placement, UTR submission and uploads. An in-memory Map is not global across serverless instances; use a database-backed counter or an edge rate-limit service if one is available on your existing plan.
14. Run k6 against a staging deployment, not production payment endpoints. Ramp 25 → 50 → 100 → 250 → 500 virtual users and monitor p95 latency, errors, function duration and Supabase database health.
15. Test two simultaneous requests for the last unit of a product: exactly one should succeed.

## Important limitations
- This project update does not add a paid load balancer, extra server instances, Redis, or a paid monitoring service.
- Image format conversion uses Next.js Image Optimization at runtime; source image compression is still recommended.
- Atomic inventory reservation is implemented in the existing order placement flow. Stock release after later cancellation/rejection must be checked against the actual admin order-status workflow before launch.
- No 500-user capacity claim is made without a load test. Vercel Hobby is also not suitable for commercial production use under its current plan terms; check the provider's current terms and upgrade if required.


## Additional admin/catalogue improvements in this update
- Product SKU is generated on the server from category slug/name + product URL slug, e.g. `NITRR-OUTERWEAR-ECELL-VARSITY-JA`.
- Product SKU is read-only in the admin editor and cannot be changed through the update API.
- Variant SKU is stored as `<product SKU>-<admin suffix>`. The admin only edits the suffix, not the full SKU.
- Product image uploads are compressed in the browser to WebP (max 1800 px, quality 82), capped at 8 images per product, source file max 10 MB and server file max 5 MB.
- Admin catalogue search is debounced and the visible catalogue list is paginated client-side.
- Admin orders API now supports `page` and `pageSize` (maximum 100); admin dashboard loads 50 orders per page.
- Search modal query is debounced.
- Added `tests/load/store-smoke.js` and `npm run test:load` for safe read-only load checks against `/`, `/shop` and `/api/inventory`.

## Not yet implemented / must be completed before production
- Checkout idempotency is not yet implemented end-to-end. Add a database-backed unique idempotency key per user/request and have the checkout client reuse the same key for network retries before accepting production traffic.
- Catalogue admin API still retrieves all catalogue rows before client-side pagination; for a very large catalogue, change this to database `.range()` pagination and server-side search.
- Product image upload currently checks MIME and size but should additionally inspect file signatures server-side.
- The current k6 script intentionally does not submit orders, payment proofs, or admin mutations. Use a staging environment and add authenticated test scenarios separately.
- The order status cancellation stock release workflow should be verified for exactly-once release under concurrent admin actions.


## Admin governance: category management, deletion and audit trail

Apply `supabase/migrations/202611170002_admin_governance.sql` in Supabase SQL Editor AFTER the earlier migrations.

This migration:
- Creates a protected `Reserve` category.
- Creates `admin_activity_logs` for administrator actions.
- Adds transactional RPCs to rename categories and regenerate product + variant SKUs.
- Adds a transactional RPC to move products to Reserve, regenerate their SKUs, then delete the old category.

Admin UI/API:
- Products have separate edit, archive (box/archive icon) and permanent-delete (trash icon) actions.
- Permanent product deletion is blocked when the product is referenced by an order or inventory record; archive it instead.
- Categories can be edited. Renaming a category regenerates all assigned product SKUs and variant SKUs in the same database transaction.
- Deleting a category moves its products to Reserve, regenerates their SKUs, and deletes the old category. Reserve itself is protected.
- Super Admin sees a Recent Work tab beside Manage Team. It records product create/update/archive/delete, category create/update/delete, order status changes, stock updates, and admin team changes.
- Recent Work endpoint is Super Admin-only.

Audit limitation:
- The activity table records successful actions routed through the instrumented server endpoints. Failed attempts and actions performed directly in Supabase SQL Editor are not recorded.
- Apply the migration before using category edit/delete or Recent Work.


## Admin API abuse protection
- Admin API endpoints: 15 requests/minute per IP, HTTP method and endpoint.
- Excess requests receive HTTP 429 with a `Retry-After` header.
- The `/admin` page and Next.js navigation/RSC requests are not rate-limited.
- This in-memory limiter is best-effort for local/single-instance deployments; use shared Redis/Upstash storage when running multiple production instances.
