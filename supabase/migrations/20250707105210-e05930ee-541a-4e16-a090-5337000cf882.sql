-- Update all existing facility QR codes to use qrsafetyapp.com domain
UPDATE public.facility_qr_codes 
SET facility_url = REPLACE(facility_url, 'https://chemlabel-gpt.com', 'https://qrsafetyapp.com')
WHERE facility_url LIKE '%chemlabel-gpt.com%';

-- Update the create_facility_qr_code function to use qrsafetyapp.com
CREATE OR REPLACE FUNCTION public.create_facility_qr_code()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.facility_qr_codes (facility_id, qr_code_url, facility_url)
  VALUES (
    NEW.id,
    'qr-code-placeholder',
    CONCAT('https://qrsafetyapp.com/facility/', NEW.slug)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;