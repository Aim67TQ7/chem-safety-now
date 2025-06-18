
-- Add missing columns to support PDF readability and quality-based storage
ALTER TABLE public.sds_documents 
ADD COLUMN IF NOT EXISTS extraction_quality_score NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_readable BOOLEAN DEFAULT false;

-- Add index for quality-based queries
CREATE INDEX IF NOT EXISTS idx_sds_documents_quality_score 
ON public.sds_documents (extraction_quality_score DESC);

-- Add index for readability filtering
CREATE INDEX IF NOT EXISTS idx_sds_documents_readable 
ON public.sds_documents (is_readable) WHERE is_readable = true;

-- Update existing documents to have default quality scores
UPDATE public.sds_documents 
SET extraction_quality_score = 0, is_readable = false 
WHERE extraction_quality_score IS NULL OR is_readable IS NULL;
