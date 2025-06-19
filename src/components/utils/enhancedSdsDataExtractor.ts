
export interface EnhancedSDSData {
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
    special?: string;
  };
  ppeRequirements?: string[];
  chemicalFormula?: string;
  chemicalCompound?: string;
  productId?: string;
  labelPrintDate?: string;
  extractionConfidence?: number;
  dataSource?: 'ai_enhanced' | 'basic_extraction' | 'manual';
}

export const extractEnhancedSDSData = (selectedDocument: any): EnhancedSDSData => {
  if (!selectedDocument) return {};

  // Check for AI-enhanced data first (highest priority)
  if (selectedDocument.ai_extracted_data && selectedDocument.ai_extraction_confidence > 50) {
    const aiData = selectedDocument.ai_extracted_data;
    
    // Map GHS pictograms from AI data
    const pictograms = (aiData.ghs_pictograms || []).map((p: any) => {
      // Map GHS codes to our pictogram IDs
      const codeMapping: Record<string, string> = {
        'GHS01': 'exploding_bomb',
        'GHS02': 'flame',
        'GHS03': 'flame_over_circle',
        'GHS04': 'gas_cylinder',
        'GHS05': 'corrosion',
        'GHS06': 'skull_crossbones',
        'GHS07': 'exclamation',
        'GHS08': 'health_hazard',
        'GHS09': 'environment'
      };
      
      return codeMapping[p.code] || p.name?.toLowerCase().replace(/\s+/g, '_') || 'exclamation';
    });

    // Fix hazardCodes type safety
    const hazardCodes = Array.isArray(selectedDocument.h_codes) 
      ? selectedDocument.h_codes.map((h: any) => typeof h === 'string' ? h : h?.code || String(h))
      : [];

    return {
      productName: aiData.product_title || selectedDocument.product_name,
      manufacturer: aiData.manufacturer || selectedDocument.manufacturer,
      casNumber: selectedDocument.cas_number,
      signalWord: selectedDocument.signal_word || 'WARNING',
      hazardCodes,
      pictograms: [...new Set(pictograms)], // Remove duplicates
      hmisRatings: {
        health: selectedDocument.hmis_codes?.health?.toString() || '2',
        flammability: selectedDocument.hmis_codes?.flammability?.toString() || '1',
        physical: selectedDocument.hmis_codes?.physical?.toString() || '0',
        special: selectedDocument.hmis_codes?.special || ''
      },
      ppeRequirements: Array.isArray(aiData.required_ppe) ? aiData.required_ppe.map(String) : [],
      chemicalFormula: aiData.chemical_formula || '',
      chemicalCompound: aiData.chemical_compound || '',
      productId: aiData.product_id || '',
      labelPrintDate: aiData.label_print_date || new Date().toISOString().split('T')[0],
      extractionConfidence: selectedDocument.ai_extraction_confidence || 0,
      dataSource: 'ai_enhanced'
    };
  }

  // Fallback to basic extraction (from original extractor)
  const productName = selectedDocument.product_name || '';
  const manufacturer = selectedDocument.manufacturer || '';
  const casNumber = selectedDocument.cas_number || '';
  const signalWord = selectedDocument.signal_word || 'WARNING';

  const hazardCodes = Array.isArray(selectedDocument.h_codes) 
    ? selectedDocument.h_codes.map((h: any) => typeof h === 'string' ? h : h?.code || String(h))
    : [];

  const sdsPrograms = Array.isArray(selectedDocument.pictograms) 
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

  const pictograms = sdsPrograms
    .map((code: string) => pictogramMapping[code] || code)
    .filter((id: string) => Object.values(pictogramMapping).includes(id));

  const hmisData = selectedDocument.hmis_codes || {};
  const hmisRatings = {
    health: hmisData.health?.toString() || '2',
    flammability: hmisData.flammability?.toString() || '1',
    physical: hmisData.physical?.toString() || '0',
    special: hmisData.special || ''
  };

  // Basic PPE extraction from precautionary statements
  const ppeRequirements: string[] = [];
  const precautionary = selectedDocument.precautionary_statements || [];
  
  precautionary.forEach((statement: string) => {
    if (statement.toLowerCase().includes('glove')) ppeRequirements.push('Safety Gloves');
    if (statement.toLowerCase().includes('goggle') || statement.toLowerCase().includes('eye protection')) ppeRequirements.push('Safety Goggles');
    if (statement.toLowerCase().includes('respirator') || statement.toLowerCase().includes('mask')) ppeRequirements.push('Respirator');
    if (statement.toLowerCase().includes('apron') || statement.toLowerCase().includes('protective clothing')) ppeRequirements.push('Protective Clothing');
  });

  return {
    productName,
    manufacturer,
    casNumber,
    signalWord,
    hazardCodes,
    pictograms,
    hmisRatings,
    ppeRequirements: [...new Set(ppeRequirements)],
    chemicalFormula: '',
    chemicalCompound: '',
    productId: '',
    labelPrintDate: new Date().toISOString().split('T')[0],
    extractionConfidence: selectedDocument.extraction_quality_score || 0,
    dataSource: 'basic_extraction'
  };
};
