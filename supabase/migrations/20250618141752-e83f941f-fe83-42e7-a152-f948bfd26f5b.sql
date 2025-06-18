
-- Add RLS policies for the facility-logos storage bucket (these should be new)
CREATE POLICY "Allow public uploads to facility logos" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'facility-logos');

CREATE POLICY "Allow public updates to facility logos" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'facility-logos');

CREATE POLICY "Allow public deletes of facility logos" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'facility-logos');

-- Add the missing facilities table policies (skipping the one that already exists)
CREATE POLICY "Allow public updates to facilities" 
ON public.facilities 
FOR UPDATE 
USING (true);
