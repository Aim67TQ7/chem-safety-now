
export interface Pictogram {
  ghs_code: string;
  name: string;
  description?: string;
}

export class PictogramExtractor {
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

  public static extract(text: string): Pictogram[] {
    const pictograms: Pictogram[] = [];
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
}
