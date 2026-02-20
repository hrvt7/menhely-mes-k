
-- Create storage bucket for animal documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('animal-documents', 'animal-documents', false);

-- RLS: authenticated users can upload to their shelter's folder
CREATE POLICY "Shelter members can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'animal-documents'
  AND (storage.foldername(name))[1] IN (
    SELECT shelter_id::text FROM public.shelter_users WHERE user_id = auth.uid()
  )
);

-- RLS: authenticated users can view their shelter's documents
CREATE POLICY "Shelter members can view documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'animal-documents'
  AND (storage.foldername(name))[1] IN (
    SELECT shelter_id::text FROM public.shelter_users WHERE user_id = auth.uid()
  )
);

-- RLS: authenticated users can delete their shelter's documents
CREATE POLICY "Shelter members can delete documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'animal-documents'
  AND (storage.foldername(name))[1] IN (
    SELECT shelter_id::text FROM public.shelter_users WHERE user_id = auth.uid()
  )
);
