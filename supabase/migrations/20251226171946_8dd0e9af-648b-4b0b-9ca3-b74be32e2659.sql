-- Add RLS policies for storage bucket
-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'app-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to update their own files
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'app-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'app-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access for all images in app-images bucket
-- (images for clubs, shops, locations, lost-found are meant to be publicly viewable)
CREATE POLICY "Public read access for app images"
ON storage.objects FOR SELECT
USING (bucket_id = 'app-images');