
-- Create animal-photos storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('animal-photos', 'animal-photos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS: authenticated users can upload to their shelter folder
CREATE POLICY "Shelter members upload photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'animal-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT shelter_id::text FROM public.shelter_users WHERE user_id = auth.uid()
  )
);

-- RLS: anyone can view (public bucket)
CREATE POLICY "Public photo access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'animal-photos');

-- RLS: shelter members can delete their photos
CREATE POLICY "Shelter members delete photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'animal-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT shelter_id::text FROM public.shelter_users WHERE user_id = auth.uid()
  )
);
