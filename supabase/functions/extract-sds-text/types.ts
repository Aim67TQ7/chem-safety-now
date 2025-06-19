
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
  first_aid?: Record<string, string>;
  nfpa_codes?: Record<string, number>;
  hmis_codes?: Record<string, number>;
  full_text?: string;
  extraction_quality_score?: number;
  is_readable?: boolean;
}
