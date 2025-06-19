
import { SDSExtractedData } from './types.ts';
import { calculateExtractionQuality } from './quality-scorer.ts';

export function extractSDSData(text: string): SDSExtractedData {
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
