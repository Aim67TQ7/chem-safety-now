
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

// Improved PDF text extraction function
async function extractTextFromPDF(pdfBuffer: ArrayBuffer): Promise<string> {
  console.log('📄 Starting PDF text extraction...');
  
  try {
    // Convert ArrayBuffer to Uint8Array for processing
    const pdfBytes = new Uint8Array(pdfBuffer);
    
    // Check if this is actually a PDF file
    const pdfHeader = new TextDecoder('ascii').decode(pdfBytes.slice(0, 5));
    if (!pdfHeader.startsWith('%PDF')) {
      throw new Error('File does not appear to be a valid PDF');
    }
    
    console.log('✅ Valid PDF file detected');
    
    // Extract text content by finding text streams and objects
    const extractedText = await extractPDFTextContent(pdfBytes);
    
    if (!extractedText || extractedText.length < 50) {
      console.log('⚠️ Low text content extracted, trying alternative method...');
      return await extractPDFTextAlternative(pdfBytes);
    }
    
    console.log(`✅ Successfully extracted ${extractedText.length} characters from PDF`);
    return extractedText;
    
  } catch (error) {
    console.error('❌ PDF text extraction failed:', error);
    throw new Error(`PDF text extraction failed: ${error.message}`);
  }
}

// Main PDF text extraction method
async function extractPDFTextContent(pdfBytes: Uint8Array): Promise<string> {
  const pdfString = new TextDecoder('latin1').decode(pdfBytes);
  const textChunks: string[] = [];
  
  // Find text objects in PDF
  const streamRegex = /stream\s*(.*?)\s*endstream/gs;
  const textRegex = /\((.*?)\)\s*Tj/g;
  const showTextRegex = /\[(.*?)\]\s*TJ/g;
  
  // Extract from streams
  let streamMatch;
  while ((streamMatch = streamRegex.exec(pdfString)) !== null) {
    const streamContent = streamMatch[1];
    
    // Look for text operators
    let textMatch;
    while ((textMatch = textRegex.exec(streamContent)) !== null) {
      const text = textMatch[1]
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\\\/g, '\\')
        .replace(/\\'/g, "'")
        .replace(/\\"/g, '"');
      
      if (text.length > 2 && /[a-zA-Z]/.test(text)) {
        textChunks.push(text);
      }
    }
    
    // Look for array text operators
    while ((textMatch = showTextRegex.exec(streamContent)) !== null) {
      const textArray = textMatch[1];
      const cleanText = textArray
        .replace(/\((.*?)\)/g, '$1')
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r');
      
      if (cleanText.length > 2 && /[a-zA-Z]/.test(cleanText)) {
        textChunks.push(cleanText);
      }
    }
  }
  
  // Clean and join extracted text
  const extractedText = textChunks
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  return extractedText;
}

// Alternative extraction method for complex PDFs
async function extractPDFTextAlternative(pdfBytes: Uint8Array): Promise<string> {
  console.log('🔄 Trying alternative PDF extraction method...');
  
  const pdfString = new TextDecoder('latin1').decode(pdfBytes);
  const textChunks: string[] = [];
  
  // More aggressive text extraction
  const objRegex = /obj\s*(.*?)\s*endobj/gs;
  
  let objMatch;
  while ((objMatch = objRegex.exec(pdfString)) !== null) {
    const objContent = objMatch[1];
    
    // Look for readable text patterns
    const readableTextRegex = /[A-Za-z][A-Za-z0-9\s\-\.,;:()]{10,}/g;
    let textMatch;
    
    while ((textMatch = readableTextRegex.exec(objContent)) !== null) {
      const text = textMatch[0].trim();
      if (text.length > 10 && !text.includes('\x00')) {
        textChunks.push(text);
      }
    }
  }
  
  // Fallback: extract any readable ASCII text
  if (textChunks.length === 0) {
    console.log('🔄 Using fallback ASCII extraction...');
    const asciiText = new TextDecoder('ascii', { fatal: false }).decode(pdfBytes);
    const cleanAscii = asciiText
      .replace(/[\x00-\x1F\x7F-\xFF]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (cleanAscii.length > 100) {
      return cleanAscii;
    }
  }
  
  const result = textChunks.join(' ').replace(/\s+/g, ' ').trim();
  
  if (result.length < 50) {
    throw new Error('Unable to extract sufficient text content from PDF');
  }
  
  return result;
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

    // Extract text using improved PDF processing
    const fullText = await extractTextFromPDF(pdfBuffer);

    if (!fullText || fullText.length < 100) {
      throw new Error('Insufficient text extracted from PDF');
    }

    console.log('📝 Extracted text length:', fullText.length);
    console.log('📝 Text preview:', fullText.substring(0, 200) + '...');

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
