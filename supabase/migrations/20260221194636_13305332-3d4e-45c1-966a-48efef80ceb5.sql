
-- Create security definer function to check user role without triggering RLS
CREATE OR REPLACE FUNCTION public.get_auth_user_role(_auth_id uuid)
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE auth_id = _auth_id LIMIT 1;
$$;

-- Drop the recursive policy
DROP POLICY IF EXISTS "Admins can read all users" ON public.users;

-- Recreate using the security definer function
CREATE POLICY "Admins can read all users"
ON public.users
FOR SELECT
USING (public.get_auth_user_role(auth.uid()) = 'admin');

-- Also fix pharmacies update policy which has the same issue
DROP POLICY IF EXISTS "Pharmacies updatable by owner" ON public.pharmacies;
CREATE POLICY "Pharmacies updatable by owner"
ON public.pharmacies
FOR UPDATE
USING (
  user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
  OR public.get_auth_user_role(auth.uid()) = 'admin'
);

-- Fix vendors update policy too
DROP POLICY IF EXISTS "Vendors updatable" ON public.vendors;
CREATE POLICY "Vendors updatable"
ON public.vendors
FOR UPDATE
USING (
  user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
  OR public.get_auth_user_role(auth.uid()) = 'admin'
);
