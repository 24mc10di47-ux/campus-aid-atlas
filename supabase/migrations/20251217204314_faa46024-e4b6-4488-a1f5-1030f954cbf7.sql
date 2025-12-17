-- Drop the view and recreate with proper security
DROP VIEW IF EXISTS public.public_club_members;

-- Recreate the view with SECURITY INVOKER (default, but explicit is better)
CREATE VIEW public.public_club_members 
WITH (security_invoker = true)
AS
SELECT 
  id,
  club_id,
  name,
  position,
  role,
  joined_at
FROM public.club_members;