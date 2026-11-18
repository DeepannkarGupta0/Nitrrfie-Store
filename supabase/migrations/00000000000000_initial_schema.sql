-- ============================================================
-- Unwearable Production Schema
-- Run this in Supabase SQL Editor (Dashboard â†’ SQL Editor)
-- ============================================================

-- â”€â”€â”€ PAYMENTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.payments (
  id                 UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gateway            TEXT NOT NULL DEFAULT 'manual_upi',
  gateway_order_id   TEXT UNIQUE NOT NULL,
  gateway_payment_id TEXT UNIQUE,
  amount             INTEGER NOT NULL,
  currency           TEXT NOT NULL DEFAULT 'INR',
  status             TEXT NOT NULL DEFAULT 'created'
    CHECK (status IN ('created', 'captured', 'failed', 'refunded')),
  verified           BOOLEAN NOT NULL DEFAULT FALSE,
  webhook_payload    JSONB,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_gateway_order ON public.payments(gateway_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status        ON public.payments(status);

-- â”€â”€â”€ ORDERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.orders (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number     TEXT UNIQUE NOT NULL,
  user_id          TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'processing', 'fulfilled', 'failed', 'cancelled')),
  customer_name    TEXT NOT NULL,
  customer_email   TEXT NOT NULL,
  customer_phone   TEXT,
  shipping_address JSONB NOT NULL,
  items            JSONB NOT NULL,
  subtotal         INTEGER NOT NULL DEFAULT 0,
  total_amount     INTEGER NOT NULL,
  payment_id       UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  retry_count      INTEGER NOT NULL DEFAULT 0,
  error_message    TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status  ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_email   ON public.orders(customer_email);

-- â”€â”€â”€ ERROR LOGS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.error_logs (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  context    TEXT NOT NULL,
  severity   TEXT NOT NULL DEFAULT 'error'
    CHECK (severity IN ('info', 'warn', 'error', 'critical')),
  message    TEXT NOT NULL,
  payload    JSONB,
  user_id    TEXT,
  order_id   UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_logs_severity  ON public.error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_logs_context   ON public.error_logs(context);
CREATE INDEX IF NOT EXISTS idx_logs_created   ON public.error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_order_id  ON public.error_logs(order_id);

-- â”€â”€â”€ AUTO-UPDATE updated_at â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- â”€â”€â”€ ROW LEVEL SECURITY â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
ALTER TABLE public.orders    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Users can only read their own orders
CREATE POLICY "users_read_own_orders"
  ON public.orders FOR SELECT
  USING (auth.uid()::text = user_id);

-- Users can read payments linked to their orders
CREATE POLICY "users_read_own_payments"
  ON public.payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.payment_id = payments.id
        AND o.user_id = auth.uid()::text
    )
  );

-- error_logs are admin-only (no user policy = blocked for anon/user)
-- Access via supabaseAdmin (service_role) only

-- â”€â”€â”€ NOTIFY POSTGREST TO RELOAD SCHEMA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
NOTIFY pgrst, 'reload schema';
-- Run these commands in your Supabase SQL Editor
-- ============================================================

-- 1. Templates table
CREATE TABLE public.templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id TEXT NOT NULL,           -- matches products.slug
  name TEXT NOT NULL,
  base_image_url TEXT NOT NULL,       -- Supabase Storage URL (designs bucket)
  placements JSONB NOT NULL DEFAULT '[]'::jsonb,
  colors JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Designs table
CREATE TABLE public.designs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,              -- Clerk user ID (string)
  template_id UUID REFERENCES public.templates(id) ON DELETE CASCADE,
  product_slug TEXT NOT NULL,
  selected_color JSONB NOT NULL,      -- { id, hex, label }
  selected_placement JSONB NOT NULL,  -- { id, x, y, width, height, type, label }
  design_config JSONB NOT NULL,       -- { template_id, color, placement }
  preview_image_url TEXT,             -- Supabase Storage URL of rendered PNG
  status TEXT DEFAULT 'draft',        -- draft | confirmed | ordered
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable RLS
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.designs ENABLE ROW LEVEL SECURITY;

-- 4. Templates: anyone can read active templates (public catalog)
CREATE POLICY "Public can view active templates" ON public.templates
  FOR SELECT USING (is_active = TRUE);

-- 5. Templates: all authenticated users can read all (for admin)
-- Note: restrict to admin role in middleware, not RLS, for simplicity
CREATE POLICY "Authenticated users read all templates" ON public.templates
  FOR SELECT TO authenticated USING (TRUE);

-- 6. Templates: service role can write (used by admin API routes)
-- The admin form uses the anon key client â€” grant insert/update/delete to anon for now
-- TODO: Restrict to admin role in production using Clerk metadata + custom JWT
CREATE POLICY "Anon can manage templates" ON public.templates
  FOR ALL USING (TRUE);

-- 7. Designs: users can manage their own designs
CREATE POLICY "Users manage own designs" ON public.designs
  FOR ALL USING (TRUE);
  -- Note: In production, use: USING (auth.uid()::text = user_id)
  -- Clerk + Supabase RLS requires JWT integration setup first

-- ============================================================
-- STORAGE: Run in Supabase Dashboard â†’ Storage
-- ============================================================
-- 1. Create a bucket named "designs" and set it to PUBLIC
-- 2. Add these CORS headers to allow html2canvas cross-origin access:
--
-- Allowed Origins: http://localhost:3000, https://your-production-domain.com
-- Allowed Methods: GET, POST, PUT
-- Allowed Headers: *
--
-- ============================================================
-- EXAMPLE DATA: Insert a test template (replace product_id with your slug)
-- ============================================================
-- INSERT INTO public.templates (product_id, name, base_image_url, placements, colors, is_active)
-- VALUES (
--   '404-not-found-tee',
--   'Front Print â€” Classic',
--   'https://your-supabase-url.supabase.co/storage/v1/object/public/designs/templates/base-tee.png',
--   '[{"id":"front_center","x":140,"y":120,"width":200,"height":180,"type":"image","label":"Front Center"}]',
--   '[{"id":"void_black","hex":"#0A0A0A","label":"Void Black"},{"id":"ghost_white","hex":"#F5F0E8","label":"Ghost White"}]',
--   true
-- );
