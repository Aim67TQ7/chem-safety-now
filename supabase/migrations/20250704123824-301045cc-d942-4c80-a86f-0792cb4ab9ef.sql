-- First, update the check constraint to allow 'pro' as a valid required_plan value
ALTER TABLE feature_permissions 
DROP CONSTRAINT IF EXISTS feature_permissions_required_plan_check;

ALTER TABLE feature_permissions 
ADD CONSTRAINT feature_permissions_required_plan_check 
CHECK (required_plan IN ('trial', 'basic', 'pro', 'premium'));

-- Update subscription plans with new pricing structure
UPDATE subscription_plans 
SET 
  monthly_price = 0.00,
  annual_price = 50.00,
  features = '["sds_search"]'::jsonb
WHERE name = 'Basic';

-- Insert Pro plan if it doesn't exist, update if it does
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM subscription_plans WHERE name = 'Pro') THEN
    INSERT INTO subscription_plans (name, monthly_price, annual_price, features) 
    VALUES ('Pro', 20.00, 200.00, '["sds_search", "ai_assistant", "basic_qr_codes", "label_printing", "custom_branding"]'::jsonb);
  ELSE
    UPDATE subscription_plans 
    SET 
      monthly_price = 20.00,
      annual_price = 200.00,
      features = '["sds_search", "ai_assistant", "basic_qr_codes", "label_printing", "custom_branding"]'::jsonb
    WHERE name = 'Pro';
  END IF;
END $$;

-- Update Premium plan with new pricing
UPDATE subscription_plans 
SET 
  monthly_price = 50.00,
  annual_price = 500.00,
  features = '["sds_search", "ai_assistant", "basic_qr_codes", "label_printing", "custom_branding", "incident_reporting", "incidents", "audit_trails"]'::jsonb
WHERE name = 'Premium';

-- Update feature permissions for new tier structure
INSERT INTO feature_permissions (feature_name, description, required_plan) 
VALUES 
  ('sds_search', 'Access to SDS document search', 'basic'),
  ('ai_assistant', 'Access to Sarah AI assistant', 'pro'),
  ('basic_qr_codes', 'Generate basic facility QR codes', 'pro'),
  ('label_printing', 'Generate and print GHS labels', 'pro'),
  ('custom_branding', 'Custom branded facility site', 'pro'),
  ('incident_reporting', 'Access to incident reporting system', 'premium'),
  ('incidents', 'Access to incidents management', 'premium'),
  ('audit_trails', 'Detailed audit trail functionality', 'premium')
ON CONFLICT (feature_name) DO UPDATE SET 
  required_plan = EXCLUDED.required_plan,
  description = EXCLUDED.description;

-- Add company_identifier field to facilities table for shared basic facility support
ALTER TABLE facilities 
ADD COLUMN IF NOT EXISTS company_identifier TEXT;

-- Create index for company_identifier lookups
CREATE INDEX IF NOT EXISTS idx_facilities_company_identifier 
ON facilities (company_identifier);

-- Create shared basic facility
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM facilities WHERE slug = 'basic') THEN
    INSERT INTO facilities (
      slug, 
      facility_name, 
      subscription_status, 
      feature_access_level,
      trial_start_date,
      trial_end_date,
      email,
      contact_name,
      address
    ) VALUES (
      'basic',
      'Shared Basic Access',
      'basic',
      'basic',
      now(),
      now() + interval '100 years', -- Essentially permanent
      'support@chemlabel-gpt.com',
      'ChemLabel GPT Support',
      'Shared Basic Facility'
    );
  ELSE
    UPDATE facilities 
    SET 
      subscription_status = 'basic',
      feature_access_level = 'basic',
      facility_name = 'Shared Basic Access'
    WHERE slug = 'basic';
  END IF;
END $$;