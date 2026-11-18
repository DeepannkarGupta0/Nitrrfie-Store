# Backend Architecture

The application uses Next.js server routes, Clerk authentication, and Supabase PostgreSQL.

## Order lifecycle

1. A signed-in customer submits checkout details and a UPI reference.
2. The server validates each product and price against `src/data/netrifyProducts.ts`.
3. Supabase atomically reserves requested inventory using `reserve_inventory`.
4. The order and payment claim are stored as `pending` / `created` with `verified=false`.
5. Store staff check the actual bank statement and update the order to `paid` from the Admin Dashboard. This updates the payment record to `captured` / `verified=true`.
6. Staff process and deliver the order manually, then mark it `fulfilled`. Cancellation releases reserved stock.

A UTR or uploaded screenshot is a customer-provided claim, not proof of settlement.

## Roles

Clerk `publicMetadata.role` supports `customer` (default), `admin`, and `super_admin`. The one-time `scripts/bootstrap-admin.mjs` script assigns the first Super Admin to an existing Clerk user. Only Super Admins can promote other verified existing users. Every admin API validates the role server-side.

## Inventory

The `inventory` table stores one non-negative quantity per product ID. The public API exposes only product stock; write operations require an admin session. Run the inventory migration before using the dashboard.
