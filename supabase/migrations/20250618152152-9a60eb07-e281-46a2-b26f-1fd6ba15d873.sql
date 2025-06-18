
-- Update all existing facility QR codes to use the correct domain
UPDATE public.facility_qr_codes 
SET facility_url = REPLACE(facility_url, 'https://chemlabel-gpt.lovable.app', 'https://chemlabel-gpt.com')
WHERE facility_url LIKE '%chemlabel-gpt.lovable.app%';
