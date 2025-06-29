
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

interface BatchProcessRequest {
  facility_id?: string;
  document_ids?: string[];
  quality_threshold?: number;
  force_reprocess?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      facility_id, 
      document_ids, 
      quality_threshold = 50,
      force_reprocess = false 
    }: BatchProcessRequest = await req.json();
    
    console.log('🔄 Starting batch SDS processing...');

    let query = supabase.from('sds_documents').select('id, product_name, extraction_quality_score, bucket_url, source_url');

    // Filter by facility if provided
    if (facility_id) {
      // Note: You'll need to add facility_id to sds_documents table if needed
      console.log('📍 Filtering by facility:', facility_id);
    }

    // Filter by specific document IDs if provided
    if (document_ids && document_ids.length > 0) {
      query = query.in('id', document_ids);
      console.log('📋 Processing specific documents:', document_ids.length);
    } else {
      // Process documents that need improvement
      if (!force_reprocess) {
        query = query.or(`extraction_quality_score.lt.${quality_threshold},extraction_quality_score.is.null`);
      }
    }

    const { data: documents, error: fetchError } = await query.limit(50); // Limit to prevent overload

    if (fetchError) {
      throw new Error(`Failed to fetch documents: ${fetchError.message}`);
    }

    if (!documents || documents.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No documents found for processing',
          processed: 0,
          skipped: 0,
          failed: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📊 Found ${documents.length} documents to process`);

    const results = {
      processed: 0,
      skipped: 0,
      failed: 0,
      errors: [] as string[]
    };

    // Process documents in batches of 5 to prevent overwhelming the system
    const batchSize = 5;
    for (let i = 0; i < documents.length; i += batchSize) {
      const batch = documents.slice(i, i + batchSize);
      console.log(`🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(documents.length / batchSize)}`);

      const batchPromises = batch.map(async (doc) => {
        try {
          // Skip if already high quality and not forcing reprocess
          if (!force_reprocess && doc.extraction_quality_score >= quality_threshold) {
            console.log(`⏭️ Skipping ${doc.product_name} (quality: ${doc.extraction_quality_score})`);
            results.skipped++;
            return;
          }

          // Call the extraction function
          const extractionUrl = doc.bucket_url || doc.source_url;
          if (!extractionUrl) {
            console.log(`⚠️ No URL available for ${doc.product_name}`);
            results.skipped++;
            return;
          }

          console.log(`🔍 Processing: ${doc.product_name}`);

          const { error: processError } = await supabase.functions.invoke('extract-sds-text', {
            body: {
              document_id: doc.id,
              bucket_url: extractionUrl
            }
          });

          if (processError) {
            console.error(`❌ Failed to process ${doc.product_name}:`, processError);
            results.failed++;
            results.errors.push(`${doc.product_name}: ${processError.message}`);
          } else {
            console.log(`✅ Successfully processed: ${doc.product_name}`);
            results.processed++;
          }

        } catch (error) {
          console.error(`❌ Error processing ${doc.product_name}:`, error);
          results.failed++;
          results.errors.push(`${doc.product_name}: ${error.message}`);
        }
      });

      // Wait for current batch to complete before starting next batch
      await Promise.all(batchPromises);

      // Small delay between batches to prevent overwhelming the system
      if (i + batchSize < documents.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log('✅ Batch processing completed');
    console.log(`📊 Results: ${results.processed} processed, ${results.skipped} skipped, ${results.failed} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Batch processing completed`,
        total_documents: documents.length,
        processed: results.processed,
        skipped: results.skipped,
        failed: results.failed,
        errors: results.errors.slice(0, 10), // Limit error details
        quality_threshold: quality_threshold,
        force_reprocess: force_reprocess
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Batch processing error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Batch processing failed',
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
