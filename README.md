# ✦ Unwearable ✦

> **A Brutalist-designed, serverless e-commerce platform with a built-in Custom Design Builder.** 
> Built with Next.js (App Router), Supabase, Clerk, manual UPI verification, and manual store fulfillment print-on-demand fulfillment.

---

## 📖 Project Overview

**Unwearable** is a next-generation streetwear e-commerce platform that combines a high-contrast **Brutalist UI** aesthetic with a state-of-the-art **Design Builder** for apparel customization. 

Designed for extreme scalability and zero maintenance, it relies entirely on a modern serverless stack. From secure webhook handling for manual UPI verification to asynchronous background fulfillment via the manual store fulfillment API, the architecture ensures orders flow seamlessly from checkout to printing without manual intervention.

---

## ✨ Features

- **Brutalist UI**: High-contrast, Neo-Brutalist styling with thick borders, hard shadows, and custom micro-animations.
- **Custom Design Builder**: An interactive 4-step HTML5 Canvas builder allowing users to overlay text and graphics onto apparel in real-time.
- **Serverless Architecture**: Built entirely on Next.js Route Handlers utilizing Vercel's Edge and Serverless functions.
- **Secure Authentication**: Passwordless and secure email magic-link auth powered by Clerk.
- **Automated Dropshipping**: Asynchronous integration with the manual store fulfillment API for hands-off print-on-demand fulfillment.
- **Robust Payment Pipeline**: Secure manual UPI verification integration with strictly verified webhooks.
- **Row Level Security (RLS)**: Data privacy strictly enforced at the database level via Supabase PostgreSQL.

---

## 📸 Screenshots

*(Replace with actual screenshots of your application)*

| Home Page | Custom Builder | Checkout |
| :---: | :---: | :---: |
| ![Home Page](./docs/images/placeholder.png) | ![Builder](./docs/images/placeholder.png) | ![Checkout](./docs/images/placeholder.png) |

---

## 📚 Technical Documentation

For deep dives into specific parts of the system, please refer to the extensive documentation in the `docs/` folder:

- [Architecture Overview](./docs/architecture.md)
- [Backend & Serverless API](./docs/backend.md)
- [Frontend & UI](./docs/frontend.md)
- [Database & Security](./docs/database.md)
- [Custom Design Builder](./docs/design-builder.md)
- [Deployment Guide](./docs/deployment.md)
- [Internal API Reference](./docs/api.md)

*(Looking to hire the engineer behind this? Check out the [Resume Summary](./docs/resume-summary.md).)*

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Core Framework** | Next.js 16 (App Router) & React 19 |
| **Authentication** | Clerk |
| **Database** | Supabase (PostgreSQL) |
| **Styling** | Tailwind CSS v4 |
| **Payments** | manual UPI verification |
| **Fulfillment** | manual store fulfillment REST API |

---

## 📁 Folder Structure

```text
.
├── src/
│   ├── app/              # Next.js App Router Segments (Pages & API Routes)
│   ├── components/       # Reusable React UI Components
│   ├── context/          # React Context Providers (Cart, Design)
│   ├── lib/              # Client & Server integrations
│   ├── types/            # TypeScript definitions
│   └── server/           # Core Business logic & Service Layer
├── docs/                 # Detailed Technical Documentation
└── supabase/
    └── migrations/       # Database schemas & migrations
```

---

## 🚀 Installation & Running Locally

### 1. Clone & Install
```bash
git clone https://github.com/yourusername/unwearable.git
cd unwearable
npm install
```

### 2. Database Setup
1. Create a Supabase project.
2. Run the migration script located in `supabase/migrations/00000000000000_initial_schema.sql` inside your Supabase SQL Editor.
3. Create a public Storage bucket named `designs`.

### 3. Start Development Server
```bash
npm run dev
```
The platform will be available at `http://localhost:3000`.

---

## 🔐 Environment Variables

Create a `.env.local` file in the root directory. **Never commit this file.**

```env
# Copy values from .env.example and fill in your own credentials.
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_ROLE=admin
STORE_UPI_ID=
STORE_WHATSAPP=
STORE_PHONE=
ENABLE_DESIGN_BUILDER=true
ENABLE_PAYMENTS=false
```

---

## ☁️ Deployment

The repository is fully optimized for **Vercel**.
1. Import the repository into your Vercel dashboard.
2. Add all the Environment Variables in the Vercel project settings.
3. Deploy! Next.js and Vercel will automatically configure the build process (`npm run build`).

*(For more details on handling serverless constraints during deployment, see the [Deployment Docs](./docs/deployment.md))*

---

## 🗺️ Roadmap & Future Plans

The platform is continuously evolving. Our immediate roadmap includes:
1. **Isolation of the Custom Builder**: Extracting the design canvas out of the core e-commerce monolith into a standalone micro-frontend environment.
2. **Analytics Dashboard**: Adding visual data representations for admins to track revenue and order volume.
3. **Performance Optimization**: Implementing Upstash Redis caching for high-traffic product catalog routes.

*See the full [Roadmap](./docs/roadmap.md) for more details.*

---

## 📄 License

This project is licensed under the [MIT License](./LICENSE).


## Recent store operations update

- For a fresh database, run all SQL files in `supabase/migrations` in chronological order. For an existing database, run only the new `202611110001` and `202611110002` migrations. Initial stock is zero; update quantities in Admin → Inventory.
- Configure Clerk email verification by code, password sign-in, username as a sign-in identifier, Google OAuth, and phone-number verification by SMS. See [Admin and account setup](./docs/admin-setup.md). Public signup always creates a regular customer; it never assigns admin privileges.
- Create your first Clerk user normally, then run `BOOTSTRAP_ADMIN_EMAIL=you@example.com CLERK_SECRET_KEY=sk_... node scripts/bootstrap-admin.mjs` once to assign `super_admin`. Remove the bootstrap email secret afterwards.
- A Super Admin can promote an existing registered user from Admin → Manage team.
- Checkout records manual UPI payment claims as pending/unverified. The team must verify the bank credit and update the order status in Admin. A UTR or screenshot is not treated as proof of settlement.
- Fulfillment is handled manually by the store team; no Razorpay or Qikink integration is included.


## Admin governance migration
Run `supabase/migrations/202611170002_admin_governance.sql` after the existing migrations to enable category edit/delete-to-Reserve and the Super Admin Recent Work audit tab.
