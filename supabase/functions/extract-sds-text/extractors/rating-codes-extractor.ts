
export class RatingCodesExtractor {
  private static readonly HMIS_PATTERNS = [
    /HMIS[\s]*:?\s*(\d)\s*[-\/]\s*(\d)\s*[-\/]\s*(\d)(?:\s*[-\/]\s*([A-KX]))?/gi,
    /Health[\s]*:?\s*(\d)[\s\S]*?Flammability[\s]*:?\s*(\d)[\s\S]*?Physical[\s]*:?\s*(\d)/gi,
    /H[\s]*:?\s*(\d)[\s]*F[\s]*:?\s*(\d)[\s]*P[\s]*:?\s*(\d)/gi
  ];

  private static readonly NFPA_PATTERNS = [
    /NFPA[\s]*:?\s*(\d)\s*[-\/]\s*(\d)\s*[-\/]\s*(\d)(?:\s*[-\/]\s*([A-Z]))?/gi,
    /Fire[\s]*:?\s*(\d)[\s\S]*?Health[\s]*:?\s*(\d)[\s\S]*?Reactivity[\s]*:?\s*(\d)/gi
  ];

  public static extractHMIS(text: string): Record<string, number> {
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

  public static extractNFPA(text: string): Record<string, number> {
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
}
