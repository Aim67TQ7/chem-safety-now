-- Fix bucket_url values that contain external URLs (should be null) 
-- and ensure proper URL format for Supabase storage URLs

-- First, set bucket_url to NULL for documents that have external URLs in bucket_url
-- (these should only be stored in source_url)
UPDATE sds_documents 
SET bucket_url = NULL 
WHERE bucket_url IS NOT NULL 
  AND (
    bucket_url NOT LIKE '%fwzgsiysdwsmmkgqmbsd.supabase.co%'
    OR bucket_url LIKE 'https://img3.fastenal.com%'
    OR bucket_url LIKE 'https://www.%'
    OR bucket_url LIKE 'http://www.%'
  );

-- Clean up any bucket_url values that might have trailing characters or malformed URLs
UPDATE sds_documents 
SET bucket_url = TRIM(TRAILING '?' FROM bucket_url)
WHERE bucket_url IS NOT NULL 
  AND bucket_url LIKE '%?';

-- Ensure all remaining bucket_url values are proper Supabase storage URLs
-- Log the ones that need manual review
DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN 
        SELECT id, product_name, bucket_url 
        FROM sds_documents 
        WHERE bucket_url IS NOT NULL 
          AND bucket_url NOT LIKE 'https://fwzgsiysdwsmmkgqmbsd.supabase.co/storage/v1/object/public/sds-documents/%'
    LOOP
        RAISE NOTICE 'Document % (%) has non-standard bucket_url: %', rec.product_name, rec.id, rec.bucket_url;
    END LOOP;
END $$;