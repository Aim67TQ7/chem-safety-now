
export interface ExtractRequest {
  document_id: string;
  bucket_url?: string;
}

export interface SDSExtractedData {
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
  first_aid?: Record<string, any>;
  nfpa_codes?: Record<string, number>;
  hmis_codes?: Record<string, any>;
  full_text?: string;
  extraction_quality_score?: number;
  is_readable?: boolean;
  
  // New GHS-specific data structures
  ghs_section2_data?: {
    hazard_classes: Array<{ code: string; category: number; description: string; section: string }>;
    physical_properties: {
      flashPoint?: number;
      flashPointUnit?: string;
      boilingPoint?: number;
      boilingPointUnit?: string;
      autoIgnitionTemp?: number;
      meltingPoint?: number;
    };
    toxicity_data: {
      ld50_oral?: number;
      ld50_dermal?: number;
      lc50_inhalation?: number;
      unit?: string;
      species?: string;
    };
    chronic_hazards: string[];
  };
  
  section8_ppe_data?: {
    eye_protection: string[];
    hand_protection: string[];
    respiratory_protection: string[];
    skin_protection: string[];
    hmis_ppe_code: string;
  };
  
  regulatory_notes?: string[];
}
