
-- Add last_incident_date column to facilities table
ALTER TABLE public.facilities 
ADD COLUMN last_incident_date DATE;

-- Add a comment to document the column
COMMENT ON COLUMN public.facilities.last_incident_date IS 'Date of the last safety incident at the facility';
