-- Add the five collection products to existing inventory installations.
INSERT INTO public.inventory (product_id, quantity) VALUES
  ('col-1', 0),
  ('col-2', 0),
  ('col-3', 0),
  ('col-4', 0),
  ('col-5', 0)
ON CONFLICT (product_id) DO NOTHING;
NOTIFY pgrst, 'reload schema';
