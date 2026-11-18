# API Reference

## Customer

- `POST /api/orders/place` — creates a manual-UPI order for the authenticated Clerk user. Prices are revalidated against the server product catalogue, stock is reserved atomically, and payment/order status remains pending until staff verifies the bank credit.
- `GET /api/inventory` — public read-only stock quantities used by the storefront.

## Admin (Clerk role required)

- `GET /api/admin/orders` — lists orders newest first.
- `PATCH /api/admin/orders` — updates an order status. Marking an order `paid` verifies its linked manual payment record; cancelling an order releases reserved stock.
- `PATCH /api/inventory` — updates an item quantity.
- `GET /api/admin/team` — lists admins (Super Admin only).
- `POST /api/admin/team` — promotes an existing verified Clerk user to `admin` (Super Admin only).

There are no Razorpay, Qikink, payment webhook, or automatic fulfillment endpoints.
