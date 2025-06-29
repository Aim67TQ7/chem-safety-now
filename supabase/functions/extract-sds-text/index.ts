
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { ExtractRequest } from './types.ts'
import { EnhancedSDSProcessor } from './enhanced-pdf-processor.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

// Helper function to resolve URL based on different formats
function resolveDownloadUrl(url: string): string {
  console.log('🔗 Resolving URL:', url);
  
  // If it's already a full HTTP/HTTPS URL, use it directly
  if (url.startsWith('http://') || url.startsWith('https://')) {
    console.log('✅ Using full URL as-is');
    return url;
  }
  
  // If it's a supabase:// protocol URL, convert to HTTP
  if (url.startsWith('supabase://')) {
    const path = url.replace('supabase://', '');
    const fullUrl = `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/${path}`;
    console.log('🔄 Converted supabase:// URL to:', fullUrl);
    return fullUrl;
  }
  
  // If it's a relative storage path (starts with bucket name), construct full URL
  if (url.includes('/') && !url.startsWith('/')) {
    const fullUrl = `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/${url}`;
    console.log('🔄 Constructed storage URL:', fullUrl);
    return fullUrl;
  }
  
  // If it starts with a slash, it might be an absolute path on the server
  if (url.startsWith('/')) {
    const fullUrl = `${Deno.env.get('SUPABASE_URL')}${url}`;
    console.log('🔄 Constructed absolute path URL:', fullUrl);
    return fullUrl;
  }
  
  // Default fallback - assume it's a storage object path
  const fullUrl = `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/sds-documents/${url}`;
  console.log('🔄 Fallback storage URL:', fullUrl);
  return fullUrl;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { document_id, bucket_url }: ExtractRequest = await req.json();
    
    console.log('🔍 Starting enhanced SDS text extraction for document:', document_id);

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

    // Check if document already has high-quality extracted data
    if (document.extraction_quality_score > 70 && document.h_codes && document.h_codes.length > 0) {
      console.log('✅ Document already has high-quality extracted data, skipping extraction');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Document already has high-quality extracted data',
          quality_score: document.extraction_quality_score,
          confidence: document.ai_extraction_confidence || 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use bucket_url if provided, otherwise use source_url
    const rawUrl = bucket_url || document.source_url;
    
    if (!rawUrl) {
      throw new Error('No URL available for extraction');
    }

    // Resolve the URL to a proper downloadable format
    const extractionUrl = resolveDownloadUrl(rawUrl);
    console.log('📥 Final download URL:', extractionUrl);

    // Download and process PDF
    console.log('📥 Downloading PDF...');
    const response = await fetch(extractionUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SDS-Extractor/2.0)',
        'Accept': 'application/pdf,*/*'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to download PDF: ${response.status} ${response.statusText} from ${extractionUrl}`);
    }

    const pdfBuffer = await response.arrayBuffer();
    console.log('📊 PDF size:', pdfBuffer.byteLength, 'bytes');

    if (pdfBuffer.byteLength === 0) {
      throw new Error('Downloaded PDF is empty');
    }

    // Extract text using enhanced processor
    let fullText = '';
    try {
      // Simple text extraction - in production, you'd use a proper PDF parser
      const textDecoder = new TextDecoder('utf-8', { fatal: false });
      const rawText = textDecoder.decode(pdfBuffer);
      
      // Basic text cleaning and extraction
      const lines = rawText.split(/[\r\n]+/).filter(line => 
        line.trim().length > 3 && 
        /[a-zA-Z]/.test(line) && 
        !line.includes('\u0000')
      );
      
      fullText = lines.join(' ');
    } catch (error) {
      console.error('❌ Text extraction failed:', error);
      throw new Error('Failed to extract text from PDF');
    }

    if (!fullText || fullText.length < 100) {
      throw new Error('Insufficient text extracted from PDF');
    }

    console.log('📝 Extracted text length:', fullText.length);

    // Process with enhanced SDS processor
    const processingResult = await EnhancedSDSProcessor.processSDSText(
      fullText, 
      document.file_name
    );

    if (!processingResult.success) {
      throw new Error(`Processing failed: ${processingResult.errors.join(', ')}`);
    }

    // Map extracted data to database format
    const extractedData = processingResult.data;
    const updateData = {
      // Core SDS data
      manufacturer: extractedData.manufacturer || null,
      cas_number: extractedData.cas_number || null,
      signal_word: extractedData.signal_word || null,
      full_text: extractedData.full_text,
      
      // Hazard data
      h_codes: extractedData.h_codes || [],
      hazard_statements: extractedData.hazard_statements || [],
      precautionary_statements: extractedData.precautionary_statements || [],
      
      // Pictograms - convert to simple array format
      pictograms: extractedData.pictograms?.map(p => p.name) || [],
      
      // Physical/Health/Environmental hazards
      physical_hazards: extractedData.physical_hazards || [],
      health_hazards: extractedData.health_hazards || [],
      environmental_hazards: extractedData.environmental_hazards || [],
      
      // Rating codes
      hmis_codes: extractedData.hmis_codes || {},
      nfpa_codes: extractedData.nfpa_codes || {},
      
      // First aid
      first_aid: extractedData.first_aid || {},
      
      // Quality metrics
      extraction_quality_score: extractedData.extraction_quality_score || 0,
      ai_extraction_confidence: processingResult.confidence || 0,
      is_readable: extractedData.is_readable || false,
      
      // Document classification and status
      document_type: extractedData.extraction_quality_score > 50 ? 'sds' : 'unknown_document',
      extraction_status: processingResult.confidence >= 98 ? 'osha_compliant' : 
                        processingResult.confidence >= 80 ? 'ai_enhanced' : 'manual_review_required',
      
      // Timestamp
      ai_extraction_date: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Update document with extracted data
    const { error: updateError } = await supabase
      .from('sds_documents')
      .update(updateData)
      .eq('id', document_id);

    if (updateError) {
      console.error('❌ Error updating document:', updateError);
      throw updateError;
    }

    console.log('✅ Successfully extracted and stored enhanced SDS data');
    console.log(`📊 Quality score: ${extractedData.extraction_quality_score}`);
    console.log(`🔍 Confidence: ${processingResult.confidence}%`);
    console.log(`📋 Status: ${updateData.extraction_status}`);

    // Log warnings if any
    if (processingResult.warnings.length > 0) {
      console.log('⚠️ Warnings:', processingResult.warnings);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        extracted_data: updateData,
        quality_score: extractedData.extraction_quality_score,
        confidence: processingResult.confidence,
        extraction_status: updateData.extraction_status,
        warnings: processingResult.warnings,
        message: `Successfully extracted enhanced SDS data with ${extractedData.extraction_quality_score}% quality score`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Enhanced SDS text extraction error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Enhanced text extraction failed',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
