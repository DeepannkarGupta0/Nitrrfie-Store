-- Remove the temporary public write policies from the initial prototype.
-- Template writes and all design reads/writes now go through Clerk-authenticated
-- server routes using the Supabase service role.
DROP POLICY IF EXISTS "Anon can manage templates" ON public.templates;
DROP POLICY IF EXISTS "Users manage own designs" ON public.designs;
DROP POLICY IF EXISTS "Authenticated users read all templates" ON public.templates;

-- The storefront may only read active templates using the public anon key.
DROP POLICY IF EXISTS "Public can view active templates" ON public.templates;
CREATE POLICY "Public can view active templates"
  ON public.templates FOR SELECT TO anon, authenticated
  USING (is_active = TRUE);

-- No client-side policies are defined for designs. Access is server-side only,
-- where the Clerk user ID is checked against the row owner.
NOTIFY pgrst, 'reload schema';
