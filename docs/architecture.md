# Architecture

The store is a Next.js App Router application using React and TypeScript. Clerk handles identity, Supabase PostgreSQL stores orders, payment claims, inventory, templates and designs, and the catalogue is currently sourced from `src/data/netrifyProducts.ts`.

## Main flows

- Public storefront pages render the catalogue and fetch read-only inventory quantities from `/api/inventory`.
- Clerk sign-up verifies the email, then `/complete-profile` requires a verified phone number and lets the user set a username initially derived from their email.
- Checkout requires an authenticated account with a verified phone. The server validates product IDs, quantities and prices, then reserves stock and records a pending manual-UPI order.
- Admin routes require Clerk `publicMetadata.role` to be `admin` or `super_admin`. A Super Admin can promote an existing verified user to `admin`.
- Staff verify payment directly against the receiving bank account, then update order status and fulfill/deliver the order manually.

No payment gateway or print-on-demand integration is part of the current flow.
