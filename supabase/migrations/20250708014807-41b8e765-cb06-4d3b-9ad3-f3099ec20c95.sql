-- Update subscription plans with 4x pricing structure
UPDATE subscription_plans 
SET 
  monthly_price = 20.00,
  annual_price = 200.00
WHERE name = 'Basic';

UPDATE subscription_plans 
SET 
  monthly_price = 76.00,
  annual_price = 760.00
WHERE name = 'Pro';

UPDATE subscription_plans 
SET 
  monthly_price = 156.00,
  annual_price = 1560.00
WHERE name = 'Premium';