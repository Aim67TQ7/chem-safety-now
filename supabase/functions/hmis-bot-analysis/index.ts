
import { corsHeaders } from '../_shared/cors.ts'

interface HMISBotRequest {
  sds_text: string;
  document_id?: string;
}

interface HMISBotResponse {
  success: boolean;
  hmis_label: {
    health: string;
    flammability: number;
    physical_hazard: number;
    ppe: string;
  };
  ghs_info: {
    signal_word: string;
    pictograms: string[];
  };
  processing_time_ms: number;
  confidence_score: number;
  sections_found: string[];
  error?: string;
}

// HMIS Mapping Tables from the algorithm
const HEALTH_MAPPING = {
  // Acute Toxicity
  'acute_toxicity_1': { hmis: 4, chronic: false },
  'acute_toxicity_2': { hmis: 3, chronic: false },
  'acute_toxicity_3': { hmis: 2, chronic: false },
  'acute_toxicity_4': { hmis: 1, chronic: false },
  // Eye/Skin Damage
  'serious_eye_damage_1': { hmis: 3, chronic: false },
  'skin_corrosion_1': { hmis: 3, chronic: false },
  'skin_irritation_2': { hmis: 2, chronic: false },
  'skin_sensitisation_1': { hmis: 1, chronic: false },
  // Chronic hazards (add asterisk)
  'carcinogenicity': { hmis: 0, chronic: true },
  'mutagenicity': { hmis: 0, chronic: true },
  'reproductive_toxicity': { hmis: 0, chronic: true },
  'respiratory_sensitisation': { hmis: 0, chronic: true },
  'stot_re': { hmis: 0, chronic: true }
};

const FLAMMABILITY_MAPPING = {
  1: 4, 2: 4, 3: 3, 4: 1
};

const PHYSICAL_HAZARD_MAPPING = {
  4: ['self_reactive_a', 'self_reactive_b', 'organic_peroxide_a', 'organic_peroxide_b', 'explosive_1_1', 'explosive_1_2', 'water_reactive_1', 'pyrophoric_gas'],
  3: ['self_reactive_c', 'self_reactive_d', 'organic_peroxide_c', 'organic_peroxide_d', 'explosive_1_3', 'water_reactive_2', 'oxidising_gas'],
  2: ['self_reactive_e', 'self_reactive_f', 'organic_peroxide_e', 'organic_peroxide_f', 'explosive_1_4', 'self_heating_1', 'oxidising_liquid_1', 'oxidising_solid_1'],
  1: ['self_reactive_g', 'organic_peroxide_g', 'explosive_1_5', 'explosive_1_6', 'self_heating_2', 'water_reactive_3', 'oxidising_liquid_2', 'oxidising_liquid_3', 'oxidising_solid_2', 'oxidising_solid_3']
};

const PPE_MAPPING = {
  'A': ['safety glasses', 'safety goggles'],
  'B': ['glasses', 'gloves'],
  'C': ['glasses', 'gloves', 'apron'],
  'D': ['face shield', 'gloves'],
  'E': ['glasses', 'gloves', 'dust respirator'],
  'F': ['glasses', 'gloves', 'dust respirator', 'apron'],
  'G': ['glasses', 'gloves', 'vapour respirator'],
  'H': ['face shield', 'gloves', 'apron', 'vapour respirator'],
  'I': ['glasses', 'gloves', 'dust vapour respirator'],
  'J': ['glasses', 'gloves', 'dust vapour respirator', 'apron'],
  'K': ['air line respirator']
};

class HMISBotProcessor {
  private sdsText: string;
  private sections: Map<number, string> = new Map();
  
  constructor(sdsText: string) {
    this.sdsText = sdsText.toLowerCase();
    this.extractSections();
  }
  
  private extractSections() {
    // Extract specific sections from SDS
    const sectionRegex = /section\s+(\d+)[\s\-–]+([^]*?)(?=section\s+\d+|$)/gi;
    let match;
    
    while ((match = sectionRegex.exec(this.sdsText)) !== null) {
      const sectionNum = parseInt(match[1]);
      const sectionContent = match[2];
      this.sections.set(sectionNum, sectionContent);
    }
  }
  
  extractHazardClasses(): { health: number, chronic: boolean, flammability: number, physical: number } {
    const section2 = this.sections.get(2) || '';
    const section11 = this.sections.get(11) || '';
    
    let maxHealth = 0;
    let hasChronic = false;
    let flammability = 0;
    let maxPhysical = 0;
    
    // Health hazards from Section 2
    const healthPatterns = [
      /acute toxicity.*category\s*([1-4])/gi,
      /serious eye damage.*category\s*1/gi,
      /skin corrosion.*category\s*1/gi,
      /skin irritation.*category\s*2/gi,
      /skin sensitisation.*category\s*1/gi
    ];
    
    healthPatterns.forEach(pattern => {
      const matches = section2.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const categoryMatch = match.match(/category\s*([1-4])/i);
          if (categoryMatch) {
            const category = parseInt(categoryMatch[1]);
            if (match.includes('acute toxicity')) {
              const healthValue = HEALTH_MAPPING[`acute_toxicity_${category}`]?.hmis || 0;
              maxHealth = Math.max(maxHealth, healthValue);
            }
          }
        });
      }
    });
    
    // Chronic hazards
    const chronicPatterns = [
      /carcinogen/gi,
      /mutagen/gi,
      /reproductive.*toxic/gi,
      /respiratory.*sensitiz/gi,
      /stot.*repeated/gi
    ];
    
    chronicPatterns.forEach(pattern => {
      if (section2.match(pattern) || section11.match(pattern)) {
        hasChronic = true;
      }
    });
    
    // Flammability from Section 2 or derive from Section 9
    const flammableMatch = section2.match(/flammable liquid.*category\s*([1-4])/i);
    if (flammableMatch) {
      const category = parseInt(flammableMatch[1]);
      flammability = FLAMMABILITY_MAPPING[category] || 0;
    } else {
      // Derive from flash point in Section 9
      const section9 = this.sections.get(9) || '';
      const flashPointMatch = section9.match(/flash.*point.*?(-?\d+(?:\.\d+)?)\s*°?c/i);
      if (flashPointMatch) {
        const flashPoint = parseFloat(flashPointMatch[1]);
        if (flashPoint < 23) flammability = 4;
        else if (flashPoint < 60) flammability = 3;
        else if (flashPoint <= 93) flammability = 1;
        else flammability = 0;
      }
    }
    
    // Physical hazards
    const section10 = this.sections.get(10) || '';
    const physicalText = section2 + ' ' + section10;
    
    for (const [level, hazards] of Object.entries(PHYSICAL_HAZARD_MAPPING)) {
      hazards.forEach(hazard => {
        const hazardPattern = hazard.replace(/_/g, '\\s+');
        if (new RegExp(hazardPattern, 'i').test(physicalText)) {
          maxPhysical = Math.max(maxPhysical, parseInt(level));
        }
      });
    }
    
    return { health: maxHealth, chronic: hasChronic, flammability, physical: maxPhysical };
  }
  
  extractSignalWordAndPictograms(): { signal_word: string, pictograms: string[] } {
    const section2 = this.sections.get(2) || '';
    
    // Signal word
    let signalWord = 'WARNING';
    if (section2.includes('danger')) {
      signalWord = 'DANGER';
    }
    
    // Pictograms
    const pictogramNames = [
      'Health-Hazard', 'Flame', 'Flame-Over-Circle', 'Exploding-Bomb',
      'Gas-Cylinder', 'Corrosion', 'Skull-and-Crossbones', 'Exclamation-Mark', 'Environment'
    ];
    
    const foundPictograms: string[] = [];
    pictogramNames.forEach(name => {
      const searchName = name.toLowerCase().replace(/-/g, ' ');
      if (section2.includes(searchName) || section2.includes(name.toLowerCase())) {
        foundPictograms.push(name);
      }
    });
    
    return { signal_word: signalWord, pictograms: foundPictograms };
  }
  
  extractPPE(): string {
    const section8 = this.sections.get(8) || '';
    
    // Check for specific PPE combinations
    for (const [code, equipment] of Object.entries(PPE_MAPPING)) {
      const hasAllEquipment = equipment.every(item => 
        section8.includes(item) || section8.includes(item.replace(' ', ''))
      );
      if (hasAllEquipment) {
        return code;
      }
    }
    
    // Default to X if no specific PPE found or consult supervisor mentioned
    if (section8.includes('consult') || section8.includes('supervisor') || section8.trim() === '') {
      return 'X';
    }
    
    return 'A'; // Basic safety glasses as minimum
  }
  
  process(): HMISBotResponse {
    const startTime = Date.now();
    
    try {
      const hazards = this.extractHazardClasses();
      const ghsInfo = this.extractSignalWordAndPictograms();
      const ppe = this.extractPPE();
      
      const healthValue = hazards.chronic ? `${hazards.health}*` : hazards.health.toString();
      
      const processingTime = Date.now() - startTime;
      const sectionsFound = Array.from(this.sections.keys()).map(n => `Section ${n}`);
      
      // Calculate confidence based on sections found and data extracted
      let confidence = 0;
      if (this.sections.has(2)) confidence += 40;
      if (this.sections.has(8)) confidence += 20;
      if (this.sections.has(9)) confidence += 15;
      if (this.sections.has(10)) confidence += 15;
      if (this.sections.has(11)) confidence += 10;
      
      return {
        success: true,
        hmis_label: {
          health: healthValue,
          flammability: hazards.flammability,
          physical_hazard: hazards.physical,
          ppe: ppe
        },
        ghs_info: {
          signal_word: ghsInfo.signal_word,
          pictograms: ghsInfo.pictograms
        },
        processing_time_ms: processingTime,
        confidence_score: confidence,
        sections_found: sectionsFound
      };
    } catch (error) {
      return {
        success: false,
        hmis_label: { health: '0', flammability: 0, physical_hazard: 0, ppe: 'X' },
        ghs_info: { signal_word: 'WARNING', pictograms: [] },
        processing_time_ms: Date.now() - startTime,
        confidence_score: 0,
        sections_found: [],
        error: error.message
      };
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sds_text, document_id }: HMISBotRequest = await req.json();
    
    console.log('🤖 HMIS-BOT processing document:', document_id || 'unknown');
    console.log('📄 SDS text length:', sds_text.length);
    
    const processor = new HMISBotProcessor(sds_text);
    const result = processor.process();
    
    console.log('✅ HMIS-BOT analysis complete');
    console.log('🎯 HMIS Label:', result.hmis_label);
    console.log('🏷️ GHS Info:', result.ghs_info);
    console.log('⏱️ Processing time:', result.processing_time_ms, 'ms');
    console.log('📊 Confidence:', result.confidence_score, '%');
    
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ HMIS-BOT error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'HMIS-BOT analysis failed',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
