
-- Add the missing updated_at column to sds_documents table
ALTER TABLE public.sds_documents 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create a trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_sds_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_update_sds_documents_updated_at ON public.sds_documents;
CREATE TRIGGER trigger_update_sds_documents_updated_at
  BEFORE UPDATE ON public.sds_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_sds_documents_updated_at();

-- Update existing records to have updated_at values
UPDATE public.sds_documents 
SET updated_at = created_at 
WHERE updated_at IS NULL;
