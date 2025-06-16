
-- Add missing columns to facilities table to match the signup form
ALTER TABLE public.facilities 
ADD COLUMN IF NOT EXISTS facility_name text,
ADD COLUMN IF NOT EXISTS contact_name text,
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS address text;

-- Add RLS policy for facility_qr_codes table (this was missing and causing the insert to fail)
ALTER TABLE public.facility_qr_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow insert facility QR codes" ON public.facility_qr_codes
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow select facility QR codes" ON public.facility_qr_codes
FOR SELECT 
USING (true);
