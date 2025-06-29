
export class ManufacturerExtractor {
  private static readonly MANUFACTURER_PATTERNS = [
    /(?:manufacturer|company|supplier)[\s]*:?\s*([^\n\r]{10,100})/gi,
    /(?:made by|manufactured by)[\s]*:?\s*([^\n\r]{10,100})/gi,
    /(?:distributor|distributed by)[\s]*:?\s*([^\n\r]{10,100})/gi
  ];

  public static extract(text: string): string | null {
    for (const pattern of this.MANUFACTURER_PATTERNS) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim().replace(/[^\w\s&.,'()-]/g, '').substring(0, 100);
      }
    }
    return null;
  }
}
