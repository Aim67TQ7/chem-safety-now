
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
  dataSource?: 'osha_compliant' | 'ai_enhanced' | 'basic_extraction' | 'manual';
  oshaCompliant?: boolean;
  requiresManualReview?: boolean;
}

export const extractEnhancedSDSData = (selectedDocument: any): EnhancedSDSData => {
  if (!selectedDocument) return {};

  console.log('🔍 Extracting enhanced SDS data for:', selectedDocument.product_name);
  console.log('📊 Document status:', selectedDocument.extraction_status);
  console.log('🤖 AI confidence:', selectedDocument.ai_extraction_confidence);

  // PRIORITY 1: OSHA-compliant data (highest priority for safety compliance)
  if (selectedDocument.extraction_status === 'osha_compliant' && 
      selectedDocument.ai_extracted_data && 
      selectedDocument.ai_extraction_confidence >= 98) {
    
    console.log('✅ Using OSHA-compliant data extraction');
    const oshaData = selectedDocument.ai_extracted_data;
    
    // Map GHS pictograms from OSHA data with comprehensive mapping
    const pictograms: string[] = [];
    if (Array.isArray(oshaData.ghs_pictograms)) {
      oshaData.ghs_pictograms.forEach((p: any) => {
        // Handle both GHS codes and descriptive names
        const ghsCodeMapping: Record<string, string> = {
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
        
        const nameMapping: Record<string, string> = {
          'flame': 'flame',
          'gas-cylinder': 'gas_cylinder',
          'gas cylinder': 'gas_cylinder',
          'skull-and-crossbones': 'skull_crossbones',
          'skull and crossbones': 'skull_crossbones',
          'exclamation-mark': 'exclamation',
          'exclamation mark': 'exclamation',
          'health-hazard': 'health_hazard',
          'health hazard': 'health_hazard',
          'corrosion': 'corrosion',
          'exploding-bomb': 'exploding_bomb',
          'exploding bomb': 'exploding_bomb',
          'flame-over-circle': 'flame_over_circle',
          'flame over circle': 'flame_over_circle',
          'environment': 'environment'
        };
        
        const pictogramName = p.name?.toLowerCase() || '';
        const pictogramCode = p.code || '';
        
        let mappedPictogram = ghsCodeMapping[pictogramCode] || 
                             nameMapping[pictogramName] || 
                             nameMapping[pictogramName.replace(/[-\s]+/g, '-')] ||
                             pictogramName.replace(/[-\s]+/g, '_') || 
                             'exclamation';
        
        console.log(`🎯 Mapping pictogram - Original: "${pictogramName}" (${pictogramCode}) → Mapped: "${mappedPictogram}"`);
        pictograms.push(mappedPictogram);
      });
    }

    // Extract HMIS ratings with fallbacks to ensure we always have values
    const hmisRatings = {
      health: selectedDocument.hmis_codes?.health?.toString() || 
               (oshaData.hmis?.health?.value?.toString()) || '2',
      flammability: selectedDocument.hmis_codes?.flammability?.toString() || 
                   (oshaData.hmis?.flammability?.value?.toString()) || '1',
      physical: selectedDocument.hmis_codes?.physical?.toString() || 
               (oshaData.hmis?.physical?.value?.toString()) || '0',
      special: selectedDocument.hmis_codes?.special || 
              (oshaData.hmis?.ppe?.value) || 'A'
    };

    console.log('🏥 OSHA HMIS ratings:', hmisRatings);

    return {
      productName: oshaData.product_identifier?.value || oshaData.product_title || selectedDocument.product_name,
      manufacturer: selectedDocument.manufacturer,
      casNumber: selectedDocument.cas_number,
      signalWord: oshaData.signal_word?.value || oshaData.signal_word || 'WARNING',
      hazardCodes: Array.isArray(oshaData.hazard_statements) ? 
        oshaData.hazard_statements.map((h: any) => typeof h === 'string' ? h : h.value) : [],
      pictograms: [...new Set(pictograms)], // Remove duplicates
      hmisRatings,
      ppeRequirements: Array.isArray(oshaData.precautionary_statements_critical) ? 
        oshaData.precautionary_statements_critical.map((p: any) => typeof p === 'string' ? p : p.value) :
        Array.isArray(oshaData.precautionary_statements) ? oshaData.precautionary_statements : [],
      chemicalFormula: '',
      chemicalCompound: oshaData.product_identifier?.value || oshaData.product_title || selectedDocument.product_name,
      productId: '',
      labelPrintDate: new Date().toISOString().split('T')[0],
      extractionConfidence: selectedDocument.ai_extraction_confidence || 0,
      dataSource: 'osha_compliant',
      oshaCompliant: true,
      requiresManualReview: false
    };
  }

  // PRIORITY 2: Manual review required (high confidence but needs verification)
  if (selectedDocument.extraction_status === 'manual_review_required') {
    console.log('⚠️ Using manual review data extraction');
    const reviewData = selectedDocument.ai_extracted_data;
    
    const pictograms: string[] = [];
    if (reviewData && Array.isArray(reviewData.ghs_pictograms)) {
      reviewData.ghs_pictograms.forEach((p: any) => {
        // Handle both GHS codes and descriptive names
        const ghsCodeMapping: Record<string, string> = {
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
        
        const nameMapping: Record<string, string> = {
          'flame': 'flame',
          'gas-cylinder': 'gas_cylinder',
          'gas cylinder': 'gas_cylinder',
          'skull-and-crossbones': 'skull_crossbones',
          'skull and crossbones': 'skull_crossbones',
          'exclamation-mark': 'exclamation',
          'exclamation mark': 'exclamation',
          'health-hazard': 'health_hazard',
          'health hazard': 'health_hazard',
          'corrosion': 'corrosion',
          'exploding-bomb': 'exploding_bomb',
          'exploding bomb': 'exploding_bomb',
          'flame-over-circle': 'flame_over_circle',
          'flame over circle': 'flame_over_circle',
          'environment': 'environment'
        };
        
        const pictogramName = p.name?.toLowerCase() || '';
        const pictogramCode = p.code || '';
        
        let mappedPictogram = ghsCodeMapping[pictogramCode] || 
                             nameMapping[pictogramName] || 
                             nameMapping[pictogramName.replace(/[-\s]+/g, '-')] ||
                             pictogramName.replace(/[-\s]+/g, '_') || 
                             'exclamation';
        
        console.log(`⚠️ Manual review - Mapping pictogram: "${pictogramName}" (${pictogramCode}) → "${mappedPictogram}"`);
        pictograms.push(mappedPictogram);
      });
    }

    // Ensure HMIS ratings are always present with safe defaults
    const hmisRatings = {
      health: selectedDocument.hmis_codes?.health?.toString() || '2',
      flammability: selectedDocument.hmis_codes?.flammability?.toString() || '1',
      physical: selectedDocument.hmis_codes?.physical?.toString() || '0',
      special: selectedDocument.hmis_codes?.special || 'A'
    };

    console.log('🔍 Manual review HMIS ratings:', hmisRatings);

    return {
      productName: reviewData?.product_identifier?.value || reviewData?.product_title || selectedDocument.product_name,
      manufacturer: selectedDocument.manufacturer,
      casNumber: selectedDocument.cas_number,
      signalWord: reviewData?.signal_word?.value || reviewData?.signal_word || 'WARNING',
      hazardCodes: Array.isArray(reviewData?.hazard_statements) ? 
        reviewData.hazard_statements.map((h: any) => typeof h === 'string' ? h : h.value) : [],
      pictograms: [...new Set(pictograms)],
      hmisRatings,
      ppeRequirements: Array.isArray(reviewData?.precautionary_statements_critical) ? 
        reviewData.precautionary_statements_critical.map((p: any) => typeof p === 'string' ? p : p.value) :
        Array.isArray(reviewData?.precautionary_statements) ? reviewData.precautionary_statements : [],
      chemicalFormula: '',
      chemicalCompound: reviewData?.product_identifier?.value || reviewData?.product_title || selectedDocument.product_name,
      productId: '',
      labelPrintDate: new Date().toISOString().split('T')[0],
      extractionConfidence: selectedDocument.ai_extraction_confidence || 0,
      dataSource: 'ai_enhanced',
      oshaCompliant: false,
      requiresManualReview: true
    };
  }

  // PRIORITY 3: High-confidence AI extraction
  if (selectedDocument.ai_extracted_data && selectedDocument.ai_extraction_confidence >= 80) {
    console.log('🤖 Using high-confidence AI extraction');
    const aiData = selectedDocument.ai_extracted_data;
    
    // Map GHS pictograms from AI data with comprehensive mapping
    const pictograms: string[] = [];
    if (Array.isArray(aiData.ghs_pictograms)) {
      aiData.ghs_pictograms.forEach((p: any) => {
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
        
        const nameMapping: Record<string, string> = {
          'flame': 'flame',
          'gas-cylinder': 'gas_cylinder',
          'gas cylinder': 'gas_cylinder',
          'skull-and-crossbones': 'skull_crossbones',
          'skull and crossbones': 'skull_crossbones',
          'exclamation-mark': 'exclamation',
          'exclamation mark': 'exclamation',
          'health-hazard': 'health_hazard',
          'health hazard': 'health_hazard',
          'corrosion': 'corrosion',
          'exploding-bomb': 'exploding_bomb',
          'exploding bomb': 'exploding_bomb',
          'flame-over-circle': 'flame_over_circle',
          'flame over circle': 'flame_over_circle',
          'environment': 'environment'
        };
        
        const pictogramName = p.name?.toLowerCase() || '';
        const pictogramCode = p.code || '';
        
        let mappedPictogram = codeMapping[pictogramCode] || 
                             nameMapping[pictogramName] || 
                             nameMapping[pictogramName.replace(/[-\s]+/g, '-')] ||
                             pictogramName.replace(/[-\s]+/g, '_') || 
                             'exclamation';
        
        console.log(`🤖 AI data - Mapping pictogram: "${pictogramName}" (${pictogramCode}) → "${mappedPictogram}"`);
        pictograms.push(mappedPictogram);
      });
    }

    // Extract hazard codes with proper handling
    const hazardCodes: string[] = [];
    if (Array.isArray(selectedDocument.h_codes)) {
      selectedDocument.h_codes.forEach((h: any) => {
        const code = typeof h === 'string' ? h : (h?.code || String(h));
        hazardCodes.push(code);
      });
    }

    // HMIS ratings with safe defaults
    const hmisRatings = {
      health: selectedDocument.hmis_codes?.health?.toString() || '2',
      flammability: selectedDocument.hmis_codes?.flammability?.toString() || '1',
      physical: selectedDocument.hmis_codes?.physical?.toString() || '0',
      special: selectedDocument.hmis_codes?.special || 'A'
    };

    console.log('🎯 AI-enhanced HMIS ratings:', hmisRatings);

    return {
      productName: aiData.product_title || selectedDocument.product_name,
      manufacturer: aiData.manufacturer || selectedDocument.manufacturer,
      casNumber: selectedDocument.cas_number,
      signalWord: selectedDocument.signal_word || 'WARNING',
      hazardCodes,
      pictograms: [...new Set(pictograms)],
      hmisRatings,
      ppeRequirements: Array.isArray(aiData.required_ppe) ? aiData.required_ppe.map(String) : [],
      chemicalFormula: aiData.chemical_formula || '',
      chemicalCompound: aiData.chemical_compound || '',
      productId: aiData.product_id || '',
      labelPrintDate: aiData.label_print_date || new Date().toISOString().split('T')[0],
      extractionConfidence: selectedDocument.ai_extraction_confidence || 0,
      dataSource: 'ai_enhanced',
      oshaCompliant: false,
      requiresManualReview: false
    };
  }

  // PRIORITY 4: Basic extraction fallback
  console.log('📋 Using basic extraction fallback');
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

  // HMIS ratings with conservative defaults for safety
  const hmisData = selectedDocument.hmis_codes || {};
  const hmisRatings = {
    health: hmisData.health?.toString() || '2', // Default to moderate health hazard
    flammability: hmisData.flammability?.toString() || '1', // Default to slight fire hazard  
    physical: hmisData.physical?.toString() || '0', // Default to minimal physical hazard
    special: hmisData.special || 'A' // Default to standard PPE
  };

  console.log('🔧 Basic extraction HMIS ratings:', hmisRatings);

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
    dataSource: 'basic_extraction',
    oshaCompliant: false,
    requiresManualReview: false
  };
};
