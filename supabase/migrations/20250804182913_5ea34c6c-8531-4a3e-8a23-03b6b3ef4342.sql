-- Update the Basic plan's monthly price ID
UPDATE subscription_plans 
SET stripe_monthly_price_id = 'price_1RsT5gQ5JeJXEK81FiGGCWJ4'
WHERE name = 'Basic' AND monthly_price = 20.00;