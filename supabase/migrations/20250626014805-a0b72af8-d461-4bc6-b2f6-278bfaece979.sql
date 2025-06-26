
-- Add columns to track subscription start date and billing period
ALTER TABLE facilities 
ADD COLUMN subscription_start_date TIMESTAMPTZ,
ADD COLUMN billing_period TEXT CHECK (billing_period IN ('monthly', 'annual'));

-- Update the admin view to include the new subscription tracking fields
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
    f.subscription_start_date,
    f.billing_period,
    f.stripe_customer_id,
    f.stripe_subscription_id,
    sp.name as current_plan,
    sp.monthly_price,
    sp.annual_price,
    fqr.facility_url,
    fqr.qr_code_url,
    CASE 
      WHEN f.trial_end_date > now() AND f.subscription_status = 'trial' THEN 
        EXTRACT(days FROM (f.trial_end_date - now()))::integer
      ELSE 0 
    END as trial_days_remaining,
    CASE 
      WHEN f.subscription_status IN ('basic', 'premium') AND f.subscription_start_date IS NOT NULL AND f.billing_period IS NOT NULL THEN
        CASE 
          WHEN f.billing_period = 'monthly' THEN
            EXTRACT(days FROM ((f.subscription_start_date + interval '1 month') - now()))::integer
          WHEN f.billing_period = 'annual' THEN
            EXTRACT(days FROM ((f.subscription_start_date + interval '1 year') - now()))::integer
          ELSE 0
        END
      ELSE NULL
    END as subscription_days_remaining
FROM facilities f
LEFT JOIN subscription_payments scp ON f.id = scp.facility_id AND scp.payment_status = 'succeeded'
LEFT JOIN subscription_plans sp ON scp.plan_id = sp.id
LEFT JOIN facility_qr_codes fqr ON f.id = fqr.facility_id
ORDER BY f.created_at DESC;

-- Create audit trail table for OSHA compliance tracking
CREATE TABLE facility_audit_trail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
  user_id UUID,
  action_type TEXT NOT NULL,
  action_description TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on audit trail
ALTER TABLE facility_audit_trail ENABLE ROW LEVEL SECURITY;

-- Allow facilities to view their own audit trail
CREATE POLICY "facility_audit_trail_read" ON facility_audit_trail
FOR SELECT 
USING (
  facility_id IN (
    SELECT id FROM facilities WHERE user_id = auth.uid()
  )
);

-- Allow edge functions to insert audit records
CREATE POLICY "audit_trail_edge_function_access" ON facility_audit_trail 
FOR ALL USING (true);

-- Update the admin subscription functions to track subscription start dates
CREATE OR REPLACE FUNCTION grant_free_subscription(
  p_facility_id UUID,
  p_plan_type TEXT,
  p_duration_months INTEGER,
  p_admin_email TEXT,
  p_notes TEXT DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_facility RECORD;
  new_end_date TIMESTAMPTZ;
  new_status TEXT;
  new_access_level TEXT;
  billing_period_type TEXT;
BEGIN
  -- Get current facility status
  SELECT subscription_status, feature_access_level INTO current_facility
  FROM facilities 
  WHERE id = p_facility_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Set new status and access level
  CASE p_plan_type
    WHEN 'basic' THEN
      new_status := 'basic';
      new_access_level := 'basic';
    WHEN 'premium' THEN
      new_status := 'premium';
      new_access_level := 'premium';
    ELSE
      RETURN FALSE;
  END CASE;
  
  -- Determine billing period based on duration
  IF p_duration_months >= 12 THEN
    billing_period_type := 'annual';
  ELSE
    billing_period_type := 'monthly';
  END IF;
  
  -- Calculate end date
  new_end_date := now() + (p_duration_months || ' months')::interval;
  
  -- Update facility with subscription tracking
  UPDATE facilities 
  SET 
    subscription_status = new_status,
    feature_access_level = new_access_level,
    trial_end_date = new_end_date,
    subscription_start_date = now(),
    billing_period = billing_period_type,
    updated_at = now()
  WHERE id = p_facility_id;
  
  -- Log admin action
  INSERT INTO admin_subscription_actions (
    facility_id,
    admin_user_email,
    action_type,
    previous_status,
    new_status,
    previous_access_level,
    new_access_level,
    duration_months,
    notes
  ) VALUES (
    p_facility_id,
    p_admin_email,
    'grant_' || p_plan_type,
    current_facility.subscription_status,
    new_status,
    current_facility.feature_access_level,
    new_access_level,
    p_duration_months,
    p_notes
  );
  
  RETURN TRUE;
END;
$$;

-- Add audit trail feature to feature_permissions
INSERT INTO feature_permissions (feature_name, description, required_plan) 
VALUES ('audit_trail', 'Access to facility audit trail for OSHA compliance', 'premium')
ON CONFLICT (feature_name) DO NOTHING;
