-- Add image_url column to campus_locations table
ALTER TABLE public.campus_locations ADD COLUMN image_url text;

-- Allow authenticated users to add campus locations (pending admin approval could be added later)
CREATE POLICY "Authenticated users can add campus locations"
ON public.campus_locations
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);