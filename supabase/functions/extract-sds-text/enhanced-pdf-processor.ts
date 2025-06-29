
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
import { GHSSection2Parser } from './extractors/ghs-section2-parser.ts';
import { Section8PPEParser } from './extractors/section8-ppe-parser.ts';
import { GHSToHMISConverter } from './converters/ghs-to-hmis-converter.ts';
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

      // Phase 2: Extract GHS Section 2 Data (NEW - CRITICAL FOR HMIS)
      console.log('📋 Parsing GHS Section 2 hazard identification...');
      const ghsSection2Data = GHSSection2Parser.parse(cleanText);
      
      // Phase 3: Extract Section 8 PPE Requirements (NEW)
      console.log('🦺 Parsing Section 8 PPE requirements...');
      const ppeData = Section8PPEParser.parse(cleanText);
      
      // Phase 4: Convert GHS to HMIS (NEW - REPLACES HARDCODED DEFAULTS)
      console.log('🔄 Converting GHS data to HMIS codes...');
      const hmisResult = GHSToHMISConverter.convert(ghsSection2Data, ppeData.generalPPE.join(', '));
      
      // Update HMIS codes with calculated values
      data.hmis_codes = {
        health: hmisResult.health,
        flammability: hmisResult.flammability,
        physical: hmisResult.physical,
        special: hmisResult.ppe
      };
      
      // Add chronic hazard indicator
      if (hmisResult.hasChronicHazard) {
        data.hmis_codes.chronic_hazard = true;
      }
      
      // Log calculation details
      console.log('📊 HMIS Calculation Details:');
      hmisResult.calculationDetails.forEach(detail => console.log(`  - ${detail}`));
      
      confidence += hmisResult.confidence * 0.4; // HMIS confidence is 40% of total

      // Phase 5: Extract Manufacturer
      data.manufacturer = ManufacturerExtractor.extract(cleanText);
      if (data.manufacturer) confidence += 10;

      // Phase 6: Extract CAS Numbers
      data.cas_number = CASExtractor.extract(cleanText);
      if (data.cas_number) confidence += 15;

      // Phase 7: Extract Signal Word
      data.signal_word = SignalWordExtractor.extract(cleanText);
      if (data.signal_word) confidence += 10;

      // Phase 8: Extract H-Codes and Hazard Statements (Enhanced with GHS data)
      const hazardData = HazardExtractor.extract(cleanText);
      data.h_codes = hazardData.hCodes;
      data.hazard_statements = hazardData.statements;
      
      // Merge with GHS Section 2 hazard classes
      ghsSection2Data.hazardClasses.forEach(hazard => {
        const existingHCode = data.h_codes.find(h => h.code === hazard.code);
        if (!existingHCode) {
          data.h_codes.push({
            code: hazard.code,
            description: hazard.description
          });
          data.hazard_statements.push(hazard.description);
        }
      });
      
      if (data.h_codes.length > 0) confidence += 20;

      // Phase 9: Extract Precautionary Statements
      data.precautionary_statements = HazardExtractor.extractPrecautionaryStatements(cleanText);
      if (data.precautionary_statements.length > 0) confidence += 10;

      // Phase 10: Extract Pictograms
      data.pictograms = PictogramExtractor.extract(cleanText);
      if (data.pictograms.length > 0) confidence += 15;

      // Phase 11: Extract NFPA Codes (separate from HMIS)
      data.nfpa_codes = RatingCodesExtractor.extractNFPA(cleanText);
      if (Object.keys(data.nfpa_codes).length > 0) confidence += 5;

      // Phase 12: Extract Physical, Health, and Environmental Hazards (Enhanced)
      data.physical_hazards = HazardCategoriesExtractor.extractPhysicalHazards(cleanText);
      data.health_hazards = HazardCategoriesExtractor.extractHealthHazards(cleanText);
      data.environmental_hazards = HazardCategoriesExtractor.extractEnvironmentalHazards(cleanText);
      
      // Add GHS-derived hazards
      if (ghsSection2Data.physicalProperties.flashPoint !== undefined) {
        data.physical_hazards.push('flammable');
      }
      if (ghsSection2Data.isCarcinogenic) {
        data.health_hazards.push('carcinogenic');
      }
      if (ghsSection2Data.isMutagenic) {
        data.health_hazards.push('mutagenic');
      }

      // Phase 13: Extract First Aid Information (Enhanced with PPE)
      data.first_aid = FirstAidExtractor.extract(cleanText);
      
      // Add PPE requirements to first aid
      if (ppeData.generalPPE.length > 0) {
        data.first_aid.ppe_requirements = ppeData.generalPPE;
      }

      // Phase 14: Quality Assessment (Enhanced)
      data.extraction_quality_score = calculateExtractionQuality(data, cleanText.length);
      
      // Boost quality score if we have good GHS/HMIS data
      if (hmisResult.confidence > 70) {
        data.extraction_quality_score += 20;
      }
      
      data.is_readable = data.extraction_quality_score >= 30;

      // Phase 15: Add GHS-specific metadata
      data.ghs_section2_data = {
        hazard_classes: ghsSection2Data.hazardClasses,
        physical_properties: ghsSection2Data.physicalProperties,
        toxicity_data: ghsSection2Data.toxicityData,
        chronic_hazards: ghsSection2Data.chronicHazards
      };
      
      data.section8_ppe_data = {
        eye_protection: ppeData.eyeProtection,
        hand_protection: ppeData.handProtection,
        respiratory_protection: ppeData.respiratoryProtection,
        skin_protection: ppeData.skinProtection,
        hmis_ppe_code: ppeData.hmisCode
      };

      // Final confidence calculation
      confidence = Math.min(confidence, 100);

      console.log(`✅ Enhanced SDS processing completed with ${confidence}% confidence`);
      console.log(`📊 Quality score: ${data.extraction_quality_score}`);
      console.log(`🔬 HMIS Health: ${data.hmis_codes.health}, Flammability: ${data.hmis_codes.flammability}, Physical: ${data.hmis_codes.physical}, PPE: ${data.hmis_codes.special}`);

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
          hmis_codes: { health: 1, flammability: 1, physical: 0, special: 'X' }, // Conservative defaults
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
