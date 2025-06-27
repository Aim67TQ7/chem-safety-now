
import { PDFExtract } from 'https://esm.sh/pdf.js-extract@0.2.1';

export async function downloadAndExtractPDF(url: string) {
  console.log('📥 Downloading PDF for extraction:', url);
  
  try {
    // Download the PDF
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SDS-Extractor/1.0)',
        'Accept': 'application/pdf,*/*'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to download PDF: ${response.status}`);
    }

    const pdfBuffer = await response.arrayBuffer();
    console.log('📊 PDF size:', pdfBuffer.byteLength, 'bytes');

    if (pdfBuffer.byteLength === 0) {
      throw new Error('Downloaded PDF is empty');
    }

    // Extract text from PDF
    console.log('🔍 Extracting SDS data from text...');
    const pdfExtract = new PDFExtract();
    const extractionResult = await pdfExtract.extractBuffer(new Uint8Array(pdfBuffer));
    
    // Combine all text from all pages
    let fullText = '';
    if (extractionResult.pages && extractionResult.pages.length > 0) {
      fullText = extractionResult.pages
        .map(page => page.content.map(item => item.str).join(' '))
        .join('\n');
    }

    // Clean the text to remove null bytes and other problematic characters
    fullText = cleanExtractedText(fullText);
    
    if (!fullText || fullText.trim().length < 100) {
      console.log('⚠️ Insufficient text extracted, using fallback extraction');
      // Fallback: try simple text extraction
      fullText = await fallbackTextExtraction(pdfBuffer);
      fullText = cleanExtractedText(fullText);
    }

    console.log('📝 Extracted text length:', fullText.length);

    // Extract SDS-specific data from the text
    const extractedData = await extractSDSData(fullText);

    console.log('✅ Extracted SDS data with quality score:', extractedData.extraction_quality_score);
    
    return extractedData;

  } catch (error) {
    console.error('❌ PDF extraction error:', error);
    throw new Error(`PDF extraction failed: ${error.message}`);
  }
}

function cleanExtractedText(text: string): string {
  if (!text) return '';
  
  return text
    // Remove null bytes and other control characters except newlines and tabs
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    // Replace multiple whitespace with single space
    .replace(/\s+/g, ' ')
    // Remove any remaining problematic Unicode characters
    .replace(/[\uFFFD\uFEFF]/g, '')
    // Trim and normalize
    .trim()
    // Ensure it's valid UTF-8
    .normalize('NFD');
}

async function fallbackTextExtraction(pdfBuffer: ArrayBuffer): Promise<string> {
  try {
    // Simple text extraction fallback
    const text = new TextDecoder('utf-8', { fatal: false }).decode(pdfBuffer);
    return text || '';
  } catch (error) {
    console.error('❌ Fallback extraction failed:', error);
    return '';
  }
}

async function extractSDSData(fullText: string) {
  const text = fullText.toLowerCase();
  
  // Initialize extraction result
  const result: any = {
    full_text: fullText.substring(0, 50000), // Limit text size for storage
    extraction_quality_score: 20, // Base score
    is_readable: fullText.length > 100,
    h_codes: [],
    pictograms: [],
    hazard_statements: [],
    precautionary_statements: [],
    physical_hazards: [],
    health_hazards: [],
    environmental_hazards: [],
    hmis_codes: {},
    nfpa_codes: {},
    signal_word: null,
    cas_number: null,
    first_aid: {},
    regulatory_notes: []
  };

  // Check if it's actually an SDS document
  const sdsIndicators = [
    'safety data sheet',
    'material safety data sheet',
    'msds',
    'sds',
    'hazard identification',
    'composition/information on ingredients'
  ];
  
  const hasSdsIndicators = sdsIndicators.some(indicator => text.includes(indicator));
  if (!hasSdsIndicators) {
    result.extraction_quality_score = 5;
    return result;
  }

  // Extract H-codes (Hazard codes)
  const hCodeMatches = fullText.match(/H\d{3}/g) || [];
  result.h_codes = [...new Set(hCodeMatches)].map(code => ({
    code: code,
    description: getHazardDescription(code)
  }));

  // Extract signal word
  const signalWordMatch = text.match(/signal word[:\s]*(danger|warning)/i);
  if (signalWordMatch) {
    result.signal_word = signalWordMatch[1].toUpperCase();
    result.extraction_quality_score += 10;
  }

  // Extract CAS number
  const casMatch = fullText.match(/\b\d{2,7}-\d{2}-\d\b/);
  if (casMatch) {
    result.cas_number = casMatch[0];
    result.extraction_quality_score += 15;
  }

  // Extract pictograms
  const pictogramKeywords = [
    'skull and crossbones', 'flame', 'exclamation mark', 'gas cylinder',
    'corrosion', 'exploding bomb', 'flame over circle', 'health hazard',
    'environment'
  ];
  
  pictogramKeywords.forEach(keyword => {
    if (text.includes(keyword)) {
      result.pictograms.push({
        ghs_code: keyword.replace(/\s+/g, '_'),
        name: keyword
      });
    }
  });

  // Extract hazard statements
  const hazardStatements = fullText.match(/H\d{3}[:\s]*[^.]+\./g) || [];
  result.hazard_statements = hazardStatements.slice(0, 10);

  // Extract precautionary statements
  const precautionaryStatements = fullText.match(/P\d{3}[:\s]*[^.]+\./g) || [];
  result.precautionary_statements = precautionaryStatements.slice(0, 10);

  // Calculate final quality score
  if (result.h_codes.length > 0) result.extraction_quality_score += 20;
  if (result.pictograms.length > 0) result.extraction_quality_score += 15;
  if (result.hazard_statements.length > 0) result.extraction_quality_score += 10;
  if (result.precautionary_statements.length > 0) result.extraction_quality_score += 10;
  
  // Cap at 100
  result.extraction_quality_score = Math.min(100, result.extraction_quality_score);

  return result;
}

function getHazardDescription(code: string): string {
  const hazardCodes: Record<string, string> = {
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
    'H224': 'Extremely flammable liquid and vapor',
    'H225': 'Highly flammable liquid and vapor',
    'H226': 'Flammable liquid and vapor',
    'H228': 'Flammable solid',
    'H240': 'Heating may cause an explosion',
    'H241': 'Heating may cause a fire or explosion',
    'H242': 'Heating may cause a fire',
    'H250': 'Catches fire spontaneously if exposed to air',
    'H251': 'Self-heating; may catch fire',
    'H252': 'Self-heating in large quantities; may catch fire',
    'H260': 'In contact with water releases flammable gases',
    'H261': 'In contact with water releases flammable gases',
    'H270': 'May cause or intensify fire; oxidizer',
    'H271': 'May cause fire or explosion; strong oxidizer',
    'H272': 'May intensify fire; oxidizer',
    'H280': 'Contains gas under pressure; may explode if heated',
    'H281': 'Contains refrigerated gas; may cause cryogenic burns',
    'H290': 'May be corrosive to metals',
    'H300': 'Fatal if swallowed',
    'H301': 'Toxic if swallowed',
    'H302': 'Harmful if swallowed',
    'H303': 'May be harmful if swallowed',
    'H304': 'May be fatal if swallowed and enters airways',
    'H305': 'May be harmful if swallowed and enters airways',
    'H310': 'Fatal in contact with skin',
    'H311': 'Toxic in contact with skin',
    'H312': 'Harmful in contact with skin',
    'H313': 'May be harmful in contact with skin',
    'H314': 'Causes severe skin burns and eye damage',
    'H315': 'Causes skin irritation',
    'H316': 'Causes mild skin irritation',
    'H317': 'May cause an allergic skin reaction',
    'H318': 'Causes serious eye damage',
    'H319': 'Causes serious eye irritation',
    'H320': 'Causes eye irritation',
    'H330': 'Fatal if inhaled',
    'H331': 'Toxic if inhaled',
    'H332': 'Harmful if inhaled',
    'H333': 'May be harmful if inhaled',
    'H334': 'May cause allergy or asthma symptoms if inhaled',
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
  
  return hazardCodes[code] || 'Unknown hazard code';
}
