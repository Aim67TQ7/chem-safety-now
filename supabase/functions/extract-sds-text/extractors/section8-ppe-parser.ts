
export interface PPERequirements {
  eyeProtection: string[];
  handProtection: string[];
  respiratoryProtection: string[];
  skinProtection: string[];
  generalPPE: string[];
  hmisCode: string;
}

export class Section8PPEParser {
  private static readonly SECTION_8_PATTERNS = [
    /section\s*8[:\s]*exposure[\s\w]*controls?\s*\/?\s*personal[\s\w]*protection/gi,
    /exposure[\s\w]*controls?\s*\/?\s*personal[\s\w]*protection/gi,
    /personal[\s\w]*protective[\s\w]*equipment/gi
  ];

  private static readonly EYE_PROTECTION_PATTERNS = [
    /eye[\s\w]*protection[:\s]*([^\n\r.]*)/gi,
    /safety\s*glasses?[:\s]*([^\n\r.]*)/gi,
    /goggles?[:\s]*([^\n\r.]*)/gi,
    /face\s*shield[:\s]*([^\n\r.]*)/gi
  ];

  private static readonly HAND_PROTECTION_PATTERNS = [
    /hand[\s\w]*protection[:\s]*([^\n\r.]*)/gi,
    /gloves?[:\s]*([^\n\r.]*)/gi,
    /protective\s*gloves?[:\s]*([^\n\r.]*)/gi
  ];

  private static readonly RESPIRATORY_PATTERNS = [
    /respiratory[\s\w]*protection[:\s]*([^\n\r.]*)/gi,
    /respirator[:\s]*([^\n\r.]*)/gi,
    /breathing[\s\w]*apparatus[:\s]*([^\n\r.]*)/gi,
    /dust\s*mask[:\s]*([^\n\r.]*)/gi
  ];

  private static readonly SKIN_PROTECTION_PATTERNS = [
    /skin[\s\w]*protection[:\s]*([^\n\r.]*)/gi,
    /protective\s*clothing[:\s]*([^\n\r.]*)/gi,
    /apron[:\s]*([^\n\r.]*)/gi,
    /coveralls?[:\s]*([^\n\r.]*)/gi
  ];

  public static parse(text: string): PPERequirements {
    console.log('🔍 Parsing Section 8 PPE requirements...');
    
    const section8Text = this.extractSection8(text);
    
    return {
      eyeProtection: this.extractEyeProtection(section8Text),
      handProtection: this.extractHandProtection(section8Text),
      respiratoryProtection: this.extractRespiratoryProtection(section8Text),
      skinProtection: this.extractSkinProtection(section8Text),
      generalPPE: this.extractGeneralPPE(section8Text),
      hmisCode: this.determineHMISPPECode(section8Text)
    };
  }

  private static extractSection8(text: string): string {
    for (const pattern of this.SECTION_8_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        const startIndex = match.index || 0;
        const section = text.substring(startIndex, startIndex + 2000);
        
        // Try to find section 9 boundary
        const section9Match = section.match(/section\s*9[:\s]/gi);
        if (section9Match && section9Match.index) {
          return section.substring(0, section9Match.index);
        }
        
        return section;
      }
    }
    
    return '';
  }

  private static extractEyeProtection(text: string): string[] {
    const protection: string[] = [];
    
    for (const pattern of this.EYE_PROTECTION_PATTERNS) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const requirement = match[1]?.trim();
        if (requirement && requirement.length > 3) {
          protection.push(requirement);
        }
      }
    }
    
    return [...new Set(protection)];
  }

  private static extractHandProtection(text: string): string[] {
    const protection: string[] = [];
    
    for (const pattern of this.HAND_PROTECTION_PATTERNS) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const requirement = match[1]?.trim();
        if (requirement && requirement.length > 3) {
          protection.push(requirement);
        }
      }
    }
    
    return [...new Set(protection)];
  }

  private static extractRespiratoryProtection(text: string): string[] {
    const protection: string[] = [];
    
    for (const pattern of this.RESPIRATORY_PATTERNS) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const requirement = match[1]?.trim();
        if (requirement && requirement.length > 3) {
          protection.push(requirement);
        }
      }
    }
    
    return [...new Set(protection)];
  }

  private static extractSkinProtection(text: string): string[] {
    const protection: string[] = [];
    
    for (const pattern of this.SKIN_PROTECTION_PATTERNS) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const requirement = match[1]?.trim();
        if (requirement && requirement.length > 3) {
          protection.push(requirement);
        }
      }
    }
    
    return [...new Set(protection)];
  }

  private static extractGeneralPPE(text: string): string[] {
    const ppe: string[] = [];
    const lowerText = text.toLowerCase();
    
    // Check for common PPE mentions
    const ppeKeywords = [
      'safety glasses', 'safety goggles', 'face shield',
      'protective gloves', 'chemical resistant gloves',
      'respirator', 'dust mask', 'vapor respirator',
      'protective clothing', 'apron', 'coveralls',
      'safety shoes', 'steel toe boots'
    ];
    
    for (const keyword of ppeKeywords) {
      if (lowerText.includes(keyword)) {
        ppe.push(keyword);
      }
    }
    
    return [...new Set(ppe)];
  }

  private static determineHMISPPECode(text: string): string {
    const lowerText = text.toLowerCase();
    
    // HMIS PPE Code mapping based on equipment combination
    const hasGlasses = lowerText.includes('safety glasses') || lowerText.includes('eye protection');
    const hasGoggles = lowerText.includes('goggles') || lowerText.includes('splash');
    const hasFaceShield = lowerText.includes('face shield');
    const hasGloves = lowerText.includes('gloves') || lowerText.includes('hand protection');
    const hasApron = lowerText.includes('apron') || lowerText.includes('protective clothing');
    const hasDustMask = lowerText.includes('dust mask') || lowerText.includes('particulate');
    const hasVaporResp = lowerText.includes('vapor') || lowerText.includes('respirator');
    const hasSuppliedAir = lowerText.includes('supplied air') || lowerText.includes('scba');
    const hasFullFace = lowerText.includes('full face');
    
    // Apply HMIS PPE code logic
    if (hasFullFace && hasGloves && hasApron && hasSuppliedAir) return 'K';
    if (hasGlasses && hasGloves && hasSuppliedAir) return 'J';
    if (hasFullFace && hasGloves && hasApron && hasVaporResp) return 'I';
    if (hasGoggles && hasGloves && hasApron && hasVaporResp) return 'H';
    if (hasGlasses && hasGloves && hasApron && hasVaporResp) return 'G';
    if (hasGlasses && hasApron && hasGloves && hasDustMask) return 'F';
    if (hasGlasses && hasGloves && hasDustMask) return 'E';
    if (hasFaceShield && hasApron && hasGloves) return 'D';
    if (hasGlasses && hasApron) return 'C';
    if (hasGlasses && hasGloves) return 'B';
    if (hasGlasses && !hasGloves) return 'A';
    
    // Default to X when requirements are unclear
    return 'X';
  }
}
