
-- Create a storage bucket for facility logos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('facility-logos', 'facility-logos', true);

-- Create RLS policies for the facility-logos bucket
CREATE POLICY "Allow public read access to facility logos" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'facility-logos');

CREATE POLICY "Allow insert facility logos" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'facility-logos');

CREATE POLICY "Allow update facility logos" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'facility-logos');

CREATE POLICY "Allow delete facility logos" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'facility-logos');
