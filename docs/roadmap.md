# Roadmap & Future Plans

The Unwearable platform is continuously evolving. Below are the planned phases for future development and architectural improvements.

## Phase 1: Clean Up & Documentation (Completed)
- Conducted full security and architecture audits.
- Removed dead code, unused dependencies, and deprecated endpoints.
- Consolidated database schemas and removed generic placeholder assets.
- Established a comprehensive technical documentation suite.

## Phase 2: Isolation of the Custom Builder (Upcoming)
The Custom Design Builder is currently embedded tightly into the main repository. To maintain a lean e-commerce core, the builder will be:
- Decoupled from the `src/app/customize` routes.
- Migrated to a separate, standalone local environment.
- Treated as a micro-frontend or external service that passes compiled designs back to the main application for checkout.

## Phase 3: Analytics & Admin Dashboard Expansion
- Implement tracking for popular products.
- Create visual data representations (charts) in the `/admin` panel for daily revenue and order volume.
- Build a dedicated UI for reviewing and retrying failed manual store fulfillment fulfillments directly from the browser instead of the database.

## Phase 4: Performance & SEO
- Implement Redis caching (via Upstash) for product listings to reduce Supabase queries on the homepage.
- Add comprehensive structured data (JSON-LD) to product pages for rich Google Search results.
- Implement Edge caching for static assets.
