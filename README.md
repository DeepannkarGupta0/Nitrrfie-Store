<div align="center">

# NIT Raipur Store

**Official Campus & Alumni Merchandise Platform — National Institute of Technology Raipur**

[![React](https://img.shields.io/badge/React-19-149ECA?style=flat-square&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Clerk](https://img.shields.io/badge/Auth-Clerk-6C47FF?style=flat-square&logo=clerk&logoColor=white)](https://clerk.com/)
[![SQLite](https://img.shields.io/badge/Database-SQLite-003B57?style=flat-square&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A522.18-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)

[Project Overview](#project-overview) · [Tech Stack](#tech-stack) · [Setup Instructions](#setup-instructions) · [Environment Variables](#environment-variables) · [Deployment Guide](#deployment-guide) · [Administrative Testing Checklist](#administrative-testing-checklist)

</div>

---

## Project Overview

**NIT Raipur Store** is the official digital storefront and fulfillment operations platform serving students, faculty, clubs, and alumni of the **National Institute of Technology Raipur**. Built as a unified full-stack web application, it pairs an editorial storefront experience with an authoritative backend database so catalog availability, pricing, promotional rules, customer bags, and fulfillment workflows stay synchronized across every device and coordinator session.

### Architectural Pillars

| Pillar | What It Delivers |
| :--- | :--- |
| **Official Storefront & Studio** | Curated collegiate drops, club & society collections, live inventory awareness, persistent wishlists, and an interactive garment personalization studio. |
| **Authoritative Server Commerce** | Database-persisted customer bags with seamless guest-to-account handoff, server-computed totals and coupon validation, campus & pan-India fulfillment options, and privacy-masked public order tracking. |
| **Operations & Governance Suite** | Segregated staff portal for catalog administration, promotional campaign control, payment verification, hostel/courier logistics, subscriber management, and immutable audit history. |
| **Zero-Drift Real-Time Sync** | Continuous event broadcasting paired with concurrency protection ensures pricing, stock, and order updates propagate across active storefronts and staff sessions without manual refreshes. |

---

## Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | **React 19** & **TypeScript** | Component architecture, strict type safety, and predictable state orchestration |
| **Build & Tooling** | **Vite 8** | Fast development middleware and optimized static production bundling |
| **Styling & Motion** | **Tailwind CSS v4**, **Motion**, **Lucide React** | Responsive design system, fluid transitions, light/dark theming, and iconography |
| **Identity & Access** | **Clerk** (`@clerk/clerk-react`, `@clerk/backend`) | Customer sign-in flows alongside server-verified session authentication and staff authorization |
| **Persistence** | **SQLite** (Node built-in `node:sqlite`, WAL mode) | ACID-compliant centralized data store requiring zero external database provisioning |
| **Runtime & Server** | **Node.js `>= 22.18.0`** & **Express 4** | API orchestration, real-time Server-Sent Events (SSE), security headers, and asset delivery |
| **External Integrations** | **Transactional Email & AI Services** | Optional email confirmation dispatch and server-proxied generative assistance |

---

## Setup Instructions

### Prerequisites
- **Node.js `>= 22.18.0`** (required for built-in `node:sqlite` support and native TypeScript server execution)
- **npm** (or a compatible Node package manager)

### Local Bootstrap

1. **Clone the repository and install packages**
   ```bash
   git clone <repository-url>
   cd <repository-folder>
   npm install
   ```

2. **Initialize local environment configuration**
   ```bash
   cp .env.example .env
   ```
   Populate `.env` with your local credentials and storefront settings (see [Environment Variables](#environment-variables)).

3. **Run the development environment**
   ```bash
   npm run dev
   ```
   The unified application server starts at **`http://localhost:3000`**. On initial startup, the backend initializes the local SQLite store and seeds baseline catalog items automatically.

### Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Launches the Express API and Vite middleware in development mode |
| `npm run build` | Produces the optimized production browser bundle in `dist/` |
| `npm run start` | Runs the production server serving `dist/` and backend services |
| `npm run lint` | Executes strict TypeScript type checking (`tsc --noEmit`) |
| `npm run preview` | Previews the built Vite client bundle |
| `npm run clean` | Removes generated build artifacts |

---

## Environment Variables

All configuration keys are declared and annotated in **[`.env.example`](./.env.example)**. Configure `.env` locally for development and inject values through your hosting platform's secret manager in production.

> **Security Notice**: Never commit `.env` files, real payment identifiers, or service secrets to version control.

### Frontend Build Configuration (`VITE_*`)
*Compiled into client assets during `npm run build` — these values are public to browsers.*

| Variable | Description |
| :--- | :--- |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key for client authentication UI |
| `VITE_STORE_UPI_ID` | Official merchant UPI identifier displayed at checkout |
| `VITE_COORDINATOR_PHONE` | Storefront support contact number with country code |

### Server Runtime & Domain Configuration

| Variable | Description |
| :--- | :--- |
| `PORT` | HTTP port bound by the Express server (defaults to `3000`) |
| `STORE_DB_PATH` | Filesystem path for the persistent SQLite database (defaults inside `./data/`) |
| `ALLOWED_ORIGINS` | Comma-separated canonical origins/hostnames permitted for cross-origin and state-changing requests |
| `APP_PUBLIC_URL` | Canonical HTTPS base URL used in outbound links and transactional messages |

### Server-Side Secrets & Integrations
*Strictly server-only — never exposed to browser bundles.*

| Variable | Description |
| :--- | :--- |
| `CLERK_SECRET_KEY` | Clerk backend secret used for authoritative token verification |
| `ADMIN_SECRET_KEY` | High-entropy secret key reserved for authorized maintenance workflows |
| `BREVO_API_KEY` | Optional transactional email API credential |
| `BREVO_SENDER_EMAIL` | Verified sender email address for outbound notifications |
| `BREVO_SENDER_NAME` | Sender display name shown on transactional emails |
| `GEMINI_API_KEY` | Optional API key consumed exclusively by the server-side AI proxy |

---

## Deployment Guide

### 1. Pre-Release Repository & Build Checks
- Confirm `git status` is clean of local databases, build outputs, and `.env` files (`.gitignore` protects `.env*`, `data/`, `node_modules/`, and `dist/`).
- Provision **Node.js `22.18.0+`** on your target host.
- Ensure all `VITE_*` variables are configured in your CI/hosting build environment **before** running `npm run build`.

### 2. Build & Production Launch
```bash
npm ci
npm run lint
npm run build
NODE_ENV=production npm run start
```

### 3. Production Infrastructure Requirements
- **Persistent Disk Storage**: Ephemeral containers discard local filesystem changes on redeploy. Mount a persistent volume and set `STORE_DB_PATH` to a location on that volume so catalog, order, cart, and audit data survive restarts and updates.
- **Single-Process Topology**: Deploy as a single Node.js instance so real-time event streams broadcast reliably across all connected clients without split-brain state.
- **Domain & SEO Configuration**: Set `APP_PUBLIC_URL` and `ALLOWED_ORIGINS` to your production domain, and update canonical URLs inside `public/sitemap.xml` prior to launch.
- **Post-Deploy Readiness Check**: Confirm `GET /api/health` returns `200 OK` before routing public traffic.

---

## Administrative Testing Checklist

Authorized maintainers should verify these data-integrity and synchronization invariants prior to production releases or after backend updates.

### Access Control & Authorization
- [ ] Unauthenticated requests to administrative or catalog-mutation operations are rejected by the server without modifying state.
- [ ] Signed-in accounts outside the authorized staff roster are denied access to administrative controls.
- [ ] Role boundaries are enforced server-side so restricted coordinators cannot bypass permissions to alter promotions or permanently remove records.

### Catalog & Inventory Integrity
- [ ] Creating, duplicating, editing, toggling availability, and adjusting stock persist centrally in SQLite and reflect across independent browser sessions and themes.
- [ ] Out-of-stock (`0` quantity) items remain strictly at zero after creation/updates and cannot be checked out by customers.
- [ ] Concurrent edits to the same product from two staff sessions preserve the newer commit and trigger conflict recovery rather than silent overwrites.
- [ ] Permanent item removal immediately updates both administrative views and live public storefront catalogs.

### Promotions & Cart Consistency
- [ ] Creating, updating, disabling, or deleting a promo code enforces server validation rules before confirming success in the UI.
- [ ] Disabling or removing an active promo code automatically invalidates it in active customer bags and prevents redemption at checkout.

### Orders, Payment Verification & Stock Lifecycle
- [ ] Order totals, promotional discounts, and stock limits are recomputed and enforced authoritatively on the server during checkout.
- [ ] Duplicate submission safeguards prevent double-charging/duplicate order creation on retries and block conflicting transaction reference submissions.
- [ ] Single and batch payment approvals update order fulfillment state consistently across all open staff sessions.
- [ ] Cancelling or removing an active order atomically restores product stock, while repeat cancellation attempts cannot double-restore inventory.
- [ ] Public order-tracking lookups redact sensitive personal, payment, and address details while still surfacing accurate fulfillment status.

### Multi-Session Synchronization & Resilience
- [ ] Changes performed by one administrator appear automatically in other active staff and storefront sessions, and recover cleanly after brief network interruptions.
- [ ] Every administrative mutation records an immutable audit trail entry identifying the actor, action, and timestamp.
- [ ] Failed server requests display explicit error feedback and never fake local-only success state; full server restarts preserve all committed data.

### Automated Verification Suite
Execute static type checks, production bundling, and the isolated server/storefront logic test suite (runs against temporary databases without altering local store data):

```bash
npm run lint && npm run build && npx tsx --test src/*/*.test.ts
```


