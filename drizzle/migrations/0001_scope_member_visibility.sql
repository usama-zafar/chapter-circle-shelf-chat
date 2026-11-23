CREATE OR REPLACE FUNCTION public.is_member(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _user_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id)
$$;

REVOKE EXECUTE ON FUNCTION public.is_member(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_member(uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "Members can view profiles" ON public.profiles;
CREATE POLICY "Members can view profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.is_member(auth.uid()));

DROP POLICY IF EXISTS "Members can view shelves" ON public.shelf_books;
CREATE POLICY "Members can view shelves" ON public.shelf_books
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_member(auth.uid()));