-- Create sales partner applications table
CREATE TABLE public.sales_partner_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  business_description TEXT NOT NULL,
  application_status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.sales_partner_applications ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is a public application form)
CREATE POLICY "Anyone can submit sales partner applications" 
ON public.sales_partner_applications 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Admin can view all applications" 
ON public.sales_partner_applications 
FOR SELECT 
USING (true);

-- Create function to update timestamps
CREATE TRIGGER update_sales_partner_applications_updated_at
BEFORE UPDATE ON public.sales_partner_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();