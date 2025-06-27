
-- Add missing columns for OSHA-compliant extraction workflow
ALTER TABLE public.sds_documents 
ADD COLUMN IF NOT EXISTS extraction_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS ai_extraction_confidence INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_extraction_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS ai_extracted_data JSONB DEFAULT '{}'::jsonb;

-- Add index for extraction status queries
CREATE INDEX IF NOT EXISTS idx_sds_documents_extraction_status ON public.sds_documents(extraction_status);

-- Add index for confidence score queries  
CREATE INDEX IF NOT EXISTS idx_sds_documents_ai_confidence ON public.sds_documents(ai_extraction_confidence);
