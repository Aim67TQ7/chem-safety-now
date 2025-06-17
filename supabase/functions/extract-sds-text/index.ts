
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

// SDS Reference Constants
const H_CODES: Record<string, string> = {
  'H200': 'Unstable explosive',
  'H201': 'Explosive; mass explosion hazard',
  'H202': 'Explosive; severe projection hazard',
  'H203': 'Explosive; fire, blast or projection hazard',
  'H204': 'Fire or projection hazard',
  'H205': 'May mass explode in fire',
  'H220': 'Extremely flammable gas',
  'H221': 'Flammable gas',
  'H222': 'Extremely flammable aerosol',
  'H223': 'Flammable aerosol',
  'H224': 'Extremely flammable liquid and vapour',
  'H225': 'Highly flammable liquid and vapour',
  'H226': 'Flammable liquid and vapour',
  'H228': 'Flammable solid',
  'H240': 'Heating may cause an explosion',
  'H241': 'Heating may cause a fire or explosion',
  'H242': 'Heating may cause a fire',
  'H250': 'Catches fire spontaneously if exposed to air',
  'H251': 'Self-heating: may catch fire',
  'H252': 'Self-heating in large quantities: may catch fire',
  'H260': 'In contact with water releases flammable gases which may ignite spontaneously',
  'H261': 'In contact with water releases flammable gas',
  'H270': 'May cause or intensify fire; oxidiser',
  'H271': 'May cause fire or explosion; strong oxidiser',
  'H272': 'May intensify fire; oxidiser',
  'H280': 'Contains gas under pressure; may explode if heated',
  'H281': 'Contains refrigerated gas; may cause cryogenic burns or injury',
  'H290': 'May be corrosive to metals',
  'H300': 'Fatal if swallowed',
  'H301': 'Toxic if swallowed',
  'H302': 'Harmful if swallowed',
  'H304': 'May be fatal if swallowed and enters airways',
  'H310': 'Fatal in contact with skin',
  'H311': 'Toxic in contact with skin',
  'H312': 'Harmful in contact with skin',
  'H314': 'Causes severe skin burns and eye damage',
  'H315': 'Causes skin irritation',
  'H317': 'May cause an allergic skin reaction',
  'H318': 'Causes serious eye damage',
  'H319': 'Causes serious eye irritation',
  'H330': 'Fatal if inhaled',
  'H331': 'Toxic if inhaled',
  'H332': 'Harmful if inhaled',
  'H334': 'May cause allergy or asthma symptoms or breathing difficulties if inhaled',
  'H335': 'May cause respiratory irritation',
  'H336': 'May cause drowsiness or dizziness',
  'H340': 'May cause genetic defects',
  'H341': 'Suspected of causing genetic defects',
  'H350': 'May cause cancer',
  'H351': 'Suspected of causing cancer',
  'H360': 'May damage fertility or the unborn child',
  'H361': 'Suspected of damaging fertility or the unborn child',
  'H362': 'May cause harm to breast-fed children',
  'H370': 'Causes damage to organs',
  'H371': 'May cause damage to organs',
  'H372': 'Causes damage to organs through prolonged or repeated exposure',
  'H373': 'May cause damage to organs through prolonged or repeated exposure',
  'H400': 'Very toxic to aquatic life',
  'H401': 'Toxic to aquatic life',
  'H402': 'Harmful to aquatic life',
  'H410': 'Very toxic to aquatic life with long lasting effects',
  'H411': 'Toxic to aquatic life with long lasting effects',
  'H412': 'Harmful to aquatic life with long lasting effects',
  'H413': 'May cause long lasting harmful effects to aquatic life'
};

const PICTOGRAM_NAMES: Record<string, string> = {
  'GHS01': 'Explosive',
  'GHS02': 'Flammable',
  'GHS03': 'Oxidising',
  'GHS04': 'Compressed Gas',
  'GHS05': 'Corrosive',
  'GHS06': 'Toxic',
  'GHS07': 'Warning',
  'GHS08': 'Health Hazard',
  'GHS09': 'Environmental'
};

const H_CODE_TO_PICTOGRAM: Record<string, string> = {
  'H200': 'GHS01', 'H201': 'GHS01', 'H202': 'GHS01', 'H203': 'GHS01',
  'H220': 'GHS02', 'H221': 'GHS02', 'H222': 'GHS02', 'H223': 'GHS02',
  'H224': 'GHS02', 'H225': 'GHS02', 'H226': 'GHS02', 'H228': 'GHS02',
  'H270': 'GHS03', 'H271': 'GHS03', 'H272': 'GHS03',
  'H280': 'GHS04', 'H281': 'GHS04',
  'H290': 'GHS05', 'H314': 'GHS05',
  'H300': 'GHS06', 'H301': 'GHS06', 'H310': 'GHS06', 'H311': 'GHS06',
  'H330': 'GHS06', 'H331': 'GHS06',
  'H302': 'GHS07', 'H312': 'GHS07', 'H315': 'GHS07', 'H317': 'GHS07',
  'H318': 'GHS07', 'H319': 'GHS07', 'H332': 'GHS07', 'H335': 'GHS07',
  'H334': 'GHS08', 'H340': 'GHS08', 'H341': 'GHS08', 'H350': 'GHS08',
  'H351': 'GHS08', 'H360': 'GHS08', 'H361': 'GHS08', 'H362': 'GHS08',
  'H370': 'GHS08', 'H371': 'GHS08', 'H372': 'GHS08', 'H373': 'GHS08',
  'H400': 'GHS09', 'H410': 'GHS09', 'H411': 'GHS09', 'H412': 'GHS09', 'H413': 'GHS09'
};

const SDS_INDICATORS = [
  "safety data sheet",
  "section 1: identification",
  "section 1 identification",
  "hazard identification",
  "prepared in accordance with osha 29 cfr 1910.1200",
  "ghs classification",
  "pictograms",
  "signal word",
  "h-statements",
  "precautionary statements",
  "material safety data sheet",
  "msds"
];

const REGULATORY_INDICATORS = [
  "regulatory data sheet",
  "rds",
  "this product is an article and therefore is not subject to the requirements",
  "not subject to osha's hazard communication standard",
  "not subject to osha hazard communication standard",
  "regulations and industry standards",
  "this is not a safety data sheet",
  "article as defined by osha",
  "manufactured item which has a specific shape or design"
];

interface ExtractionRequest {
  document_id: string;
  bucket_url: string;
}

function extractHCodes(text: string): Array<{ code: string; description: string }> {
  const hCodeRegex = /H(\d{3})/g;
  const matches = text.match(hCodeRegex) || [];
  const uniqueCodes = [...new Set(matches)];
  
  return uniqueCodes
    .filter(code => H_CODES[code])
    .map(code => ({
      code,
      description: H_CODES[code]
    }));
}

function extractPictograms(hCodes: Array<{ code: string; description: string }>): Array<{ ghs_code: string; name: string; description?: string }> {
  const pictogramCodes = new Set<string>();
  
  hCodes.forEach(({ code }) => {
    const pictogramCode = H_CODE_TO_PICTOGRAM[code];
    if (pictogramCode) {
      pictogramCodes.add(pictogramCode);
    }
  });
  
  return Array.from(pictogramCodes).map(ghs_code => ({
    ghs_code,
    name: PICTOGRAM_NAMES[ghs_code] || ghs_code,
    description: `GHS ${PICTOGRAM_NAMES[ghs_code]} pictogram`
  }));
}

function extractSignalWord(text: string): string | null {
  const signalWordRegex = /Signal\s+Word[:\s]*(DANGER|WARNING)/i;
  const match = text.match(signalWordRegex);
  return match ? match[1].toUpperCase() : null;
}

function extractCASNumber(text: string): string | null {
  const casRegex = /CAS[:\s]*(\d{2,7}-\d{2}-\d)/i;
  const match = text.match(casRegex);
  return match ? match[1] : null;
}

function classifyDocumentType(text: string): string {
  const lowerText = text.toLowerCase();
  
  const regulatoryScore = REGULATORY_INDICATORS.reduce((score, indicator) => {
    return score + (lowerText.includes(indicator.toLowerCase()) ? 1 : 0);
  }, 0);
  
  const sdsScore = SDS_INDICATORS.reduce((score, indicator) => {
    return score + (lowerText.includes(indicator.toLowerCase()) ? 1 : 0);
  }, 0);
  
  if (regulatoryScore > sdsScore) {
    return lowerText.includes('article') ? 'regulatory_sheet_article' : 'regulatory_sheet';
  } else if (sdsScore > 0) {
    return 'safety_data_sheet';
  }
  
  return 'unknown_document';
}

function extractHazardStatements(text: string): string[] {
  const statements: string[] = [];
  const hazardSectionRegex = /(?:hazard statements?|h-statements?)[:\s]*(.*?)(?:\n\s*\n|precautionary|section|$)/is;
  const match = text.match(hazardSectionRegex);
  
  if (match && match[1]) {
    const hazardText = match[1];
    const lines = hazardText.split('\n').map(line => line.trim()).filter(line => line.length > 10);
    statements.push(...lines.slice(0, 10)); // Limit to first 10 statements
  }
  
  return statements;
}

function extractPrecautionaryStatements(text: string): string[] {
  const statements: string[] = [];
  const precautionaryRegex = /(?:precautionary statements?|p-statements?)[:\s]*(.*?)(?:\n\s*\n|section|$)/is;
  const match = text.match(precautionaryRegex);
  
  if (match && match[1]) {
    const precautionaryText = match[1];
    const lines = precautionaryText.split('\n').map(line => line.trim()).filter(line => line.length > 10);
    statements.push(...lines.slice(0, 10)); // Limit to first 10 statements
  }
  
  return statements;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { document_id, bucket_url }: ExtractionRequest = await req.json();
    
    console.log('🔍 Starting text extraction for document:', document_id);
    
    // Download PDF from storage
    const pdfResponse = await fetch(bucket_url);
    if (!pdfResponse.ok) {
      throw new Error(`Failed to download PDF: ${pdfResponse.status}`);
    }
    
    const pdfArrayBuffer = await pdfResponse.arrayBuffer();
    console.log('📄 PDF downloaded, size:', pdfArrayBuffer.byteLength);
    
    // For now, we'll use a simple text extraction approach
    // In production, you'd want to use a proper PDF parsing library
    const pdfText = new TextDecoder().decode(pdfArrayBuffer);
    
    // If the PDF is binary, we'll get mostly garbage text
    // Let's try to extract what we can or return a placeholder
    let extractedText = '';
    try {
      // Simple heuristic: if we have readable text content
      if (pdfText.includes('Section') || pdfText.includes('H3') || pdfText.includes('GHS')) {
        extractedText = pdfText;
      } else {
        // Fallback for binary PDFs - we'll extract basic info from filename/URL
        extractedText = `Safety Data Sheet - Text extraction pending\nDocument requires advanced PDF parsing`;
      }
    } catch (error) {
      console.warn('Text extraction fallback used:', error);
      extractedText = 'Text extraction pending - PDF requires processing';
    }
    
    console.log('📊 Extracted text length:', extractedText.length);
    
    // Extract all the required constants
    const hCodes = extractHCodes(extractedText);
    const pictograms = extractPictograms(hCodes);
    const signalWord = extractSignalWord(extractedText);
    const casNumber = extractCASNumber(extractedText);
    const documentType = classifyDocumentType(extractedText);
    const hazardStatements = extractHazardStatements(extractedText);
    const precautionaryStatements = extractPrecautionaryStatements(extractedText);
    
    console.log('✅ Extracted data:', {
      hCodes: hCodes.length,
      pictograms: pictograms.length,
      signalWord,
      documentType,
      casNumber
    });
    
    // Update the document in the database
    const { error: updateError } = await supabase
      .from('sds_documents')
      .update({
        full_text: extractedText,
        document_type: documentType,
        h_codes: hCodes,
        pictograms: pictograms,
        signal_word: signalWord,
        cas_number: casNumber,
        hazard_statements: hazardStatements,
        precautionary_statements: precautionaryStatements,
        regulatory_notes: [
          ...(extractedText.includes('Text extraction pending') ? ['Automatic text extraction pending'] : []),
          `Processed: ${new Date().toISOString()}`
        ]
      })
      .eq('id', document_id);
    
    if (updateError) {
      throw new Error(`Database update failed: ${updateError.message}`);
    }
    
    console.log('✅ Document updated successfully');
    
    return new Response(
      JSON.stringify({
        success: true,
        extracted_data: {
          h_codes: hCodes,
          pictograms: pictograms,
          signal_word: signalWord,
          cas_number: casNumber,
          document_type: documentType,
          text_length: extractedText.length
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Text extraction error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
