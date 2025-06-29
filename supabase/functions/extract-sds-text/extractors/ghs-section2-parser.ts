
export interface GHSHazardClass {
  code: string;
  category: number;
  description: string;
  section: string;
}

export interface PhysicalProperties {
  flashPoint?: number;
  flashPointUnit?: string;
  boilingPoint?: number;
  boilingPointUnit?: string;
  autoIgnitionTemp?: number;
  meltingPoint?: number;
}

export interface ToxicityData {
  ld50_oral?: number;
  ld50_dermal?: number;
  lc50_inhalation?: number;
  unit?: string;
  species?: string;
}

export interface GHSSection2Data {
  hazardClasses: GHSHazardClass[];
  physicalProperties: PhysicalProperties;
  toxicityData: ToxicityData;
  chronicHazards: string[];
  isCarcinogenic: boolean;
  isMutagenic: boolean;
  hasReproductiveToxicity: boolean;
  hasRespiratoryToxicity: boolean;
  hasSkinSensitizer: boolean;
}

export class GHSSection2Parser {
  private static readonly SECTION_2_PATTERNS = [
    /section\s*2[:\s]*hazard[\s\w]*identification/gi,
    /hazard[\s\w]*identification/gi
  ];

  private static readonly GHS_HAZARD_PATTERNS = [
    /H(\d{3})[:\s]*([^\n\r.]*)/gi,
    /GHS(\d{2})[:\s]*([^\n\r.]*)/gi
  ];

  private static readonly FLASH_POINT_PATTERNS = [
    /flash\s*point[:\s]*([<>≤≥]?\s*\d+(?:\.\d+)?)\s*°?\s*([CF])/gi,
    /f\.?p\.?[:\s]*([<>≤≥]?\s*\d+(?:\.\d+)?)\s*°?\s*([CF])/gi
  ];

  private static readonly BOILING_POINT_PATTERNS = [
    /boiling\s*point[:\s]*([<>≤≥]?\s*\d+(?:\.\d+)?)\s*°?\s*([CF])/gi,
    /b\.?p\.?[:\s]*([<>≤≥]?\s*\d+(?:\.\d+)?)\s*°?\s*([CF])/gi
  ];

  private static readonly LD50_PATTERNS = [
    /LD50?[:\s]*([<>≤≥]?\s*\d+(?:,\d+)?(?:\.\d+)?)\s*(mg\/kg|g\/kg|ppm)/gi,
    /oral\s*LD50?[:\s]*([<>≤≥]?\s*\d+(?:,\d+)?(?:\.\d+)?)\s*(mg\/kg|g\/kg)/gi
  ];

  private static readonly LC50_PATTERNS = [
    /LC50?[:\s]*([<>≤≥]?\s*\d+(?:,\d+)?(?:\.\d+)?)\s*(mg\/L|ppm|mg\/m³)/gi,
    /inhalation\s*LC50?[:\s]*([<>≤≥]?\s*\d+(?:,\d+)?(?:\.\d+)?)\s*(mg\/L|ppm|mg\/m³)/gi
  ];

  private static readonly CHRONIC_HAZARD_KEYWORDS = [
    'carcinogen', 'carcinogenic', 'cancer',
    'mutagen', 'mutagenic', 'genetic',
    'reproductive', 'fertility', 'teratogen',
    'respiratory sensitizer', 'asthma',
    'specific target organ toxicity'
  ];

  public static parse(text: string): GHSSection2Data {
    console.log('🔍 Parsing GHS Section 2 data...');
    
    const section2Text = this.extractSection2(text);
    
    return {
      hazardClasses: this.extractHazardClasses(section2Text),
      physicalProperties: this.extractPhysicalProperties(section2Text),
      toxicityData: this.extractToxicityData(section2Text),
      chronicHazards: this.extractChronicHazards(section2Text),
      isCarcinogenic: this.checkCarcinogenic(section2Text),
      isMutagenic: this.checkMutagenic(section2Text),
      hasReproductiveToxicity: this.checkReproductiveToxicity(section2Text),
      hasRespiratoryToxicity: this.checkRespiratoryToxicity(section2Text),
      hasSkinSensitizer: this.checkSkinSensitizer(section2Text)
    };
  }

  private static extractSection2(text: string): string {
    for (const pattern of this.SECTION_2_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        const startIndex = match.index || 0;
        // Extract next 3000 characters from section start
        const section = text.substring(startIndex, startIndex + 3000);
        
        // Try to find section 3 boundary
        const section3Match = section.match(/section\s*3[:\s]/gi);
        if (section3Match && section3Match.index) {
          return section.substring(0, section3Match.index);
        }
        
        return section;
      }
    }
    
    // Fallback: use first 2000 characters if no section found
    return text.substring(0, 2000);
  }

  private static extractHazardClasses(text: string): GHSHazardClass[] {
    const hazardClasses: GHSHazardClass[] = [];
    
    for (const pattern of this.GHS_HAZARD_PATTERNS) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const code = `H${match[1]}`;
        const description = match[2]?.trim() || '';
        
        if (description.length > 5) {
          hazardClasses.push({
            code,
            category: this.getHazardCategory(code),
            description,
            section: 'Section 2'
          });
        }
      }
    }
    
    return hazardClasses;
  }

  private static extractPhysicalProperties(text: string): PhysicalProperties {
    const props: PhysicalProperties = {};
    
    // Extract flash point
    for (const pattern of this.FLASH_POINT_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        const value = parseFloat(match[1].replace(/[<>≤≥,]/g, ''));
        const unit = match[2].toUpperCase();
        
        if (!isNaN(value)) {
          props.flashPoint = unit === 'C' ? this.celsiusToFahrenheit(value) : value;
          props.flashPointUnit = 'F';
          break;
        }
      }
    }
    
    // Extract boiling point
    for (const pattern of this.BOILING_POINT_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        const value = parseFloat(match[1].replace(/[<>≤≥,]/g, ''));
        const unit = match[2].toUpperCase();
        
        if (!isNaN(value)) {
          props.boilingPoint = unit === 'C' ? this.celsiusToFahrenheit(value) : value;
          props.boilingPointUnit = 'F';
          break;
        }
      }
    }
    
    return props;
  }

  private static extractToxicityData(text: string): ToxicityData {
    const toxicity: ToxicityData = {};
    
    // Extract LD50 values
    for (const pattern of this.LD50_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        const value = parseFloat(match[1].replace(/[<>≤≥,]/g, ''));
        const unit = match[2];
        
        if (!isNaN(value)) {
          toxicity.ld50_oral = value;
          toxicity.unit = unit;
          break;
        }
      }
    }
    
    // Extract LC50 values
    for (const pattern of this.LC50_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        const value = parseFloat(match[1].replace(/[<>≤≥,]/g, ''));
        const unit = match[2];
        
        if (!isNaN(value)) {
          toxicity.lc50_inhalation = value;
          toxicity.unit = unit;
          break;
        }
      }
    }
    
    return toxicity;
  }

  private static extractChronicHazards(text: string): string[] {
    const chronicHazards: string[] = [];
    const lowerText = text.toLowerCase();
    
    for (const keyword of this.CHRONIC_HAZARD_KEYWORDS) {
      if (lowerText.includes(keyword.toLowerCase())) {
        chronicHazards.push(keyword);
      }
    }
    
    return [...new Set(chronicHazards)];
  }

  private static checkCarcinogenic(text: string): boolean {
    const lowerText = text.toLowerCase();
    return lowerText.includes('carcinogen') || lowerText.includes('cancer') || lowerText.includes('h350') || lowerText.includes('h351');
  }

  private static checkMutagenic(text: string): boolean {
    const lowerText = text.toLowerCase();
    return lowerText.includes('mutagen') || lowerText.includes('genetic') || lowerText.includes('h340') || lowerText.includes('h341');
  }

  private static checkReproductiveToxicity(text: string): boolean {
    const lowerText = text.toLowerCase();
    return lowerText.includes('reproductive') || lowerText.includes('fertility') || lowerText.includes('h360') || lowerText.includes('h361');
  }

  private static checkRespiratoryToxicity(text: string): boolean {
    const lowerText = text.toLowerCase();
    return lowerText.includes('respiratory') || lowerText.includes('lung') || lowerText.includes('h334') || lowerText.includes('h372');
  }

  private static checkSkinSensitizer(text: string): boolean {
    const lowerText = text.toLowerCase();
    return lowerText.includes('skin sensitizer') || lowerText.includes('h317');
  }

  private static getHazardCategory(code: string): number {
    const codeNum = parseInt(code.substring(1));
    
    // Physical hazards (H200-H299)
    if (codeNum >= 200 && codeNum <= 299) return 1;
    
    // Health hazards (H300-H399)
    if (codeNum >= 300 && codeNum <= 399) {
      // Extract category from common patterns
      if (codeNum >= 300 && codeNum <= 310) return 1; // Acute toxicity Cat 1
      if (codeNum >= 311 && codeNum <= 320) return 2; // Acute toxicity Cat 2
      if (codeNum >= 321 && codeNum <= 330) return 3; // Acute toxicity Cat 3
      if (codeNum >= 331 && codeNum <= 340) return 4; // Acute toxicity Cat 4
      return 1;
    }
    
    // Environmental hazards (H400-H499)
    if (codeNum >= 400 && codeNum <= 499) return 1;
    
    return 1;
  }

  private static celsiusToFahrenheit(celsius: number): number {
    return (celsius * 9/5) + 32;
  }
}
