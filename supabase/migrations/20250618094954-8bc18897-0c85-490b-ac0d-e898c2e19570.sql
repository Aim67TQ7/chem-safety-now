
-- Update facilities table to track trial and subscription status
ALTER TABLE facilities 
ADD COLUMN trial_start_date TIMESTAMPTZ DEFAULT now(),
ADD COLUMN trial_end_date TIMESTAMPTZ DEFAULT (now() + interval '7 days'),
ADD COLUMN subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'basic', 'premium', 'expired')),
ADD COLUMN feature_access_level TEXT DEFAULT 'trial' CHECK (feature_access_level IN ('trial', 'basic', 'premium', 'expired'));

-- Create subscription plans table
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  monthly_price DECIMAL(10,2),
  annual_price DECIMAL(10,2),
  stripe_monthly_price_id TEXT,
  stripe_annual_price_id TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert the three subscription plans
INSERT INTO subscription_plans (name, monthly_price, annual_price, features) VALUES
('Basic', 50.00, 500.00, '["sds_search", "ai_assistant", "basic_qr_codes"]'::jsonb),
('Premium', 500.00, 5000.00, '["sds_search", "ai_assistant", "label_printing", "qr_codes", "dashboards", "compliance_tracking", "audit_trails"]'::jsonb);

-- Create subscription_payments table for tracking Stripe payments
CREATE TABLE subscription_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT,
  stripe_subscription_id TEXT,
  plan_id UUID REFERENCES subscription_plans(id),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'usd',
  billing_period TEXT CHECK (billing_period IN ('monthly', 'annual')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'succeeded', 'failed', 'canceled')),
  billing_period_start TIMESTAMPTZ,
  billing_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create feature_permissions table for granular access control
CREATE TABLE feature_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_name TEXT NOT NULL UNIQUE,
  description TEXT,
  required_plan TEXT CHECK (required_plan IN ('trial', 'basic', 'premium')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert feature permissions
INSERT INTO feature_permissions (feature_name, description, required_plan) VALUES
('sds_search', 'Access to SDS document search', 'basic'),
('ai_assistant', 'Access to Sarah AI assistant', 'basic'),
('basic_qr_codes', 'Generate basic facility QR codes', 'basic'),
('label_printing', 'Generate and print GHS labels', 'premium'),
('advanced_qr_codes', 'Advanced QR code features', 'premium'),
('dashboards', 'Access to analytics dashboards', 'premium'),
('compliance_tracking', 'Compliance monitoring and tracking', 'premium'),
('audit_trails', 'Detailed audit trail functionality', 'premium');

-- Add RLS policies for new tables
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_permissions ENABLE ROW LEVEL SECURITY;

-- Allow public read access to subscription plans and feature permissions
CREATE POLICY "subscription_plans_public_read" ON subscription_plans FOR SELECT TO PUBLIC USING (true);
CREATE POLICY "feature_permissions_public_read" ON feature_permissions FOR SELECT TO PUBLIC USING (true);

-- Allow facility owners to view their own payment records
CREATE POLICY "facility_payments_own_access" ON subscription_payments 
FOR SELECT USING (
  facility_id IN (
    SELECT id FROM facilities WHERE user_id = auth.uid()
  )
);

-- Allow edge functions to manage payments
CREATE POLICY "payments_edge_function_access" ON subscription_payments 
FOR ALL USING (true);

-- Update the admin view to include new subscription fields
DROP VIEW IF EXISTS admin_facility_overview;
CREATE OR REPLACE VIEW admin_facility_overview AS
SELECT 
    f.id,
    f.slug,
    f.facility_name,
    f.contact_name,
    f.email,
    f.address,
    f.logo_url,
    f.created_at,
    f.updated_at,
    f.trial_start_date,
    f.trial_end_date,
    f.subscription_status,
    f.feature_access_level,
    sp.name as current_plan,
    sp.monthly_price,
    sp.annual_price,
    fqr.facility_url,
    fqr.qr_code_url,
    CASE 
      WHEN f.trial_end_date > now() AND f.subscription_status = 'trial' THEN 
        EXTRACT(days FROM (f.trial_end_date - now()))::integer
      ELSE 0 
    END as trial_days_remaining
FROM facilities f
LEFT JOIN subscription_payments scp ON f.id = scp.facility_id AND scp.payment_status = 'succeeded'
LEFT JOIN subscription_plans sp ON scp.plan_id = sp.id
LEFT JOIN facility_qr_codes fqr ON f.id = fqr.facility_id
ORDER BY f.created_at DESC;

-- Function to check if a facility has access to a specific feature
CREATE OR REPLACE FUNCTION check_feature_access(
  p_facility_id UUID,
  p_feature_name TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  facility_status TEXT;
  facility_access_level TEXT;
  required_plan TEXT;
  trial_expired BOOLEAN;
BEGIN
  -- Get facility status and access level
  SELECT 
    subscription_status,
    feature_access_level,
    (trial_end_date < now()) as is_trial_expired
  INTO facility_status, facility_access_level, trial_expired
  FROM facilities 
  WHERE id = p_facility_id;
  
  -- If facility not found, deny access
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- If trial has expired and no active subscription, deny access
  IF trial_expired AND facility_status = 'trial' THEN
    RETURN FALSE;
  END IF;
  
  -- Get required plan for the feature
  SELECT required_plan INTO required_plan
  FROM feature_permissions 
  WHERE feature_name = p_feature_name;
  
  -- If feature not found, deny access
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Check access based on current access level
  CASE 
    WHEN facility_access_level = 'trial' AND NOT trial_expired THEN
      RETURN TRUE; -- Trial users have access to all features during trial
    WHEN facility_access_level = 'basic' THEN
      RETURN required_plan IN ('basic');
    WHEN facility_access_level = 'premium' THEN
      RETURN required_plan IN ('basic', 'premium');
    ELSE
      RETURN FALSE;
  END CASE;
END;
$$;

-- Function to update facility subscription status
CREATE OR REPLACE FUNCTION update_facility_subscription(
  p_facility_id UUID,
  p_plan_name TEXT,
  p_stripe_subscription_id TEXT DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_status TEXT;
  new_access_level TEXT;
BEGIN
  -- Determine new status and access level based on plan
  CASE p_plan_name
    WHEN 'Basic' THEN
      new_status := 'basic';
      new_access_level := 'basic';
    WHEN 'Premium' THEN
      new_status := 'premium';
      new_access_level := 'premium';
    ELSE
      RETURN FALSE;
  END CASE;
  
  -- Update facility
  UPDATE facilities 
  SET 
    subscription_status = new_status,
    feature_access_level = new_access_level,
    updated_at = now()
  WHERE id = p_facility_id;
  
  RETURN FOUND;
END;
$$;
