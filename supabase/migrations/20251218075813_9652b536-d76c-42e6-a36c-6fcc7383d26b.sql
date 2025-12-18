-- Drop the existing public view that exposes contact_info
DROP VIEW IF EXISTS public.public_lost_found_items;

-- Recreate the view WITHOUT contact_info for public browsing
-- Contact info should only be visible to item owner and admins via the base table
CREATE VIEW public.public_lost_found_items
WITH (security_invoker = false)
AS
SELECT 
  id,
  type,
  title,
  description,
  location,
  image_url,
  status,
  created_at,
  updated_at,
  user_id
FROM public.lost_found_items
WHERE status = 'active';

-- Grant select to authenticated users for public browsing
GRANT SELECT ON public.public_lost_found_items TO anon, authenticated;