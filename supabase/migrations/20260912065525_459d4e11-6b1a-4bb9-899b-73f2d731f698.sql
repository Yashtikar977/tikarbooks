-- Harden has_role: it is SECURITY DEFINER and executable by signed-in users
-- (required by RLS policies), but previously any signed-in user could probe
-- ANY user's roles by passing an arbitrary _user_id. Now it only answers for
-- the caller's own user id; every policy already calls it with auth.uid().
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _user_id = auth.uid()
     AND EXISTS (
       SELECT 1 FROM public.user_roles
       WHERE user_id = _user_id AND role = _role
     );
$$;

-- Keep exposure minimal: no PUBLIC/anon execute; authenticated needs it for RLS policies.
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;