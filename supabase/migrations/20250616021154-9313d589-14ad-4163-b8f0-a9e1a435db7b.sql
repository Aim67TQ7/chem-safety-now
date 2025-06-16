
-- Create facilities table to store company information
CREATE TABLE IF NOT EXISTS public.facilities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  facility_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  address TEXT NOT NULL,
  logo_url TEXT,
  subscription_status TEXT NOT NULL DEFAULT 'active',
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create QR codes table for facilities
CREATE TABLE IF NOT EXISTS public.facility_qr_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  qr_code_url TEXT NOT NULL,
  facility_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create trigger to auto-generate QR code when facility is created
CREATE OR REPLACE FUNCTION public.create_facility_qr_code()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.facility_qr_codes (facility_id, qr_code_url, facility_url)
  VALUES (
    NEW.id,
    'qr-code-placeholder',
    CONCAT('https://chemlabel-gpt.lovable.app/facility/', NEW.slug)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_facility_qr_code
  AFTER INSERT ON public.facilities
  FOR EACH ROW
  EXECUTE FUNCTION public.create_facility_qr_code();

-- Add RLS policies for public access (no authentication needed)
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facility_qr_codes ENABLE ROW LEVEL SECURITY;

-- Allow public read access to facilities
CREATE POLICY "Allow public read access to facilities" 
  ON public.facilities 
  FOR SELECT 
  USING (true);

-- Allow public read access to QR codes
CREATE POLICY "Allow public read access to facility QR codes" 
  ON public.facility_qr_codes 
  FOR SELECT 
  USING (true);

-- Allow inserting new facilities (for signup)
CREATE POLICY "Allow inserting new facilities" 
  ON public.facilities 
  FOR INSERT 
  WITH CHECK (true);
