-- Add incident reporting features to feature_permissions with premium requirement
INSERT INTO feature_permissions (feature_name, description, required_plan) 
VALUES 
  ('incident_reporting', 'Access to incident reporting system', 'premium'),
  ('incidents', 'Access to incidents management', 'premium')
ON CONFLICT (feature_name) DO UPDATE SET 
  required_plan = EXCLUDED.required_plan,
  description = EXCLUDED.description;

-- Update Premium subscription plan to include incident reporting features
UPDATE subscription_plans 
SET features = jsonb_set(
  features, 
  '{999}', 
  '"incident_reporting"'::jsonb
)
WHERE name = 'Premium' AND NOT (features ? 'incident_reporting');

UPDATE subscription_plans 
SET features = jsonb_set(
  features, 
  '{1000}', 
  '"incidents"'::jsonb
)
WHERE name = 'Premium' AND NOT (features ? 'incidents');