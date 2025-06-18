
export interface SDSData {
  productName?: string;
  manufacturer?: string;
  casNumber?: string;
  signalWord?: string;
  hazardCodes?: string[];
  pictograms?: string[];
  hmisRatings?: {
    health?: string;
    flammability?: string;
    physical?: string;
  };
  ppeRequirements?: string[];
  chemicalFormula?: string;
}

export const extractSDSData = (selectedDocument: any): SDSData => {
  if (!selectedDocument) return {};

  // Extract basic product info
  const productName = selectedDocument.product_name || '';
  const manufacturer = selectedDocument.manufacturer || '';
  const casNumber = selectedDocument.cas_number || '';
  const signalWord = selectedDocument.signal_word || 'WARNING';

  // Extract hazard codes
  const hazardCodes = Array.isArray(selectedDocument.h_codes) 
    ? selectedDocument.h_codes 
    : [];

  // Extract pictograms - map SDS pictogram codes to our pictogram IDs
  const sdsPrograams = Array.isArray(selectedDocument.pictograms) 
    ? selectedDocument.pictograms 
    : [];
  
  const pictogramMapping: Record<string, string> = {
    'skull_crossbones': 'skull_crossbones',
    'flame': 'flame',
    'flame_over_circle': 'flame_over_circle',
    'exclamation': 'exclamation',
    'health_hazard': 'health_hazard',
    'gas_cylinder': 'gas_cylinder',
    'corrosion': 'corrosion',
    'exploding_bomb': 'exploding_bomb',
    'environment': 'environment'
  };

  const pictograms = sdsPrograams
    .map((code: string) => pictogramMapping[code] || code)
    .filter((id: string) => Object.values(pictogramMapping).includes(id));

  // Extract HMIS ratings
  const hmisData = selectedDocument.hmis_codes || {};
  const hmisRatings = {
    health: hmisData.health?.toString() || '2',
    flammability: hmisData.flammability?.toString() || '3',
    physical: hmisData.physical?.toString() || '0'
  };

  // Extract PPE requirements from precautionary statements and first aid
  const ppeRequirements: string[] = [];
  const precautionary = selectedDocument.precautionary_statements || [];
  const firstAid = selectedDocument.first_aid || {};

  // Parse PPE from precautionary statements
  precautionary.forEach((statement: string) => {
    if (statement.toLowerCase().includes('glove')) ppeRequirements.push('Safety Gloves');
    if (statement.toLowerCase().includes('goggle') || statement.toLowerCase().includes('eye protection')) ppeRequirements.push('Safety Goggles');
    if (statement.toLowerCase().includes('respirator') || statement.toLowerCase().includes('mask')) ppeRequirements.push('Respirator');
    if (statement.toLowerCase().includes('apron') || statement.toLowerCase().includes('protective clothing')) ppeRequirements.push('Protective Clothing');
  });

  // Try to extract chemical formula from full text (simple regex)
  let chemicalFormula = '';
  const fullText = selectedDocument.full_text || '';
  const formulaMatch = fullText.match(/\b[A-Z][a-z]?[0-9]*(?:[A-Z][a-z]?[0-9]*)*\b/);
  if (formulaMatch && formulaMatch[0].length < 20) {
    chemicalFormula = formulaMatch[0];
  }

  return {
    productName,
    manufacturer,
    casNumber,
    signalWord,
    hazardCodes,
    pictograms,
    hmisRatings,
    ppeRequirements: [...new Set(ppeRequirements)], // Remove duplicates
    chemicalFormula
  };
};
