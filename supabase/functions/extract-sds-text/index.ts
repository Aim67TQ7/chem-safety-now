
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { ExtractRequest } from './types.ts'
import { downloadAndExtractPDF } from './pdf-downloader.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { document_id, bucket_url }: ExtractRequest = await req.json();
    
    console.log('🔍 Starting SDS text extraction for document:', document_id);

    // Get document details
    const { data: document, error: docError } = await supabase
      .from('sds_documents')
      .select('*')
      .eq('id', document_id)
      .single();

    if (docError || !document) {
      throw new Error('Document not found');
    }

    console.log('📄 Found document:', document.product_name);

    // Check if document already has extracted data
    if (document.h_codes && document.h_codes.length > 0 && document.extraction_quality_score > 0) {
      console.log('✅ Document already has extracted data, skipping extraction');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Document already has extracted data',
          quality_score: document.extraction_quality_score
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use bucket_url if provided, otherwise use source_url
    const extractionUrl = bucket_url || document.source_url;
    
    if (!extractionUrl) {
      throw new Error('No URL available for extraction');
    }

    // Extract data from PDF
    const extractedData = await downloadAndExtractPDF(extractionUrl);
    
    // Update document with extracted data
    const { error: updateError } = await supabase
      .from('sds_documents')
      .update({
        ...extractedData,
        updated_at: new Date().toISOString()
      })
      .eq('id', document_id);

    if (updateError) {
      console.error('❌ Error updating document:', updateError);
      throw updateError;
    }

    console.log('✅ Successfully extracted and stored SDS data');

    return new Response(
      JSON.stringify({ 
        success: true,
        extracted_data: extractedData,
        quality_score: extractedData.extraction_quality_score,
        message: `Successfully extracted SDS data with ${extractedData.extraction_quality_score}% quality score`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ SDS text extraction error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Text extraction failed',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
