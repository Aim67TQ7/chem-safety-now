
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

interface ExtractRequest {
  document_id: string;
  bucket_url?: string;
}

interface SDSExtractedData {
  manufacturer?: string;
  cas_number?: string;
  h_codes?: Array<{ code: string; description: string }>;
  pictograms?: Array<{ ghs_code: string; name: string; description?: string }>;
  signal_word?: string;
  hazard_statements?: string[];
  precautionary_statements?: string[];
  physical_hazards?: string[];
  health_hazards?: string[];
  environmental_hazards?: string[];
  first_aid?: Record<string, string>;
  nfpa_codes?: Record<string, number>;
  hmis_codes?: Record<string, number>;
  full_text?: string;
  extraction_quality_score?: number;
  is_readable?: boolean;
}

function calculateExtractionQuality(extractedData: SDSExtractedData, textLength: number): number {
  let score = 0;
  
  // Basic text length (0-20 points)
  if (textLength > 2000) score += 20;
  else if (textLength > 1000) score += 15;
  else if (textLength > 500) score += 10;
  else if (textLength > 200) score += 5;
  
  // Essential SDS data (0-50 points)
  if (extractedData.h_codes && extractedData.h_codes.length > 0) score += 15;
  if (extractedData.signal_word) score += 10;
  if (extractedData.cas_number) score += 10;
  if (extractedData.manufacturer) score += 5;
  if (extractedData.pictograms && extractedData.pictograms.length > 0) score += 10;
  
  // Additional hazard information (0-20 points)
  if (extractedData.hazard_statements && extractedData.hazard_statements.length > 0) score += 5;
  if (extractedData.precautionary_statements && extractedData.precautionary_statements.length > 0) score += 5;
  if (extractedData.physical_hazards && extractedData.physical_hazards.length > 0) score += 3;
  if (extractedData.health_hazards && extractedData.health_hazards.length > 0) score += 3;
  if (extractedData.environmental_hazards && extractedData.environmental_hazards.length > 0) score += 2;
  if (extractedData.first_aid && Object.keys(extractedData.first_aid).length > 0) score += 2;
  
  // Rating system codes (0-10 points)
  if (extractedData.nfpa_codes && Object.keys(extractedData.nfpa_codes).length > 0) score += 5;
  if (extractedData.hmis_codes && Object.keys(extractedData.hmis_codes).length > 0) score += 5;
  
  return Math.min(score, 100); // Cap at 100
}

function extractSDSData(text: string): SDSExtractedData {
  console.log('🔍 Extracting SDS data from text...');
  
  const data: SDSExtractedData = {};
  
  // Extract manufacturer
  const manufacturerMatch = text.match(/(?:manufacturer|company)[:\s]*([^\n\r]{1,100})/i);
  if (manufacturerMatch) {
    data.manufacturer = manufacturerMatch[1].trim().replace(/[^\w\s&.,'-]/g, '');
  }
  
  // Extract CAS number
  const casMatch = text.match(/CAS[\s#]*:?\s*(\d{2,7}-\d{2}-\d)/i);
  if (casMatch) {
    data.cas_number = casMatch[1];
  }
  
  // Extract H-codes with descriptions
  const hCodeMatches = text.match(/H\d{3}[^\n\r]*/gi) || [];
  if (hCodeMatches.length > 0) {
    data.h_codes = hCodeMatches.map(match => {
      const code = match.match(/H\d{3}/)?.[0] || '';
      const description = match.replace(/H\d{3}\s*:?\s*/, '').trim();
      return { code, description };
    }).filter(item => item.code);
  }
  
  // Extract signal word
  const signalWordMatch = text.match(/signal word[:\s]*(danger|warning)/i);
  if (signalWordMatch) {
    data.signal_word = signalWordMatch[1].toLowerCase();
  }
  
  // Extract hazard statements
  const hazardStatements = hCodeMatches
    .map(match => match.replace(/H\d{3}\s*:?\s*/, '').trim())
    .filter(statement => statement.length > 10);
  if (hazardStatements.length > 0) {
    data.hazard_statements = hazardStatements;
  }
  
  // Extract precautionary statements (P-codes)
  const pCodeMatches = text.match(/P\d{3}[^\n\r]*/gi) || [];
  if (pCodeMatches.length > 0) {
    data.precautionary_statements = pCodeMatches.map(match => 
      match.replace(/P\d{3}\s*:?\s*/, '').trim()
    );
  }
  
  // Extract GHS pictograms
  const pictogramMatches = text.match(/GHS\d{2}|flame|skull|exclamation|health hazard|corrosion|explosive|oxidizing|gas cylinder/gi) || [];
  if (pictogramMatches.length > 0) {
    data.pictograms = [...new Set(pictogramMatches)].map(match => ({
      ghs_code: match.match(/GHS\d{2}/i)?.[0] || '',
      name: match.toLowerCase(),
      description: `${match} pictogram`
    }));
  }
  
  // Extract physical hazards
  const physicalHazardKeywords = ['flammable', 'explosive', 'oxidizing', 'corrosive', 'irritant', 'compressed gas'];
  const physicalHazards = physicalHazardKeywords.filter(keyword => 
    text.toLowerCase().includes(keyword)
  );
  if (physicalHazards.length > 0) {
    data.physical_hazards = physicalHazards;
  }
  
  // Extract health hazards
  const healthHazardKeywords = ['toxic', 'carcinogenic', 'mutagenic', 'reproductive toxicity', 'respiratory sensitizer'];
  const healthHazards = healthHazardKeywords.filter(keyword => 
    text.toLowerCase().includes(keyword)
  );
  if (healthHazards.length > 0) {
    data.health_hazards = healthHazards;
  }
  
  // Extract environmental hazards
  const envHazardKeywords = ['hazardous to aquatic life', 'environmental hazard', 'ozone layer'];
  const environmentalHazards = envHazardKeywords.filter(keyword => 
    text.toLowerCase().includes(keyword)
  );
  if (environmentalHazards.length > 0) {
    data.environmental_hazards = environmentalHazards;
  }
  
  // Extract first aid information
  const firstAidMatch = text.match(/first aid measures?[:\s]*([^]*?)(?=\n\s*\d+\.|$)/i);
  if (firstAidMatch) {
    data.first_aid = {
      general: firstAidMatch[1].trim().substring(0, 500)
    };
  }
  
  // Extract NFPA codes
  const nfpaMatch = text.match(/NFPA[:\s]*(\d)[:\s-]*(\d)[:\s-]*(\d)/i);
  if (nfpaMatch) {
    data.nfpa_codes = {
      health: parseInt(nfpaMatch[1]),
      flammability: parseInt(nfpaMatch[2]),
      reactivity: parseInt(nfpaMatch[3])
    };
  }
  
  // Extract HMIS codes
  const hmisMatch = text.match(/HMIS[:\s]*(\d)[:\s-]*(\d)[:\s-]*(\d)/i);
  if (hmisMatch) {
    data.hmis_codes = {
      health: parseInt(hmisMatch[1]),
      flammability: parseInt(hmisMatch[2]),
      reactivity: parseInt(hmisMatch[3])
    };
  }
  
  // Store full text (truncated for storage)
  data.full_text = text.substring(0, 10000);
  
  // Calculate quality score
  data.extraction_quality_score = calculateExtractionQuality(data, text.length);
  data.is_readable = data.extraction_quality_score >= 30;
  
  console.log(`✅ Extracted SDS data with quality score: ${data.extraction_quality_score}`);
  
  return data;
}

async function downloadAndExtractPDF(url: string): Promise<SDSExtractedData> {
  try {
    console.log('📥 Downloading PDF for extraction:', url);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SDS-Extractor/1.0)',
        'Accept': 'application/pdf,*/*'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to download PDF: ${response.status}`);
    }
    
    const pdfArrayBuffer = await response.arrayBuffer();
    const pdfText = new TextDecoder('utf-8', { fatal: false }).decode(pdfArrayBuffer);
    
    return extractSDSData(pdfText);
    
  } catch (error) {
    console.error('❌ Error downloading/extracting PDF:', error);
    throw error;
  }
}

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
