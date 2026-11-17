-- Admin governance: audit trail and category-safe SKU propagation.
CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_user_id TEXT NOT NULL,
  actor_email TEXT NOT NULL DEFAULT '',
  actor_name TEXT NOT NULL DEFAULT '',
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  entity_name TEXT NOT NULL DEFAULT '',
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_admin_activity_created ON public.admin_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_activity_actor ON public.admin_activity_logs(actor_user_id, created_at DESC);
INSERT INTO public.catalog_categories(name,slug,description,is_active,sort_order)
VALUES ('Reserve','reserve','Protected category for products whose original category was removed',true,999)
ON CONFLICT (slug) DO NOTHING;
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;
-- Access only through server-side service role routes.

CREATE OR REPLACE FUNCTION public.admin_update_category(
  p_category_id UUID, p_name TEXT, p_slug TEXT, p_description TEXT DEFAULT ''
) RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE rec RECORD; new_product_sku TEXT; suffix TEXT; new_variants JSONB; affected INTEGER := 0;
BEGIN
  IF trim(coalesce(p_name,'')) = '' OR trim(coalesce(p_slug,'')) = '' THEN
    RAISE EXCEPTION 'Category name and slug are required';
  END IF;
  UPDATE public.catalog_categories
     SET name=trim(p_name), slug=lower(trim(p_slug)),
         description=coalesce(p_description,''), updated_at=now()
   WHERE id=p_category_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Category not found'; END IF;

  FOR rec IN SELECT id, sku, slug, variants FROM public.catalog_products WHERE category_id=p_category_id FOR UPDATE LOOP
    new_product_sku := 'NITRR-' ||
      left(regexp_replace(upper(trim(p_slug)), '[^A-Z0-9]+', '-', 'g'), 10) ||
      '-' || left(regexp_replace(upper(rec.slug), '[^A-Z0-9]+', '-', 'g'), 18);
    new_variants := rec.variants;
    IF jsonb_typeof(rec.variants)='array' THEN
      SELECT coalesce(jsonb_agg(
        jsonb_set(v.value,'{sku}',
          to_jsonb(new_product_sku || '-' ||
            trim(both '-' from regexp_replace(
              upper(CASE
                WHEN coalesce(v.value->>'sku','') LIKE rec.sku || '-%'
                THEN substring(v.value->>'sku' from length(rec.sku)+2)
                ELSE coalesce(nullif(v.value->>'sku',''),concat_ws('-',v.value->>'size',v.value->>'color'))
              END), '[^A-Z0-9-]+','-','g'
            ))), true
        ) ORDER BY v.ordinality
      ),'[]'::jsonb) INTO new_variants
      FROM jsonb_array_elements(rec.variants) WITH ORDINALITY v(value,ordinality);
    END IF;
    UPDATE public.catalog_products SET sku=new_product_sku, variants=new_variants, updated_at=now() WHERE id=rec.id;
    affected := affected + 1;
  END LOOP;
  RETURN affected;
END $$;

CREATE OR REPLACE FUNCTION public.admin_move_category_to_reserve(p_category_id UUID)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE reserve_id UUID; rec RECORD; new_product_sku TEXT; new_variants JSONB; affected INTEGER := 0;
BEGIN
  SELECT id INTO reserve_id FROM public.catalog_categories
   WHERE lower(slug)='reserve' OR lower(name)='reserve' LIMIT 1;
  IF reserve_id IS NULL THEN
    INSERT INTO public.catalog_categories(name,slug,description,is_active,sort_order)
    VALUES ('Reserve','reserve','Products moved from deleted categories',true,999)
    RETURNING id INTO reserve_id;
  END IF;
  IF reserve_id=p_category_id THEN RAISE EXCEPTION 'Reserve category cannot be deleted or moved into itself'; END IF;

  FOR rec IN SELECT id, sku, slug, variants FROM public.catalog_products WHERE category_id=p_category_id FOR UPDATE LOOP
    new_product_sku := 'NITRR-RESERVE-' || left(regexp_replace(upper(rec.slug),'[^A-Z0-9]+','-','g'),18);
    new_variants := rec.variants;
    IF jsonb_typeof(rec.variants)='array' THEN
      SELECT coalesce(jsonb_agg(
        jsonb_set(v.value,'{sku}',
          to_jsonb(new_product_sku || '-' ||
            trim(both '-' from regexp_replace(
              upper(CASE
                WHEN coalesce(v.value->>'sku','') LIKE rec.sku || '-%'
                THEN substring(v.value->>'sku' from length(rec.sku)+2)
                ELSE coalesce(nullif(v.value->>'sku',''),concat_ws('-',v.value->>'size',v.value->>'color'))
              END), '[^A-Z0-9-]+','-','g'
            ))), true
        ) ORDER BY v.ordinality
      ),'[]'::jsonb) INTO new_variants
      FROM jsonb_array_elements(rec.variants) WITH ORDINALITY v(value,ordinality);
    END IF;
    UPDATE public.catalog_products SET category_id=reserve_id, sku=new_product_sku, variants=new_variants, updated_at=now() WHERE id=rec.id;
    affected := affected + 1;
  END LOOP;

  DELETE FROM public.catalog_categories WHERE id=p_category_id;
  RETURN affected;
END $$;

REVOKE ALL ON FUNCTION public.admin_update_category(UUID,TEXT,TEXT,TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_move_category_to_reserve(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_category(UUID,TEXT,TEXT,TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_move_category_to_reserve(UUID) TO service_role;
