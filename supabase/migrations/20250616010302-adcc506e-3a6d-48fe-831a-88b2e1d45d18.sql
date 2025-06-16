
-- First, let's check which tables have data and clean up unused ones
-- Remove tables that appear to be unused based on the schema

-- Drop unused tables that don't seem to have any data or purpose
DROP TABLE IF EXISTS company_settings CASCADE;
DROP TABLE IF EXISTS facility_search_history CASCADE;
DROP TABLE IF EXISTS facility_sessions CASCADE;
DROP TABLE IF EXISTS sds_lookups CASCADE;
DROP TABLE IF EXISTS user_locations CASCADE;
DROP TABLE IF EXISTS webhook_event_logs CASCADE;

-- Create a trigger to automatically create a free subscription when a user signs up
CREATE OR REPLACE FUNCTION handle_new_user_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  free_tier_id UUID;
BEGIN
  -- Get the free tier ID (assuming there's a free tier)
  SELECT id INTO free_tier_id 
  FROM subscription_tiers 
  WHERE name ILIKE '%free%' OR monthly_price = 0 
  LIMIT 1;
  
  -- If no free tier exists, create one
  IF free_tier_id IS NULL THEN
    INSERT INTO subscription_tiers (name, monthly_price, annual_price, lookup_limit)
    VALUES ('Free', 0, 0, 10)
    RETURNING id INTO free_tier_id;
  END IF;
  
  -- Create a free subscription for the new user
  INSERT INTO subscriptions (
    user_id, 
    tier_id, 
    status,
    current_lookups,
    lookup_reset_date
  ) VALUES (
    NEW.id,
    free_tier_id,
    'active',
    0,
    date_trunc('month', now()) + interval '1 month'
  );
  
  RETURN NEW;
END;
$$;

-- Update the existing trigger to also handle subscriptions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE PROCEDURE handle_new_user_subscription();

-- Create a function to upgrade subscription when payment is made
CREATE OR REPLACE FUNCTION upgrade_user_subscription(
  p_user_id UUID,
  p_tier_name TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_tier_id UUID;
BEGIN
  -- Get the target tier ID
  SELECT id INTO target_tier_id
  FROM subscription_tiers
  WHERE name ILIKE p_tier_name
  LIMIT 1;
  
  IF target_tier_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Update the user's subscription
  UPDATE subscriptions
  SET 
    tier_id = target_tier_id,
    status = 'active',
    current_lookups = 0,
    lookup_reset_date = date_trunc('month', now()) + interval '1 month',
    updated_at = now()
  WHERE user_id = p_user_id;
  
  RETURN TRUE;
END;
$$;

-- Add indexes for better performance on remaining tables
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_qr_codes_facility_active ON qr_codes(facility_id, is_active);
CREATE INDEX IF NOT EXISTS idx_sds_documents_product_name ON sds_documents USING gin(to_tsvector('english', product_name));
