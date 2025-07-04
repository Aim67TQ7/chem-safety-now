-- Update Basic plan pricing to $5/month, $50/annual
UPDATE subscription_plans 
SET 
  monthly_price = 5.00,
  annual_price = 50.00
WHERE name = 'Basic';