
-- Create facility_feedback table to store user comments, suggestions, and problems
CREATE TABLE public.facility_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  facility_id UUID NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('comment', 'suggestion', 'problem')),
  message TEXT NOT NULL,
  contact_info TEXT,
  user_agent TEXT,
  ip_address INET,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'resolved')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for the feedback table
ALTER TABLE public.facility_feedback ENABLE ROW LEVEL SECURITY;

-- Allow public insert access (for anonymous feedback submission)
CREATE POLICY "Allow public feedback submission" 
  ON public.facility_feedback 
  FOR INSERT 
  WITH CHECK (true);

-- Allow public read access (needed for admin dashboard)
CREATE POLICY "Allow public read access to feedback" 
  ON public.facility_feedback 
  FOR SELECT 
  USING (true);

-- Allow public update access (for status changes from admin)
CREATE POLICY "Allow public update of feedback status" 
  ON public.facility_feedback 
  FOR UPDATE 
  USING (true);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER trigger_update_facility_feedback_updated_at
  BEFORE UPDATE ON public.facility_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_facility_feedback_facility_id ON public.facility_feedback(facility_id);
CREATE INDEX idx_facility_feedback_status ON public.facility_feedback(status);
CREATE INDEX idx_facility_feedback_created_at ON public.facility_feedback(created_at DESC);
