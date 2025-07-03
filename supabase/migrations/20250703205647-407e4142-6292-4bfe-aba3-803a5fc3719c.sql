-- Create error tracking table for comprehensive error monitoring
CREATE TABLE public.error_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  facility_id UUID REFERENCES public.facilities(id),
  error_type TEXT NOT NULL, -- 'client_error', 'api_error', 'edge_function_error', 'database_error'
  error_level TEXT NOT NULL DEFAULT 'error', -- 'error', 'warning', 'critical'
  error_message TEXT NOT NULL,
  error_stack TEXT,
  error_code TEXT,
  user_agent TEXT,
  url TEXT,
  user_id UUID,
  session_id UUID,
  ip_address INET,
  additional_context JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'new', -- 'new', 'investigating', 'resolved', 'ignored'
  assigned_to TEXT,
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on error tracking
ALTER TABLE public.error_tracking ENABLE ROW LEVEL SECURITY;

-- Create policies for error tracking
CREATE POLICY "Allow system to insert errors" 
ON public.error_tracking 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow admin to view all errors" 
ON public.error_tracking 
FOR SELECT 
USING (true);

CREATE POLICY "Allow admin to update errors" 
ON public.error_tracking 
FOR UPDATE 
USING (true);

-- Create function to update timestamps
CREATE TRIGGER update_error_tracking_updated_at
BEFORE UPDATE ON public.error_tracking
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_error_tracking_created_at ON public.error_tracking(created_at DESC);
CREATE INDEX idx_error_tracking_facility_id ON public.error_tracking(facility_id);
CREATE INDEX idx_error_tracking_error_type ON public.error_tracking(error_type);
CREATE INDEX idx_error_tracking_status ON public.error_tracking(status);
CREATE INDEX idx_error_tracking_error_level ON public.error_tracking(error_level);