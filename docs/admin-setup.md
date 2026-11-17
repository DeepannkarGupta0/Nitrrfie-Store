# Admin and account setup

## Clerk dashboard

Configure these settings in Clerk before enabling public registration:

1. Enable email address sign-up and email verification using a one-time code.
2. Enable password authentication.
3. Enable username as a sign-in identifier (email address and username can both be used).
4. Enable Google OAuth.
5. Phone number authentication and SMS verification are not used by this application. The `/complete-profile` form may collect an optional contact number and stores it as user-editable Clerk `unsafeMetadata.contactPhone`; it is not verified and must not be used for authentication, authorization, or account recovery. Email verification remains the account verification step.

The signup UI does not grant roles. New users are regular customers by default.

## First Super Admin

1. Register through the normal store signup page using your own email.
2. Complete the required email verification and profile setup. A phone number is optional and is not verified.
3. From the project root, run the one-time bootstrap command:

```bash
BOOTSTRAP_ADMIN_EMAIL=you@example.com CLERK_SECRET_KEY=sk_live_your_secret node scripts/bootstrap-admin.mjs
```

PowerShell:

```powershell
$env:BOOTSTRAP_ADMIN_EMAIL="you@example.com"
$env:CLERK_SECRET_KEY="sk_live_your_secret"
node scripts/bootstrap-admin.mjs
```

The script finds the existing Clerk user and sets `publicMetadata.role` to `super_admin`. Remove the temporary `BOOTSTRAP_ADMIN_EMAIL` value after it succeeds. Never expose `CLERK_SECRET_KEY` in frontend code or commit it.

## Add other admins

A Super Admin opens **Admin → Manage team**, enters the email of a person who has already registered and verified their email, and selects **Add admin**. That user signs in normally; their Clerk role grants access to `/admin`. Admins can manage orders and inventory. Only Super Admins can promote additional admins.

## Supabase migrations

For a fresh database, run the SQL migrations in chronological order. If the original schema has already been applied, run only:

- `202611110001_inventory.sql`
- `202611110002_manual_order_workflow.sql`

The inventory migration seeds all catalogue products at quantity zero. Enter actual on-hand quantities in **Admin → Inventory** before accepting orders. Orders reserve stock; cancelling an order releases it.

## Manual payment and fulfillment

Checkout records a customer-submitted UPI reference as an unverified payment claim. Admin staff must check the actual bank account/statement and change the order to **Payment verified**. This marks the payment record verified. Staff then handle packing and delivery manually and mark the order **Completed / Delivered** when finished. A UTR or screenshot alone must never be treated as proof that funds were received.
