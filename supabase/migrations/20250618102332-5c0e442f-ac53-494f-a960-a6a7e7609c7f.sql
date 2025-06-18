
-- Update Premium plan pricing (without updated_at column)
UPDATE subscription_plans 
SET 
  monthly_price = 350.00,
  annual_price = 3500.00
WHERE name = 'Premium';
