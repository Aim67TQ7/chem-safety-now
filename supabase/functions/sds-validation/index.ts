
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  oshaCompliant: boolean;
  ghsCompliant: boolean;
}

interface ValidationRequest {
  document_id: string;
}

const REQUIRED_GHS_SECTIONS = [
  'Product Identification',
  'Hazard Identification', 
  'Composition/Information on Ingredients',
  'First-aid Measures',
  'Fire-fighting Measures',
  'Accidental Release Measures',
  'Handling and Storage',
  'Exposure Controls/Personal Protection',
  'Physical and Chemical Properties',
  'Stability and Reactivity',
  'Toxicological Information',
  'Ecological Information',
  'Disposal Considerations',
  'Transport Information',
  'Regulatory Information',
  'Other Information'
];

const HAZARD_CODE_DESCRIPTIONS: Record<string, string> = {
  'H200': 'Unstable explosive',
  'H201': 'Explosive; mass explosion hazard',
  'H202': 'Explosive; severe projection hazard',
  'H220': 'Extremely flammable gas',
  'H221': 'Flammable gas',
  'H224': 'Extremely flammable liquid and vapor',
  'H225': 'Highly flammable liquid and vapor',
  'H226': 'Flammable liquid and vapor',
  'H300': 'Fatal if swallowed',
  'H301': 'Toxic if swallowed',
  'H302': 'Harmful if swallowed',
  'H310': 'Fatal in contact with skin',
  'H311': 'Toxic in contact with skin',
  'H312': 'Harmful in contact with skin',
  'H314': 'Causes severe skin burns and eye damage',
  'H315': 'Causes skin irritation',
  'H318': 'Causes serious eye damage',
  'H319': 'Causes serious eye irritation',
  'H330': 'Fatal if inhaled',
  'H331': 'Toxic if inhaled',
  'H332': 'Harmful if inhaled',
  'H334': 'May cause allergy or asthma symptoms if inhaled',
  'H335': 'May cause respiratory irritation',
  'H336': 'May cause drowsiness or dizziness',
  'H340': 'May cause genetic defects',
  'H341': 'Suspected of causing genetic defects',
  'H350': 'May cause cancer',
  'H351': 'Suspected of causing cancer',
  'H360': 'May damage fertility or the unborn child',
  'H361': 'Suspected of damaging fertility or the unborn child',
  'H370': 'Causes damage to organs',
  'H371': 'May cause damage to organs',
  'H372': 'Causes damage to organs through prolonged or repeated exposure',
  'H373': 'May cause damage to organs through prolonged or repeated exposure',
  'H400': 'Very toxic to aquatic life',
  'H410': 'Very toxic to aquatic life with long lasting effects',
  'H411': 'Toxic to aquatic life with long lasting effects',
  'H412': 'Harmful to aquatic life with long lasting effects'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { document_id }: ValidationRequest = await req.json();
    
    console.log('🔍 Starting SDS validation for document:', document_id);

    // Get document details
    const { data: document, error: docError } = await supabase
      .from('sds_documents')
      .select('*')
      .eq('id', document_id)
      .single();

    if (docError || !document) {
      throw new Error('Document not found');
    }

    console.log('📄 Validating document:', document.product_name);

    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: [],
      oshaCompliant: false,
      ghsCompliant: false
    };

    // Validate core product information
    if (!document.product_name || document.product_name.trim().length < 3) {
      result.errors.push('Product name is missing or too short');
      result.isValid = false;
    }

    if (!document.manufacturer || document.manufacturer.trim().length < 3) {
      result.warnings.push('Manufacturer information is missing or incomplete');
    }

    // Validate CAS number format
    if (document.cas_number) {
      const casPattern = /^\d{2,7}-\d{2}-\d$/;
      if (!casPattern.test(document.cas_number)) {
        result.warnings.push('CAS number format appears invalid');
      }
    } else {
      result.warnings.push('CAS number is missing');
    }

    // Validate signal word
    if (!document.signal_word) {
      result.warnings.push('Signal word is missing');
    } else if (!['DANGER', 'WARNING'].includes(document.signal_word.toUpperCase())) {
      result.errors.push('Signal word must be either DANGER or WARNING');
      result.isValid = false;
    }

    // Validate hazard codes
    const hCodes = Array.isArray(document.h_codes) ? document.h_codes : [];
    if (hCodes.length === 0) {
      result.errors.push('No hazard codes (H-codes) found');
      result.isValid = false;
    } else {
      // Validate H-code format
      for (const hCode of hCodes) {
        const code = typeof hCode === 'string' ? hCode : hCode.code;
        if (code && !code.match(/^H\d{3}$/)) {
          result.warnings.push(`Invalid H-code format: ${code}`);
        }
      }
    }

    // Validate pictograms
    const pictograms = Array.isArray(document.pictograms) ? document.pictograms : [];
    if (pictograms.length === 0) {
      result.warnings.push('No GHS pictograms found');
    }

    // Validate HMIS codes
    const hmisData = document.hmis_codes || {};
    if (Object.keys(hmisData).length > 0) {
      ['health', 'flammability', 'physical'].forEach(category => {
        const value = hmisData[category];
        if (value !== undefined && (value < 0 || value > 4 || !Number.isInteger(value))) {
          result.errors.push(`Invalid HMIS ${category} rating: ${value} (must be 0-4)`);
          result.isValid = false;
        }
      });
    } else {
      result.warnings.push('HMIS codes are missing');
    }

    // Validate NFPA codes
    const nfpaData = document.nfpa_codes || {};
    if (Object.keys(nfpaData).length > 0) {
      ['health', 'flammability', 'reactivity'].forEach(category => {
        const value = nfpaData[category];
        if (value !== undefined && (value < 0 || value > 4 || !Number.isInteger(value))) {
          result.errors.push(`Invalid NFPA ${category} rating: ${value} (must be 0-4)`);
          result.isValid = false;
        }
      });
    }

    // Check for precautionary statements
    const precautionary = Array.isArray(document.precautionary_statements) ? document.precautionary_statements : [];
    if (precautionary.length === 0) {
      result.warnings.push('No precautionary statements found');
    }

    // Check for first aid information
    const firstAid = document.first_aid || {};
    if (Object.keys(firstAid).length === 0) {
      result.warnings.push('No first aid information found');
    }

    // Quality score assessment
    if (document.extraction_quality_score < 50) {
      result.warnings.push('Low extraction quality score - manual review recommended');
    }

    // OSHA compliance check
    const oshaRequiredFields = ['product_name', 'manufacturer', 'signal_word', 'h_codes', 'pictograms'];
    const missingOshaFields = oshaRequiredFields.filter(field => {
      const value = document[field];
      return !value || (Array.isArray(value) && value.length === 0);
    });

    result.oshaCompliant = missingOshaFields.length === 0 && result.errors.length === 0;
    if (!result.oshaCompliant) {
      result.suggestions.push('To meet OSHA compliance, ensure all required fields are populated with accurate data');
    }

    // GHS compliance check (simplified)
    result.ghsCompliant = result.oshaCompliant && 
                         hCodes.length > 0 && 
                         pictograms.length > 0 && 
                         document.signal_word;

    // Overall assessment
    if (result.errors.length === 0 && result.warnings.length <= 3) {
      result.suggestions.push('Document appears to be well-structured for label generation');
    }

    if (hCodes.length > 0 && pictograms.length === 0) {
      result.suggestions.push('Consider adding appropriate GHS pictograms to match the hazard codes');
    }

    console.log(`✅ SDS validation completed for ${document.product_name}`);
    console.log(`📊 Validation result: ${result.isValid ? 'VALID' : 'INVALID'}`);
    console.log(`🏥 OSHA Compliant: ${result.oshaCompliant}`);
    console.log(`🌍 GHS Compliant: ${result.ghsCompliant}`);

    return new Response(
      JSON.stringify({
        success: true,
        document_id,
        product_name: document.product_name,
        validation_result: result,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ SDS validation error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'SDS validation failed',
        details: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
