
-- Drop existing incidents table to rebuild with comprehensive fields
DROP TABLE IF EXISTS public.incident_ai_analysis CASCADE;
DROP TABLE IF EXISTS public.incident_images CASCADE;
DROP TABLE IF EXISTS public.incidents CASCADE;

-- Create comprehensive incidents table for both near-misses and reportable incidents
CREATE TABLE public.incidents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  facility_id UUID REFERENCES public.facilities(id) ON DELETE CASCADE,
  
  -- Basic incident classification
  incident_type TEXT NOT NULL, -- 'near_miss', 'reportable'
  
  -- Common fields for both types
  incident_date TIMESTAMPTZ NOT NULL,
  incident_time TIME,
  location TEXT NOT NULL,
  person_involved_name TEXT NOT NULL,
  person_involved_job_title TEXT,
  person_involved_dob DATE, -- Only for reportable incidents
  person_involved_date_hired DATE, -- Only for reportable incidents
  description TEXT NOT NULL,
  activity_being_performed TEXT NOT NULL,
  equipment_materials_involved TEXT,
  witnesses JSONB DEFAULT '[]'::jsonb, -- Array of {name, contact_info}
  ppe_used BOOLEAN,
  ppe_details TEXT,
  immediate_actions_taken TEXT,
  corrective_actions TEXT,
  additional_comments TEXT,
  form_completed_by_name TEXT NOT NULL,
  form_completed_by_contact TEXT,
  
  -- Near-miss specific fields
  potential_severity TEXT, -- For near-miss: 'low', 'medium', 'high', 'critical'
  probability_recurrence TEXT, -- For near-miss: 'unlikely', 'possible', 'likely', 'certain'
  
  -- Reportable incident specific fields
  nature_of_injury_illness TEXT, -- For reportable incidents
  body_parts_affected JSONB DEFAULT '[]'::jsonb, -- Array of affected body parts
  object_substance_causing_injury TEXT, -- For reportable incidents
  medical_treatment_provided TEXT, -- 'first_aid', 'emergency_room', 'hospitalization', 'none'
  medical_provider_name TEXT,
  medical_provider_contact TEXT,
  days_away_from_work BOOLEAN DEFAULT false,
  days_away_details TEXT,
  job_transfer_restriction BOOLEAN DEFAULT false,
  job_transfer_details TEXT,
  severity_classification TEXT, -- 'death', 'days_away', 'restricted_duty', 'other_recordable'
  
  -- System fields
  status TEXT NOT NULL DEFAULT 'open', -- 'open', 'under_investigation', 'resolved', 'closed'
  reported_by_user_id UUID,
  assigned_to_user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Recreate incident_images table
CREATE TABLE public.incident_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  content_type TEXT,
  description TEXT,
  uploaded_by_user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Recreate incident_ai_analysis table
CREATE TABLE public.incident_ai_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL, -- 'root_cause', 'recommendations', 'follow_up_questions'
  ai_response TEXT NOT NULL,
  confidence_score NUMERIC(3,2), -- 0.00 to 1.00
  related_sds_documents JSONB DEFAULT '[]'::jsonb,
  suggested_actions JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all incident tables
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_ai_analysis ENABLE ROW LEVEL SECURITY;

-- RLS Policies for incidents table
CREATE POLICY "Facility users can view their facility incidents" 
  ON public.incidents 
  FOR SELECT 
  USING (facility_id IN (
    SELECT id FROM public.facilities 
    WHERE id = facility_id
  ));

CREATE POLICY "Users can create incidents for their facility" 
  ON public.incidents 
  FOR INSERT 
  WITH CHECK (facility_id IN (
    SELECT id FROM public.facilities 
    WHERE id = facility_id
  ));

CREATE POLICY "Users can update incidents for their facility" 
  ON public.incidents 
  FOR UPDATE 
  USING (facility_id IN (
    SELECT id FROM public.facilities 
    WHERE id = facility_id
  ));

-- RLS Policies for incident_images table
CREATE POLICY "Users can view images for their facility incidents" 
  ON public.incident_images 
  FOR SELECT 
  USING (incident_id IN (
    SELECT id FROM public.incidents 
    WHERE facility_id IN (
      SELECT id FROM public.facilities 
      WHERE id = incidents.facility_id
    )
  ));

CREATE POLICY "Users can upload images for their facility incidents" 
  ON public.incident_images 
  FOR INSERT 
  WITH CHECK (incident_id IN (
    SELECT id FROM public.incidents 
    WHERE facility_id IN (
      SELECT id FROM public.facilities 
      WHERE id = incidents.facility_id
    )
  ));

-- RLS Policies for incident_ai_analysis table
CREATE POLICY "Users can view AI analysis for their facility incidents" 
  ON public.incident_ai_analysis 
  FOR SELECT 
  USING (incident_id IN (
    SELECT id FROM public.incidents 
    WHERE facility_id IN (
      SELECT id FROM public.facilities 
      WHERE id = incidents.facility_id
    )
  ));

CREATE POLICY "System can create AI analysis for any incident" 
  ON public.incident_ai_analysis 
  FOR INSERT 
  WITH CHECK (true);

-- Add indexes for better performance
CREATE INDEX idx_incidents_facility_id ON public.incidents(facility_id);
CREATE INDEX idx_incidents_incident_type ON public.incidents(incident_type);
CREATE INDEX idx_incidents_status ON public.incidents(status);
CREATE INDEX idx_incidents_incident_date ON public.incidents(incident_date);
CREATE INDEX idx_incidents_severity_classification ON public.incidents(severity_classification);
CREATE INDEX idx_incident_images_incident_id ON public.incident_images(incident_id);
CREATE INDEX idx_incident_ai_analysis_incident_id ON public.incident_ai_analysis(incident_id);

-- Add trigger for updating updated_at timestamp
CREATE TRIGGER set_timestamp_incidents
  BEFORE UPDATE ON public.incidents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
