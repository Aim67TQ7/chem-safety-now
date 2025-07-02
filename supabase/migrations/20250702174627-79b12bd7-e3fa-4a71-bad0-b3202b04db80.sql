-- Create storage bucket for OSHA pictograms
INSERT INTO storage.buckets (id, name, public) 
VALUES ('pictograms', 'pictograms', true);

-- Create policies for pictogram storage bucket
CREATE POLICY "Pictograms are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'pictograms');

CREATE POLICY "Admin can upload pictograms" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'pictograms');

CREATE POLICY "Admin can update pictograms" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'pictograms');

CREATE POLICY "Admin can delete pictograms" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'pictograms');