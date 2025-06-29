
export class CASExtractor {
  private static readonly CAS_PATTERNS = [
    /\b\d{2,7}-\d{2}-\d\b/g,
    /CAS[\s#]*:?\s*(\d{2,7}-\d{2}-\d)/gi,
    /CAS[\s]*No[\s]*:?\s*(\d{2,7}-\d{2}-\d)/gi
  ];

  public static extract(text: string): string | null {
    for (const pattern of this.CAS_PATTERNS) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        // Return the first valid CAS number found
        return matches[0].replace(/CAS[\s#]*:?\s*/gi, '').trim();
      }
    }
    return null;
  }
}
