-- Inventory quantities managed by the admin dashboard.
CREATE TABLE IF NOT EXISTS public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL UNIQUE,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
-- All writes and storefront reads use server-side service-role APIs.

INSERT INTO public.inventory (product_id, quantity) VALUES
  ('netrify-1', 0),
  ('netrify-2', 0),
  ('netrify-3', 0),
  ('netrify-4', 0),
  ('netrify-5', 0),
  ('netrify-6', 0),
  ('netrify-7', 0),
  ('netrify-8', 0),
  ('netrify-9', 0),
  ('netrify-10', 0),
  ('netrify-11', 0),
  ('netrify-12', 0),
  ('netrify-13', 0),
  ('netrify-14', 0),
  ('netrify-15', 0),
  ('netrify-16', 0),
  ('netrify-17', 0),
  ('netrify-18', 0),
  ('netrify-19', 0),
  ('netrify-20', 0),
  ('netrify-21', 0),
  ('netrify-22', 0),
  ('col-1', 0),
  ('col-2', 0),
  ('col-3', 0),
  ('col-4', 0),
  ('col-5', 0)
ON CONFLICT (product_id) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON public.inventory(product_id);
NOTIFY pgrst, 'reload schema';

-- Reserve or release multiple product quantities atomically for a single order.
CREATE OR REPLACE FUNCTION public.reserve_inventory(p_items JSONB)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE item JSONB; changed INTEGER;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    UPDATE public.inventory
      SET quantity = quantity - (item->>'quantity')::INTEGER, updated_at = now()
      WHERE product_id = item->>'product_id'
        AND quantity >= (item->>'quantity')::INTEGER;
    GET DIAGNOSTICS changed = ROW_COUNT;
    IF changed <> 1 THEN RAISE EXCEPTION 'Insufficient inventory for product %', item->>'product_id'; END IF;
  END LOOP;
END; $$;

CREATE OR REPLACE FUNCTION public.release_inventory(p_items JSONB)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE item JSONB;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    UPDATE public.inventory SET quantity = quantity + (item->>'quantity')::INTEGER, updated_at = now()
      WHERE product_id = item->>'product_id';
  END LOOP;
END; $$;

REVOKE ALL ON FUNCTION public.reserve_inventory(JSONB) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.release_inventory(JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_inventory(JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_inventory(JSONB) TO service_role;
