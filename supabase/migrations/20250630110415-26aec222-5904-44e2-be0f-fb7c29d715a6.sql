
-- Add proper RLS policies for sales representatives management
-- Allow public access for admin operations (you can restrict this further if needed)

-- Update RLS policies for sales_reps table
DROP POLICY IF EXISTS "Allow read access to sales reps" ON public.sales_reps;
DROP POLICY IF EXISTS "Allow write access to sales reps" ON public.sales_reps;

-- Create comprehensive policies for sales_reps
CREATE POLICY "Allow all operations on sales reps" 
  ON public.sales_reps 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Update RLS policies for facility_sales_assignments
DROP POLICY IF EXISTS "Allow read access to assignments" ON public.facility_sales_assignments;
DROP POLICY IF EXISTS "Allow write access to assignments" ON public.facility_sales_assignments;

CREATE POLICY "Allow all operations on sales assignments" 
  ON public.facility_sales_assignments 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Update RLS policies for subscription_conversions
DROP POLICY IF EXISTS "Allow read access to conversions" ON public.subscription_conversions;
DROP POLICY IF EXISTS "Allow write access to conversions" ON public.subscription_conversions;

CREATE POLICY "Allow all operations on subscription conversions" 
  ON public.subscription_conversions 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Make sure the sales_rep_performance view is accessible
-- Grant access to the view (it inherits from underlying tables)
GRANT SELECT ON public.sales_rep_performance TO anon, authenticated;
