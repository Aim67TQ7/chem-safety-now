
export class DocumentClassifier {
  public static detectType(text: string): string {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('safety data sheet') || lowerText.includes('sds')) return 'sds';
    if (lowerText.includes('material safety data sheet') || lowerText.includes('msds')) return 'msds';
    if (lowerText.includes('product data sheet')) return 'pds';
    if (lowerText.includes('technical data sheet')) return 'tds';
    
    return 'unknown';
  }
}
