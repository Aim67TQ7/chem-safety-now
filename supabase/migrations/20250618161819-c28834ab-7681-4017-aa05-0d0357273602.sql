
-- Add Stripe tracking columns to facilities table
ALTER TABLE facilities 
ADD COLUMN stripe_customer_id TEXT,
ADD COLUMN stripe_subscription_id TEXT;

-- Create admin subscription actions table for audit trail
CREATE TABLE admin_subscription_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
  admin_user_email TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('grant_basic', 'grant_premium', 'extend_trial', 'reset_status', 'manual_sync')),
  previous_status TEXT,
  new_status TEXT,
  previous_access_level TEXT,
  new_access_level TEXT,
  duration_months INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on admin actions table
ALTER TABLE admin_subscription_actions ENABLE ROW LEVEL SECURITY;

-- Allow public read access for admin functions
CREATE POLICY "admin_actions_public_read" ON admin_subscription_actions FOR SELECT TO PUBLIC USING (true);

-- Allow edge functions to manage admin actions
CREATE POLICY "admin_actions_edge_function_access" ON admin_subscription_actions FOR ALL USING (true);

-- Function to grant free subscription access
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
  
  -- Calculate end date
  new_end_date := now() + (p_duration_months || ' months')::interval;
  
  -- Update facility
  UPDATE facilities 
  SET 
    subscription_status = new_status,
    feature_access_level = new_access_level,
    trial_end_date = new_end_date,
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

-- Function to extend trial period
CREATE OR REPLACE FUNCTION extend_trial_period(
  p_facility_id UUID,
  p_days INTEGER,
  p_admin_email TEXT,
  p_notes TEXT DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_facility RECORD;
  new_end_date TIMESTAMPTZ;
BEGIN
  -- Get current facility status
  SELECT subscription_status, feature_access_level, trial_end_date INTO current_facility
  FROM facilities 
  WHERE id = p_facility_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Calculate new end date (extend from current end date or now, whichever is later)
  new_end_date := GREATEST(current_facility.trial_end_date, now()) + (p_days || ' days')::interval;
  
  -- Update facility
  UPDATE facilities 
  SET 
    trial_end_date = new_end_date,
    subscription_status = 'trial',
    feature_access_level = 'trial',
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
    'extend_trial',
    current_facility.subscription_status,
    'trial',
    current_facility.feature_access_level,
    'trial',
    NULL,
    p_notes
  );
  
  RETURN TRUE;
END;
$$;

-- Function to reset facility subscription status
CREATE OR REPLACE FUNCTION reset_facility_subscription(
  p_facility_id UUID,
  p_admin_email TEXT,
  p_notes TEXT DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_facility RECORD;
BEGIN
  -- Get current facility status
  SELECT subscription_status, feature_access_level INTO current_facility
  FROM facilities 
  WHERE id = p_facility_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Reset to trial status
  UPDATE facilities 
  SET 
    subscription_status = 'trial',
    feature_access_level = 'trial',
    trial_start_date = now(),
    trial_end_date = now() + interval '7 days',
    stripe_customer_id = NULL,
    stripe_subscription_id = NULL,
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
    notes
  ) VALUES (
    p_facility_id,
    p_admin_email,
    'reset_status',
    current_facility.subscription_status,
    'trial',
    current_facility.feature_access_level,
    'trial',
    p_notes
  );
  
  RETURN TRUE;
END;
$$;
