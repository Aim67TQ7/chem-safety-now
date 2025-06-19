
-- Create storage bucket for incident images
INSERT INTO storage.buckets (id, name, public)
VALUES ('incident-images', 'incident-images', true);

-- Create RLS policies for the incident-images bucket
CREATE POLICY "Anyone can view incident images" ON storage.objects
FOR SELECT USING (bucket_id = 'incident-images');

CREATE POLICY "Users can upload incident images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'incident-images');

CREATE POLICY "Users can update their incident images" ON storage.objects
FOR UPDATE USING (bucket_id = 'incident-images');

CREATE POLICY "Users can delete their incident images" ON storage.objects
FOR DELETE USING (bucket_id = 'incident-images');
