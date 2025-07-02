-- Update existing facility QR codes with incorrect domain
UPDATE public.facility_qr_codes 
SET facility_url = REPLACE(facility_url, 'https://chemlabel-gpt.lovable.app/facility/', 'https://chemlabel-gpt.com/facility/')
WHERE facility_url LIKE 'https://chemlabel-gpt.lovable.app/facility/%';

-- Ensure the trigger function uses the correct domain (update if needed)
CREATE OR REPLACE FUNCTION public.create_facility_qr_code()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.facility_qr_codes (facility_id, qr_code_url, facility_url)
  VALUES (
    NEW.id,
    'qr-code-placeholder',
    CONCAT('https://chemlabel-gpt.com/facility/', NEW.slug)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;