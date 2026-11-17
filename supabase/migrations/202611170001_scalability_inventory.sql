-- Scalability and inventory safety improvements.
-- Apply this migration AFTER all existing migrations in Supabase SQL Editor.

-- Query indexes used by customer order history and admin order lists.
CREATE INDEX IF NOT EXISTS idx_orders_user_created_at
  ON public.orders (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_created_at
  ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_updated_at
  ON public.inventory (updated_at DESC);

-- Replace reservation function with strict validation, duplicate consolidation,
-- deterministic product ordering (reduces deadlock risk), and all-or-nothing updates.
CREATE OR REPLACE FUNCTION public.reserve_inventory(p_items JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item RECORD;
  changed INTEGER;
BEGIN
  IF p_items IS NULL
     OR jsonb_typeof(p_items) <> 'array'
     OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Inventory reservation requires a non-empty items array';
  END IF;

  -- Validate every entry before changing stock.
  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(p_items) AS x(value)
    WHERE jsonb_typeof(x.value) <> 'object'
       OR COALESCE(x.value->>'product_id', '') = ''
       OR COALESCE(x.value->>'quantity', '') !~ '^[0-9]+$'
       OR (x.value->>'quantity')::BIGINT <= 0
       OR (x.value->>'quantity')::BIGINT > 100
  ) THEN
    RAISE EXCEPTION 'Invalid product or quantity in inventory reservation';
  END IF;

  -- Consolidate duplicate product IDs and update in stable sorted order.
  FOR item IN
    SELECT value->>'product_id' AS product_id,
           SUM((value->>'quantity')::INTEGER)::INTEGER AS quantity
    FROM jsonb_array_elements(p_items)
    GROUP BY value->>'product_id'
    ORDER BY value->>'product_id'
  LOOP
    UPDATE public.inventory
       SET quantity = quantity - item.quantity,
           updated_at = now()
     WHERE product_id = item.product_id
       AND quantity >= item.quantity;

    GET DIAGNOSTICS changed = ROW_COUNT;
    IF changed <> 1 THEN
      RAISE EXCEPTION 'Insufficient inventory for product %', item.product_id
        USING ERRCODE = 'P0001';
    END IF;
  END LOOP;
END;
$$;

-- Only the server-side service role may reserve or release stock.
REVOKE ALL ON FUNCTION public.reserve_inventory(JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_inventory(JSONB) TO service_role;

-- Keep the release function server-only as well.
REVOKE ALL ON FUNCTION public.release_inventory(JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.release_inventory(JSONB) TO service_role;

NOTIFY pgrst, 'reload schema';
