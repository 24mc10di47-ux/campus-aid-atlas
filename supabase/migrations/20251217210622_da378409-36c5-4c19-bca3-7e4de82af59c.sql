-- Drop the existing view
DROP VIEW IF EXISTS public.browse_lost_found_items;

-- Recreate as a security definer view for public browsing
-- This allows anyone to view active lost/found items without exposing contact_info
CREATE VIEW public.browse_lost_found_items
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
  created_at
FROM public.lost_found_items
WHERE status = 'active';

-- Grant select to public (including anon users)
GRANT SELECT ON public.browse_lost_found_items TO anon, authenticated;