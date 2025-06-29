
export class HazardCategoriesExtractor {
  public static extractPhysicalHazards(text: string): string[] {
    const keywords = [
      'flammable', 'explosive', 'oxidizing', 'corrosive', 'irritant', 
      'compressed gas', 'self-heating', 'pyrophoric', 'organic peroxide'
    ];
    
    return keywords.filter(keyword => 
      text.toLowerCase().includes(keyword)
    );
  }

  public static extractHealthHazards(text: string): string[] {
    const keywords = [
      'toxic', 'carcinogenic', 'mutagenic', 'reproductive toxicity',
      'respiratory sensitizer', 'skin sensitizer', 'acute toxicity',
      'specific target organ toxicity'
    ];
    
    return keywords.filter(keyword => 
      text.toLowerCase().includes(keyword)
    );
  }

  public static extractEnvironmentalHazards(text: string): string[] {
    const keywords = [
      'hazardous to aquatic life', 'environmental hazard', 'ozone layer',
      'bioaccumulative', 'persistent', 'very toxic to aquatic life'
    ];
    
    return keywords.filter(keyword => 
      text.toLowerCase().includes(keyword)
    );
  }
}
