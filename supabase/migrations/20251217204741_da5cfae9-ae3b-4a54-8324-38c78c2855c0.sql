-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Anyone authenticated can view lost_found" ON public.lost_found_items;

-- Users can view their own items with full contact info
CREATE POLICY "Users can view own lost_found items"
ON public.lost_found_items
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all items
CREATE POLICY "Admins can view all lost_found items"
ON public.lost_found_items
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create a public view for browsing that hides contact info
CREATE VIEW public.public_lost_found_items 
WITH (security_invoker = true)
AS
SELECT 
  id,
  user_id,
  type,
  title,
  description,
  image_url,
  location,
  status,
  created_at,
  updated_at,
  -- Only show contact info to the item owner
  CASE 
    WHEN user_id = auth.uid() THEN contact_info
    ELSE '***Contact the owner through the app***'
  END as contact_info
FROM public.lost_found_items;

-- Also create a basic browsing view without any contact info
CREATE VIEW public.browse_lost_found_items
WITH (security_invoker = true)
AS
SELECT 
  id,
  type,
  title,
  description,
  image_url,
  location,
  status,
  created_at
FROM public.lost_found_items
WHERE status = 'active';