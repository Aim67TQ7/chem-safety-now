
import { SDSExtractedData } from './types.ts';

export function calculateExtractionQuality(extractedData: SDSExtractedData, textLength: number): number {
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
