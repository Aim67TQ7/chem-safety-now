-- Update the Premium plan's monthly price ID
UPDATE subscription_plans 
SET stripe_monthly_price_id = 'price_1RsTAPQ5JeJXEK81k1v7Zsdz'
WHERE name = 'Premium' AND monthly_price = 156.00;