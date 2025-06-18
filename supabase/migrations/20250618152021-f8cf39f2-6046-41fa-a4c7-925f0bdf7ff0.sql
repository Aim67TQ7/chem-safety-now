
-- Update the create_facility_qr_code function to use the correct domain
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
