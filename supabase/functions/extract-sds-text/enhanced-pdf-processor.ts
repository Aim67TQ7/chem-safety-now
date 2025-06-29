
import { SDSExtractedData } from './types.ts';
import { calculateExtractionQuality } from './quality-scorer.ts';

export interface EnhancedExtractionResult {
  success: boolean;
  data: SDSExtractedData;
  confidence: number;
  warnings: string[];
  errors: string[];
}

export class EnhancedSDSProcessor {
  private static readonly CAS_PATTERNS = [
    /\b\d{2,7}-\d{2}-\d\b/g,
    /CAS[\s#]*:?\s*(\d{2,7}-\d{2}-\d)/gi,
    /CAS[\s]*No[\s]*:?\s*(\d{2,7}-\d{2}-\d)/gi
  ];

  private static readonly HMIS_PATTERNS = [
    /HMIS[\s]*:?\s*(\d)\s*[-\/]\s*(\d)\s*[-\/]\s*(\d)(?:\s*[-\/]\s*([A-KX]))?/gi,
    /Health[\s]*:?\s*(\d)[\s\S]*?Flammability[\s]*:?\s*(\d)[\s\S]*?Physical[\s]*:?\s*(\d)/gi,
    /H[\s]*:?\s*(\d)[\s]*F[\s]*:?\s*(\d)[\s]*P[\s]*:?\s*(\d)/gi
  ];

  private static readonly NFPA_PATTERNS = [
    /NFPA[\s]*:?\s*(\d)\s*[-\/]\s*(\d)\s*[-\/]\s*(\d)(?:\s*[-\/]\s*([A-Z]))?/gi,
    /Fire[\s]*:?\s*(\d)[\s\S]*?Health[\s]*:?\s*(\d)[\s\S]*?Reactivity[\s]*:?\s*(\d)/gi
  ];

  private static readonly SIGNAL_WORD_PATTERNS = [
    /Signal[\s]+Word[\s]*:?\s*(DANGER|WARNING)/gi,
    /\b(DANGER|WARNING)\b(?=[\s]*[^\w])/gi
  ];

  private static readonly PICTOGRAM_KEYWORDS = {
    'GHS01': ['exploding bomb', 'explosive', 'explosion'],
    'GHS02': ['flame', 'flammable', 'fire'],
    'GHS03': ['flame over circle', 'oxidizing', 'oxidizer'],
    'GHS04': ['gas cylinder', 'compressed gas', 'pressurized'],
    'GHS05': ['corrosion', 'corrosive', 'burns'],
    'GHS06': ['skull and crossbones', 'toxic', 'poison'],
    'GHS07': ['exclamation mark', 'irritant', 'harmful'],
    'GHS08': ['health hazard', 'carcinogen', 'mutagenic'],
    'GHS09': ['environment', 'aquatic toxicity', 'environmental']
  };

  public static async processSDSText(text: string, fileName: string): Promise<EnhancedExtractionResult> {
    console.log('🔍 Starting enhanced SDS processing for:', fileName);
    
    const warnings: string[] = [];
    const errors: string[] = [];
    let confidence = 0;

    try {
      // Clean and normalize text
      const cleanText = this.cleanText(text);
      
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
      const docType = this.detectDocumentType(cleanText);
      if (docType !== 'sds') {
        warnings.push(`Document may not be a standard SDS (detected: ${docType})`);
      }

      // Phase 2: Extract Manufacturer
      data.manufacturer = this.extractManufacturer(cleanText);
      if (data.manufacturer) confidence += 10;

      // Phase 3: Extract CAS Numbers
      data.cas_number = this.extractCASNumber(cleanText);
      if (data.cas_number) confidence += 15;

      // Phase 4: Extract Signal Word
      data.signal_word = this.extractSignalWord(cleanText);
      if (data.signal_word) confidence += 10;

      // Phase 5: Extract H-Codes and Hazard Statements
      const hazardData = this.extractHazardData(cleanText);
      data.h_codes = hazardData.hCodes;
      data.hazard_statements = hazardData.statements;
      if (data.h_codes.length > 0) confidence += 20;

      // Phase 6: Extract Precautionary Statements
      data.precautionary_statements = this.extractPrecautionaryStatements(cleanText);
      if (data.precautionary_statements.length > 0) confidence += 10;

      // Phase 7: Extract Pictograms
      data.pictograms = this.extractPictograms(cleanText);
      if (data.pictograms.length > 0) confidence += 15;

      // Phase 8: Extract HMIS Codes
      data.hmis_codes = this.extractHMISCodes(cleanText);
      if (Object.keys(data.hmis_codes).length > 0) confidence += 10;

      // Phase 9: Extract NFPA Codes
      data.nfpa_codes = this.extractNFPACodes(cleanText);
      if (Object.keys(data.nfpa_codes).length > 0) confidence += 5;

      // Phase 10: Extract Physical, Health, and Environmental Hazards
      data.physical_hazards = this.extractPhysicalHazards(cleanText);
      data.health_hazards = this.extractHealthHazards(cleanText);
      data.environmental_hazards = this.extractEnvironmentalHazards(cleanText);

      // Phase 11: Extract First Aid Information
      data.first_aid = this.extractFirstAid(cleanText);

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

  private static cleanText(text: string): string {
    return text
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
      .replace(/\s+/g, ' ')
      .replace(/[\uFFFD\uFEFF]/g, '')
      .trim()
      .normalize('NFD');
  }

  private static detectDocumentType(text: string): string {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('safety data sheet') || lowerText.includes('sds')) return 'sds';
    if (lowerText.includes('material safety data sheet') || lowerText.includes('msds')) return 'msds';
    if (lowerText.includes('product data sheet')) return 'pds';
    if (lowerText.includes('technical data sheet')) return 'tds';
    
    return 'unknown';
  }

  private static extractManufacturer(text: string): string | null {
    const patterns = [
      /(?:manufacturer|company|supplier)[\s]*:?\s*([^\n\r]{10,100})/gi,
      /(?:made by|manufactured by)[\s]*:?\s*([^\n\r]{10,100})/gi,
      /(?:distributor|distributed by)[\s]*:?\s*([^\n\r]{10,100})/gi
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim().replace(/[^\w\s&.,'()-]/g, '').substring(0, 100);
      }
    }
    return null;
  }

  private static extractCASNumber(text: string): string | null {
    for (const pattern of this.CAS_PATTERNS) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        // Return the first valid CAS number found
        return matches[0].replace(/CAS[\s#]*:?\s*/gi, '').trim();
      }
    }
    return null;
  }

  private static extractSignalWord(text: string): string | null {
    for (const pattern of this.SIGNAL_WORD_PATTERNS) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].toUpperCase();
      }
    }
    return null;
  }

  private static extractHazardData(text: string): { hCodes: Array<{ code: string; description: string }>, statements: string[] } {
    const hCodes: Array<{ code: string; description: string }> = [];
    const statements: string[] = [];

    // Extract H-codes with descriptions
    const hCodeMatches = text.match(/H\d{3}[:\s]*[^\n\r.]*[.\n\r]/gi) || [];
    
    for (const match of hCodeMatches) {
      const codeMatch = match.match(/H\d{3}/);
      if (codeMatch) {
        const code = codeMatch[0];
        const description = match.replace(/H\d{3}[:\s]*/, '').trim().replace(/[.\n\r]+$/, '');
        
        if (description.length > 10) {
          hCodes.push({ code, description });
          statements.push(description);
        }
      }
    }

    return { hCodes, statements };
  }

  private static extractPrecautionaryStatements(text: string): string[] {
    const statements: string[] = [];
    const pCodeMatches = text.match(/P\d{3}[:\s]*[^\n\r.]*[.\n\r]/gi) || [];
    
    for (const match of pCodeMatches) {
      const statement = match.replace(/P\d{3}[:\s]*/, '').trim().replace(/[.\n\r]+$/, '');
      if (statement.length > 10) {
        statements.push(statement);
      }
    }

    return statements.slice(0, 20); // Limit to prevent overflow
  }

  private static extractPictograms(text: string): Array<{ ghs_code: string; name: string; description?: string }> {
    const pictograms: Array<{ ghs_code: string; name: string; description?: string }> = [];
    const lowerText = text.toLowerCase();

    // Look for GHS codes directly
    const ghsMatches = text.match(/GHS0[1-9]/gi) || [];
    for (const match of ghsMatches) {
      const code = match.toUpperCase();
      pictograms.push({
        ghs_code: code,
        name: this.getGHSName(code),
        description: `${code} pictogram`
      });
    }

    // Look for pictogram keywords
    for (const [ghsCode, keywords] of Object.entries(this.PICTOGRAM_KEYWORDS)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
          const existing = pictograms.find(p => p.ghs_code === ghsCode);
          if (!existing) {
            pictograms.push({
              ghs_code: ghsCode,
              name: keyword,
              description: `${ghsCode} - ${keyword}`
            });
          }
        }
      }
    }

    return [...new Map(pictograms.map(p => [p.ghs_code, p])).values()];
  }

  private static getGHSName(code: string): string {
    const names: Record<string, string> = {
      'GHS01': 'exploding bomb',
      'GHS02': 'flame',
      'GHS03': 'flame over circle',
      'GHS04': 'gas cylinder',
      'GHS05': 'corrosion',
      'GHS06': 'skull and crossbones',
      'GHS07': 'exclamation mark',
      'GHS08': 'health hazard',
      'GHS09': 'environment'
    };
    return names[code] || code.toLowerCase();
  }

  private static extractHMISCodes(text: string): Record<string, number> {
    const hmis: Record<string, number> = {};

    for (const pattern of this.HMIS_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        if (match[1] && match[2] && match[3]) {
          hmis.health = parseInt(match[1]);
          hmis.flammability = parseInt(match[2]);
          hmis.physical = parseInt(match[3]);
          break;
        }
      }
    }

    return hmis;
  }

  private static extractNFPACodes(text: string): Record<string, number> {
    const nfpa: Record<string, number> = {};

    for (const pattern of this.NFPA_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        if (match[1] && match[2] && match[3]) {
          nfpa.health = parseInt(match[1]);
          nfpa.flammability = parseInt(match[2]);
          nfpa.reactivity = parseInt(match[3]);
          break;
        }
      }
    }

    return nfpa;
  }

  private static extractPhysicalHazards(text: string): string[] {
    const keywords = [
      'flammable', 'explosive', 'oxidizing', 'corrosive', 'irritant', 
      'compressed gas', 'self-heating', 'pyrophoric', 'organic peroxide'
    ];
    
    return keywords.filter(keyword => 
      text.toLowerCase().includes(keyword)
    );
  }

  private static extractHealthHazards(text: string): string[] {
    const keywords = [
      'toxic', 'carcinogenic', 'mutagenic', 'reproductive toxicity',
      'respiratory sensitizer', 'skin sensitizer', 'acute toxicity',
      'specific target organ toxicity'
    ];
    
    return keywords.filter(keyword => 
      text.toLowerCase().includes(keyword)
    );
  }

  private static extractEnvironmentalHazards(text: string): string[] {
    const keywords = [
      'hazardous to aquatic life', 'environmental hazard', 'ozone layer',
      'bioaccumulative', 'persistent', 'very toxic to aquatic life'
    ];
    
    return keywords.filter(keyword => 
      text.toLowerCase().includes(keyword)
    );
  }

  private static extractFirstAid(text: string): Record<string, string> {
    const firstAid: Record<string, string> = {};
    
    const sections = [
      { key: 'inhalation', patterns: [/first aid.*inhalation[:\s]*([^]*?)(?=\n\s*[a-z]|\n\s*\d+\.|$)/gi] },
      { key: 'skin', patterns: [/first aid.*skin[:\s]*([^]*?)(?=\n\s*[a-z]|\n\s*\d+\.|$)/gi] },
      { key: 'eyes', patterns: [/first aid.*eye[:\s]*([^]*?)(?=\n\s*[a-z]|\n\s*\d+\.|$)/gi] },
      { key: 'ingestion', patterns: [/first aid.*ingestion[:\s]*([^]*?)(?=\n\s*[a-z]|\n\s*\d+\.|$)/gi] }
    ];

    for (const section of sections) {
      for (const pattern of section.patterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          firstAid[section.key] = match[1].trim().substring(0, 500);
          break;
        }
      }
    }

    return firstAid;
  }
}
