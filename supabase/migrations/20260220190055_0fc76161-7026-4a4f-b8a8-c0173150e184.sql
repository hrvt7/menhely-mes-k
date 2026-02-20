
-- Drop the restrictive ALL policy that blocks new shelter inserts
DROP POLICY IF EXISTS "User sees own shelter" ON public.shelters;

-- Drop existing insert policy
DROP POLICY IF EXISTS "shelters_insert_authenticated" ON public.shelters;

-- Recreate insert policy as PERMISSIVE so authenticated users can create shelters
CREATE POLICY "shelters_insert_authenticated"
ON public.shelters
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Recreate select/update/delete as PERMISSIVE
DROP POLICY IF EXISTS "shelters_select_authenticated" ON public.shelters;
CREATE POLICY "shelters_select_own"
ON public.shelters
FOR SELECT
TO authenticated
USING (id IN (SELECT shelter_id FROM shelter_users WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "shelters_update_own" ON public.shelters;
CREATE POLICY "shelters_update_own"
ON public.shelters
FOR UPDATE
TO authenticated
USING (id IN (SELECT shelter_id FROM shelter_users WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "shelters_delete_own" ON public.shelters;
CREATE POLICY "shelters_delete_own"
ON public.shelters
FOR DELETE
TO authenticated
USING (id IN (SELECT shelter_id FROM shelter_users WHERE user_id = auth.uid()));

-- Also fix shelter_users: make the ALL policy permissive and add permissive insert
DROP POLICY IF EXISTS "User sees own shelter memberships" ON public.shelter_users;
CREATE POLICY "shelter_users_select_own"
ON public.shelter_users
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "shelter_users_insert_own" ON public.shelter_users;
CREATE POLICY "shelter_users_insert_own"
ON public.shelter_users
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());
