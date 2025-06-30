
-- Create sales representatives table
CREATE TABLE public.sales_reps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  territory TEXT,
  hire_date DATE DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT true,
  commission_rate DECIMAL(5,4) DEFAULT 0.10, -- 10% default commission
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create facility-sales rep assignments table
CREATE TABLE public.facility_sales_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  sales_rep_id UUID NOT NULL REFERENCES public.sales_reps(id) ON DELETE CASCADE,
  assigned_date TIMESTAMPTZ DEFAULT now(),
  is_primary BOOLEAN DEFAULT true,
  UNIQUE(facility_id, sales_rep_id)
);

-- Create conversion tracking table
CREATE TABLE public.subscription_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  sales_rep_id UUID REFERENCES public.sales_reps(id),
  converted_by_admin_email TEXT,
  conversion_type TEXT NOT NULL CHECK (conversion_type IN ('trial_to_basic', 'trial_to_premium', 'basic_to_premium')),
  previous_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  monthly_revenue DECIMAL(10,2),
  annual_revenue DECIMAL(10,2),
  conversion_date TIMESTAMPTZ DEFAULT now(),
  notes TEXT
);

-- Enable RLS on all new tables
ALTER TABLE public.sales_reps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facility_sales_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_conversions ENABLE ROW LEVEL SECURITY;

-- Create policies for sales reps (allow read access for now)
CREATE POLICY "Allow read access to sales reps" ON public.sales_reps FOR SELECT USING (true);

-- Create policies for assignments (allow read access for now)  
CREATE POLICY "Allow read access to assignments" ON public.facility_sales_assignments FOR SELECT USING (true);

-- Create policies for conversions (allow read access for now)
CREATE POLICY "Allow read access to conversions" ON public.subscription_conversions FOR SELECT USING (true);

-- Create view for sales rep performance metrics
CREATE OR REPLACE VIEW public.sales_rep_performance AS
SELECT 
  sr.id,
  sr.name,
  sr.email,
  sr.territory,
  COUNT(DISTINCT fsa.facility_id) as total_facilities,
  COUNT(DISTINCT CASE WHEN f.subscription_status = 'trial' THEN f.id END) as trial_facilities,
  COUNT(DISTINCT CASE WHEN f.subscription_status IN ('basic', 'premium') THEN f.id END) as paid_facilities,
  COUNT(DISTINCT sc.id) as total_conversions,
  COALESCE(SUM(sc.monthly_revenue), 0) as monthly_revenue,
  COALESCE(SUM(sc.annual_revenue), 0) as annual_revenue,
  CASE 
    WHEN COUNT(DISTINCT fsa.facility_id) > 0 THEN 
      ROUND((COUNT(DISTINCT CASE WHEN f.subscription_status IN ('basic', 'premium') THEN f.id END)::decimal / COUNT(DISTINCT fsa.facility_id)) * 100, 2)
    ELSE 0 
  END as conversion_rate
FROM public.sales_reps sr
LEFT JOIN public.facility_sales_assignments fsa ON sr.id = fsa.sales_rep_id
LEFT JOIN public.facilities f ON fsa.facility_id = f.id
LEFT JOIN public.subscription_conversions sc ON sr.id = sc.sales_rep_id
WHERE sr.is_active = true
GROUP BY sr.id, sr.name, sr.email, sr.territory
ORDER BY monthly_revenue DESC;

-- Insert sample sales reps
INSERT INTO public.sales_reps (name, email, territory) VALUES
('Sarah Johnson', 'sarah.johnson@chemlabel-gpt.com', 'West Coast'),
('Mike Chen', 'mike.chen@chemlabel-gpt.com', 'Enterprise'),
('Lisa Rodriguez', 'lisa.rodriguez@chemlabel-gpt.com', 'East Coast');

-- Create function to convert trial to paid subscription
CREATE OR REPLACE FUNCTION public.convert_trial_to_paid(
  p_facility_id UUID,
  p_sales_rep_id UUID,
  p_plan_type TEXT DEFAULT 'basic',
  p_billing_period TEXT DEFAULT 'monthly'
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_facility RECORD;
  monthly_price DECIMAL(10,2);
  annual_price DECIMAL(10,2);
  revenue_amount DECIMAL(10,2);
BEGIN
  -- Get current facility status
  SELECT subscription_status, feature_access_level INTO current_facility
  FROM facilities 
  WHERE id = p_facility_id;
  
  IF NOT FOUND OR current_facility.subscription_status != 'trial' THEN
    RETURN FALSE;
  END IF;
  
  -- Set pricing (only one plan: $39/month or $399/year)
  monthly_price := 39.00;
  annual_price := 399.00;
  
  IF p_billing_period = 'annual' THEN
    revenue_amount := annual_price;
  ELSE
    revenue_amount := monthly_price;
  END IF;
  
  -- Update facility subscription
  UPDATE facilities 
  SET 
    subscription_status = 'basic',
    feature_access_level = 'basic',
    subscription_start_date = now(),
    billing_period = p_billing_period,
    trial_end_date = CASE 
      WHEN p_billing_period = 'annual' THEN now() + interval '1 year'
      ELSE now() + interval '1 month'
    END,
    updated_at = now()
  WHERE id = p_facility_id;
  
  -- Record the conversion
  INSERT INTO subscription_conversions (
    facility_id,
    sales_rep_id,
    conversion_type,
    previous_status,
    new_status,
    monthly_revenue,
    annual_revenue
  ) VALUES (
    p_facility_id,
    p_sales_rep_id,
    'trial_to_basic',
    current_facility.subscription_status,
    'basic',
    CASE WHEN p_billing_period = 'monthly' THEN monthly_price ELSE 0 END,
    CASE WHEN p_billing_period = 'annual' THEN annual_price ELSE 0 END
  );
  
  RETURN TRUE;
END;
$$;
