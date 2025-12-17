-- Drop the existing overly permissive SELECT policy
DROP POLICY IF EXISTS "Anyone can view club members" ON public.club_members;

-- Create more restrictive policies
-- Admins can view all club members
CREATE POLICY "Admins can view all club members"
ON public.club_members
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Club presidents can view members of their clubs
CREATE POLICY "Club presidents can view their club members"
ON public.club_members
FOR SELECT
USING (is_club_president(auth.uid(), club_id));

-- Users can view their own memberships
CREATE POLICY "Users can view own membership"
ON public.club_members
FOR SELECT
USING (user_id = auth.uid());

-- Authenticated users can view basic member info (name, position, role) but this is handled at row level
-- For public club directory, create a view that excludes user_id
CREATE OR REPLACE VIEW public.public_club_members AS
SELECT 
  id,
  club_id,
  name,
  position,
  role,
  joined_at
FROM public.club_members;