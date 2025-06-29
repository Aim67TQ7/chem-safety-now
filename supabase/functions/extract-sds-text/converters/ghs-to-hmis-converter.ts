
import { GHSSection2Data, ToxicityData, PhysicalProperties } from '../extractors/ghs-section2-parser.ts';

export interface HMISCodes {
  health: number;
  flammability: number;
  physical: number;
  ppe: string;
  hasChronicHazard: boolean;
  confidence: number;
  calculationDetails: string[];
}

export class GHSToHMISConverter {
  
  public static convert(ghsData: GHSSection2Data, ppeFromSection8?: string): HMISCodes {
    console.log('🔄 Converting GHS data to HMIS codes...');
    
    const calculationDetails: string[] = [];
    
    const health = this.calculateHealthRating(ghsData, calculationDetails);
    const flammability = this.calculateFlammabilityRating(ghsData, calculationDetails);
    const physical = this.calculatePhysicalRating(ghsData, calculationDetails);
    const hasChronicHazard = this.hasChronicHazards(ghsData);
    const ppe = this.determinePPE(ppeFromSection8, ghsData);
    
    const confidence = this.calculateConfidence(ghsData, health, flammability, physical);
    
    return {
      health,
      flammability,
      physical,
      ppe,
      hasChronicHazard,
      confidence,
      calculationDetails
    };
  }

  private static calculateHealthRating(ghsData: GHSSection2Data, details: string[]): number {
    let maxRating = 0;
    
    // Check acute toxicity based on LD50/LC50 values
    if (ghsData.toxicityData.ld50_oral) {
      const ld50 = ghsData.toxicityData.ld50_oral;
      let rating = 0;
      
      if (ld50 < 5) {
        rating = 4;
        details.push(`Health H4: LD50 ${ld50} mg/kg < 5 mg/kg (Category 1)`);
      } else if (ld50 <= 50) {
        rating = 3;
        details.push(`Health H3: LD50 ${ld50} mg/kg ≤ 50 mg/kg (Category 2)`);
      } else if (ld50 <= 300) {
        rating = 2;
        details.push(`Health H2: LD50 ${ld50} mg/kg ≤ 300 mg/kg (Category 3)`);
      } else if (ld50 <= 2000) {
        rating = 1;
        details.push(`Health H1: LD50 ${ld50} mg/kg ≤ 2000 mg/kg (Category 4)`);
      } else {
        rating = 0;
        details.push(`Health H0: LD50 ${ld50} mg/kg > 2000 mg/kg (Category 5 or Not classified)`);
      }
      
      maxRating = Math.max(maxRating, rating);
    }
    
    // Check for specific H-codes that indicate health hazards
    for (const hazard of ghsData.hazardClasses) {
      const code = parseInt(hazard.code.substring(1));
      let rating = 0;
      
      // Acute toxicity codes
      if (code >= 300 && code <= 310) {
        rating = 4; // Category 1
        details.push(`Health H4: ${hazard.code} - ${hazard.description} (Acute toxicity Category 1)`);
      } else if (code >= 311 && code <= 320) {
        rating = 3; // Category 2
        details.push(`Health H3: ${hazard.code} - ${hazard.description} (Acute toxicity Category 2)`);
      } else if (code >= 321 && code <= 330) {
        rating = 2; // Category 3
        details.push(`Health H2: ${hazard.code} - ${hazard.description} (Acute toxicity Category 3)`);
      } else if (code >= 331 && code <= 340) {
        rating = 1; // Category 4
        details.push(`Health H1: ${hazard.code} - ${hazard.description} (Acute toxicity Category 4)`);
      }
      
      // Severe health hazards
      if ([340, 341, 350, 351, 360, 361, 370, 371, 372, 373].includes(code)) {
        rating = Math.max(rating, 3);
        details.push(`Health ≥H3: ${hazard.code} - ${hazard.description} (Severe chronic hazard)`);
      }
      
      // Skin/eye irritation
      if ([315, 319, 320].includes(code)) {
        rating = Math.max(rating, 1);
        details.push(`Health ≥H1: ${hazard.code} - ${hazard.description} (Irritation)`);
      }
      
      maxRating = Math.max(maxRating, rating);
    }
    
    // If no specific data found, check for general toxicity indicators
    if (maxRating === 0 && ghsData.hazardClasses.length === 0) {
      details.push(`Health H1: Default rating - no specific toxicity data found`);
      return 1; // Conservative default
    }
    
    return maxRating;
  }

  private static calculateFlammabilityRating(ghsData: GHSSection2Data, details: string[]): number {
    let maxRating = 0;
    
    // Check flash point and boiling point for flammability rating
    if (ghsData.physicalProperties.flashPoint !== undefined) {
      const fp = ghsData.physicalProperties.flashPoint; // Already in Fahrenheit
      const bp = ghsData.physicalProperties.boilingPoint;
      let rating = 0;
      
      if (fp < 73) {
        if (bp && bp < 100) {
          rating = 4;
          details.push(`Flammability F4: Flash point ${fp}°F < 73°F and BP ${bp}°F < 100°F`);
        } else {
          rating = 3;
          details.push(`Flammability F3: Flash point ${fp}°F < 73°F and BP > 100°F`);
        }
      } else if (fp >= 73 && fp <= 100) {
        rating = 3;
        details.push(`Flammability F3: Flash point ${fp}°F between 73-100°F`);
      } else if (fp > 100 && fp <= 200) {
        rating = 2;
        details.push(`Flammability F2: Flash point ${fp}°F between 100-200°F`);
      } else if (fp > 200) {
        rating = 1;
        details.push(`Flammability F1: Flash point ${fp}°F > 200°F`);
      }
      
      maxRating = Math.max(maxRating, rating);
    }
    
    // Check for specific flammability H-codes
    for (const hazard of ghsData.hazardClasses) {
      const code = parseInt(hazard.code.substring(1));
      let rating = 0;
      
      if ([220, 221].includes(code)) { // Flammable gas
        rating = 4;
        details.push(`Flammability F4: ${hazard.code} - ${hazard.description} (Flammable gas)`);
      } else if ([224, 225].includes(code)) { // Extremely/highly flammable liquid
        rating = 4;
        details.push(`Flammability F4: ${hazard.code} - ${hazard.description} (Extremely flammable)`);
      } else if (code === 226) { // Flammable liquid
        rating = 3;
        details.push(`Flammability F3: ${hazard.code} - ${hazard.description} (Flammable liquid)`);
      } else if (code === 227) { // Combustible liquid
        rating = 2;
        details.push(`Flammability F2: ${hazard.code} - ${hazard.description} (Combustible liquid)`);
      } else if ([250, 251, 252].includes(code)) { // Pyrophoric/self-heating
        rating = 4;
        details.push(`Flammability F4: ${hazard.code} - ${hazard.description} (Pyrophoric/self-heating)`);
      }
      
      maxRating = Math.max(maxRating, rating);
    }
    
    // Default to F0 if no flammability hazards found
    if (maxRating === 0 && ghsData.hazardClasses.length > 0) {
      details.push(`Flammability F0: No flammability hazards identified`);
    }
    
    return maxRating;
  }

  private static calculatePhysicalRating(ghsData: GHSSection2Data, details: string[]): number {
    let maxRating = 0;
    
    // Check for specific physical hazard H-codes
    for (const hazard of ghsData.hazardClasses) {
      const code = parseInt(hazard.code.substring(1));
      let rating = 0;
      
      // Explosive hazards
      if ([200, 201].includes(code)) {
        rating = 4;
        details.push(`Physical PH4: ${hazard.code} - ${hazard.description} (Explosive Division 1.1)`);
      } else if ([202, 203].includes(code)) {
        rating = 3;
        details.push(`Physical PH3: ${hazard.code} - ${hazard.description} (Explosive Division 1.2/1.3)`);
      } else if (code === 204) {
        rating = 2;
        details.push(`Physical PH2: ${hazard.code} - ${hazard.description} (Explosive Division 1.4)`);
      } else if ([205, 206].includes(code)) {
        rating = 1;
        details.push(`Physical PH1: ${hazard.code} - ${hazard.description} (Explosive Division 1.5/1.6)`);
      }
      
      // Self-reactive substances
      else if (code === 240) {
        rating = 4;
        details.push(`Physical PH4: ${hazard.code} - ${hazard.description} (Self-reactive Type A)`);
      } else if (code === 241) {
        rating = 3;
        details.push(`Physical PH3: ${hazard.code} - ${hazard.description} (Self-reactive Type B)`);
      } else if ([242, 243].includes(code)) {
        rating = 2;
        details.push(`Physical PH2: ${hazard.code} - ${hazard.description} (Self-reactive Type C/D)`);
      } else if ([242, 243].includes(code)) {
        rating = 1;
        details.push(`Physical PH1: ${hazard.code} - ${hazard.description} (Self-reactive Type E/F)`);
      }
      
      // Organic peroxides
      else if (code === 260) {
        rating = 4;
        details.push(`Physical PH4: ${hazard.code} - ${hazard.description} (Organic Peroxide Type A)`);
      } else if (code === 261) {
        rating = 3;
        details.push(`Physical PH3: ${hazard.code} - ${hazard.description} (Organic Peroxide Type B)`);
      } else if ([262, 263].includes(code)) {
        rating = 2;
        details.push(`Physical PH2: ${hazard.code} - ${hazard.description} (Organic Peroxide Type C/D)`);
      } else if ([264, 265].includes(code)) {
        rating = 1;
        details.push(`Physical PH1: ${hazard.code} - ${hazard.description} (Organic Peroxide Type E/F)`);
      }
      
      // Water-reactive substances
      else if (code === 260) {
        rating = 4;
        details.push(`Physical PH4: ${hazard.code} - ${hazard.description} (Water-reactive Category 1)`);
      } else if (code === 261) {
        rating = 3;
        details.push(`Physical PH3: ${hazard.code} - ${hazard.description} (Water-reactive Category 2)`);
      } else if (code === 262) {
        rating = 1;
        details.push(`Physical PH1: ${hazard.code} - ${hazard.description} (Water-reactive Category 3)`);
      }
      
      // Oxidizing substances
      else if (code === 270) {
        rating = 3;
        details.push(`Physical PH3: ${hazard.code} - ${hazard.description} (Oxidizing Gas)`);
      } else if (code === 271) {
        rating = 2;
        details.push(`Physical PH2: ${hazard.code} - ${hazard.description} (Oxidizing Liquid/Solid Category 1)`);
      } else if ([272, 273].includes(code)) {
        rating = 1;
        details.push(`Physical PH1: ${hazard.code} - ${hazard.description} (Oxidizing Liquid/Solid Category 2/3)`);
      }
      
      // Compressed gases
      else if ([280, 281].includes(code)) {
        if (code === 280) {
          rating = 4;
          details.push(`Physical PH4: ${hazard.code} - ${hazard.description} (Compressed gas that can explode when heated)`);
        } else {
          rating = 1;
          details.push(`Physical PH1: ${hazard.code} - ${hazard.description} (Compressed gas)`);
        }
      }
      
      maxRating = Math.max(maxRating, rating);
    }
    
    // Default to PH0 if no physical hazards found
    if (maxRating === 0) {
      details.push(`Physical PH0: No significant physical hazards identified`);
    }
    
    return maxRating;
  }

  private static hasChronicHazards(ghsData: GHSSection2Data): boolean {
    return ghsData.isCarcinogenic || 
           ghsData.isMutagenic || 
           ghsData.hasReproductiveToxicity || 
           ghsData.hasRespiratoryToxicity ||
           ghsData.chronicHazards.length > 0;
  }

  private static determinePPE(ppeFromSection8?: string, ghsData?: GHSSection2Data): string {
    // If PPE is explicitly provided from Section 8, try to map it
    if (ppeFromSection8) {
      const ppe = ppeFromSection8.toLowerCase();
      
      // HMIS PPE Codes: A-K, X
      if (ppe.includes('safety glasses') && !ppe.includes('glove')) return 'A';
      if (ppe.includes('safety glasses') && ppe.includes('glove')) return 'B';
      if (ppe.includes('safety glasses') && ppe.includes('apron')) return 'C';
      if (ppe.includes('face shield') && ppe.includes('apron') && ppe.includes('glove')) return 'D';
      if (ppe.includes('safety glasses') && ppe.includes('glove') && ppe.includes('dust mask')) return 'E';
      if (ppe.includes('safety glasses') && ppe.includes('apron') && ppe.includes('glove') && ppe.includes('dust mask')) return 'F';
      if (ppe.includes('safety glasses') && ppe.includes('glove') && ppe.includes('apron') && ppe.includes('vapor respirator')) return 'G';
      if (ppe.includes('splash goggles') && ppe.includes('glove') && ppe.includes('apron') && ppe.includes('vapor respirator')) return 'H';
      if (ppe.includes('full face') && ppe.includes('glove') && ppe.includes('apron') && ppe.includes('vapor respirator')) return 'I';
      if (ppe.includes('safety glasses') && ppe.includes('glove') && ppe.includes('supplied air')) return 'J';
      if (ppe.includes('full face') && ppe.includes('glove') && ppe.includes('apron') && ppe.includes('supplied air')) return 'K';
    }
    
    // Default to X (ask supervisor) when PPE requirements are unclear
    return 'X';
  }

  private static calculateConfidence(
    ghsData: GHSSection2Data, 
    health: number, 
    flammability: number, 
    physical: number
  ): number {
    let confidence = 0;
    
    // Base confidence on data availability
    if (ghsData.hazardClasses.length > 0) confidence += 30;
    if (ghsData.toxicityData.ld50_oral) confidence += 25;
    if (ghsData.physicalProperties.flashPoint !== undefined) confidence += 20;
    if (ghsData.chronicHazards.length > 0) confidence += 15;
    if (ghsData.physicalProperties.boilingPoint !== undefined) confidence += 10;
    
    return Math.min(confidence, 100);
  }
}
