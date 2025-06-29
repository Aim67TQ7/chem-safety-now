
import { SDSExtractedData } from './types.ts';
import { calculateExtractionQuality } from './quality-scorer.ts';
import { ManufacturerExtractor } from './extractors/manufacturer-extractor.ts';
import { CASExtractor } from './extractors/cas-extractor.ts';
import { SignalWordExtractor } from './extractors/signal-word-extractor.ts';
import { HazardExtractor } from './extractors/hazard-extractor.ts';
import { PictogramExtractor } from './extractors/pictogram-extractor.ts';
import { RatingCodesExtractor } from './extractors/rating-codes-extractor.ts';
import { HazardCategoriesExtractor } from './extractors/hazard-categories-extractor.ts';
import { FirstAidExtractor } from './extractors/first-aid-extractor.ts';
import { TextCleaner } from './utils/text-cleaner.ts';
import { DocumentClassifier } from './utils/document-classifier.ts';

export interface EnhancedExtractionResult {
  success: boolean;
  data: SDSExtractedData;
  confidence: number;
  warnings: string[];
  errors: string[];
}

export class EnhancedSDSProcessor {
  public static async processSDSText(text: string, fileName: string): Promise<EnhancedExtractionResult> {
    console.log('🔍 Starting enhanced SDS processing for:', fileName);
    
    const warnings: string[] = [];
    const errors: string[] = [];
    let confidence = 0;

    try {
      // Clean and normalize text
      const cleanText = TextCleaner.clean(text);
      
      // Initialize extraction result
      const data: SDSExtractedData = {
        full_text: cleanText.substring(0, 50000),
        extraction_quality_score: 0,
        is_readable: true,
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

      // Phase 1: Document Type Detection
      const docType = DocumentClassifier.detectType(cleanText);
      if (docType !== 'sds') {
        warnings.push(`Document may not be a standard SDS (detected: ${docType})`);
      }

      // Phase 2: Extract Manufacturer
      data.manufacturer = ManufacturerExtractor.extract(cleanText);
      if (data.manufacturer) confidence += 10;

      // Phase 3: Extract CAS Numbers
      data.cas_number = CASExtractor.extract(cleanText);
      if (data.cas_number) confidence += 15;

      // Phase 4: Extract Signal Word
      data.signal_word = SignalWordExtractor.extract(cleanText);
      if (data.signal_word) confidence += 10;

      // Phase 5: Extract H-Codes and Hazard Statements
      const hazardData = HazardExtractor.extract(cleanText);
      data.h_codes = hazardData.hCodes;
      data.hazard_statements = hazardData.statements;
      if (data.h_codes.length > 0) confidence += 20;

      // Phase 6: Extract Precautionary Statements
      data.precautionary_statements = HazardExtractor.extractPrecautionaryStatements(cleanText);
      if (data.precautionary_statements.length > 0) confidence += 10;

      // Phase 7: Extract Pictograms
      data.pictograms = PictogramExtractor.extract(cleanText);
      if (data.pictograms.length > 0) confidence += 15;

      // Phase 8: Extract HMIS Codes
      data.hmis_codes = RatingCodesExtractor.extractHMIS(cleanText);
      if (Object.keys(data.hmis_codes).length > 0) confidence += 10;

      // Phase 9: Extract NFPA Codes
      data.nfpa_codes = RatingCodesExtractor.extractNFPA(cleanText);
      if (Object.keys(data.nfpa_codes).length > 0) confidence += 5;

      // Phase 10: Extract Physical, Health, and Environmental Hazards
      data.physical_hazards = HazardCategoriesExtractor.extractPhysicalHazards(cleanText);
      data.health_hazards = HazardCategoriesExtractor.extractHealthHazards(cleanText);
      data.environmental_hazards = HazardCategoriesExtractor.extractEnvironmentalHazards(cleanText);

      // Phase 11: Extract First Aid Information
      data.first_aid = FirstAidExtractor.extract(cleanText);

      // Phase 12: Quality Assessment
      data.extraction_quality_score = calculateExtractionQuality(data, cleanText.length);
      data.is_readable = data.extraction_quality_score >= 30;

      // Final confidence calculation
      confidence = Math.min(confidence, 100);

      console.log(`✅ Enhanced SDS processing completed with ${confidence}% confidence`);
      console.log(`📊 Quality score: ${data.extraction_quality_score}`);

      return {
        success: true,
        data,
        confidence,
        warnings,
        errors
      };

    } catch (error) {
      console.error('❌ Enhanced SDS processing failed:', error);
      errors.push(`Processing failed: ${error.message}`);
      
      return {
        success: false,
        data: {
          full_text: text.substring(0, 50000),
          extraction_quality_score: 5,
          is_readable: false,
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
        },
        confidence: 0,
        warnings,
        errors
      };
    }
  }
}
