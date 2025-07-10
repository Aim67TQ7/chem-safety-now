-- Remove duplicate SDS documents, keeping only the oldest (first) version of each duplicate set
-- This will clean up the database and reduce storage usage

-- Create a temporary table with the documents to keep (oldest of each duplicate group)
CREATE TEMP TABLE documents_to_keep AS
SELECT DISTINCT ON (product_name, COALESCE(manufacturer, ''), file_name) 
  id,
  product_name,
  manufacturer,
  file_name,
  created_at,
  bucket_url
FROM sds_documents 
ORDER BY product_name, COALESCE(manufacturer, ''), file_name, created_at ASC;

-- Log the cleanup operation before deletion
INSERT INTO facility_audit_trail (
  action_type,
  action_description,
  old_values,
  created_at
) 
SELECT 
  'bulk_cleanup',
  'Removed duplicate SDS documents - kept oldest version of each',
  jsonb_build_object(
    'total_duplicates_removed', COUNT(*),
    'criteria', 'product_name + manufacturer + file_name'
  ),
  now()
FROM sds_documents 
WHERE id NOT IN (SELECT id FROM documents_to_keep);

-- Delete duplicate SDS documents (keep only the oldest of each group)
DELETE FROM sds_documents 
WHERE id NOT IN (SELECT id FROM documents_to_keep);

-- Clean up any orphaned SDS interactions that reference deleted documents
DELETE FROM sds_interactions 
WHERE sds_document_id IS NOT NULL 
  AND sds_document_id NOT IN (SELECT id FROM sds_documents);

-- Clean up any orphaned label generations that might reference deleted documents
-- Note: This table doesn't have direct FK to sds_documents, but we can clean based on product_name
DELETE FROM label_generations lg
WHERE NOT EXISTS (
  SELECT 1 FROM sds_documents sd 
  WHERE sd.product_name = lg.product_name 
    AND COALESCE(sd.manufacturer, '') = COALESCE(lg.manufacturer, '')
);

-- Update extraction quality scores for remaining documents to ensure consistency
UPDATE sds_documents 
SET updated_at = now()
WHERE extraction_quality_score IS NULL 
   OR extraction_quality_score = 0;

-- Return summary of cleanup
SELECT 
  'Cleanup Summary' as operation,
  COUNT(*) as remaining_documents,
  COUNT(DISTINCT product_name) as unique_products,
  COUNT(DISTINCT manufacturer) as unique_manufacturers
FROM sds_documents;