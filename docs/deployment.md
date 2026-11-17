# Deployment

1. Copy `.env.example` to `.env.local` and fill in Clerk and Supabase credentials.
2. Run the SQL migrations in `supabase/migrations` in chronological order.
3. In Clerk, enable email verification using email code, configure Google OAuth, and enable phone-number verification for the post-signup contact step.
4. Create your own account through the normal signup page. Run the first-admin bootstrap script once with `BOOTSTRAP_ADMIN_EMAIL` and `CLERK_SECRET_KEY`; remove the bootstrap email secret afterwards.
5. Set actual product quantities in Admin → Inventory.
6. Deploy the Next.js application to Vercel. Never expose the Supabase service-role key or Clerk secret key to the browser.

Payments and fulfillment are manual. No Razorpay or Qikink credentials are required.
