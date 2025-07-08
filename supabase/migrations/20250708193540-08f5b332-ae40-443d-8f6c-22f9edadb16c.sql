-- Create demo facility for QR code landing experience
INSERT INTO public.facilities (
  slug,
  facility_name,
  contact_name,
  email,
  address,
  subscription_status,
  feature_access_level,
  trial_start_date,
  trial_end_date
) VALUES (
  'demo',
  'Demo Manufacturing Company',
  'Sarah Johnson',
  'demo@qrsafetyapp.com',
  '123 Industrial Blvd, Manufacturing City, MC 12345',
  'trial',
  'trial',
  now(),
  now() + interval '30 days'
)
ON CONFLICT (slug) DO UPDATE SET
  facility_name = EXCLUDED.facility_name,
  contact_name = EXCLUDED.contact_name,
  email = EXCLUDED.email,
  address = EXCLUDED.address;