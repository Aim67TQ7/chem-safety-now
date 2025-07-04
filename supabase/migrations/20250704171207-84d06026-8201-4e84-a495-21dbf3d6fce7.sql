-- Update subscription plans with new pricing structure
UPDATE subscription_plans 
SET 
  monthly_price = 5.00,
  annual_price = 50.00
WHERE name = 'Basic';

UPDATE subscription_plans 
SET 
  monthly_price = 19.00,
  annual_price = 190.00
WHERE name = 'Pro';

UPDATE subscription_plans 
SET 
  monthly_price = 39.00,
  annual_price = 390.00
WHERE name = 'Premium';