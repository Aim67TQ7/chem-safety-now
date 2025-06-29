
export interface HazardData {
  hCodes: Array<{ code: string; description: string }>;
  statements: string[];
}

export class HazardExtractor {
  public static extract(text: string): HazardData {
    const hCodes: Array<{ code: string; description: string }> = [];
    const statements: string[] = [];

    // Extract H-codes with descriptions
    const hCodeMatches = text.match(/H\d{3}[:\s]*[^\n\r.]*[.\n\r]/gi) || [];
    
    for (const match of hCodeMatches) {
      const codeMatch = match.match(/H\d{3}/);
      if (codeMatch) {
        const code = codeMatch[0];
        const description = match.replace(/H\d{3}[:\s]*/, '').trim().replace(/[.\n\r]+$/, '');
        
        if (description.length > 10) {
          hCodes.push({ code, description });
          statements.push(description);
        }
      }
    }

    return { hCodes, statements };
  }

  public static extractPrecautionaryStatements(text: string): string[] {
    const statements: string[] = [];
    const pCodeMatches = text.match(/P\d{3}[:\s]*[^\n\r.]*[.\n\r]/gi) || [];
    
    for (const match of pCodeMatches) {
      const statement = match.replace(/P\d{3}[:\s]*/, '').trim().replace(/[.\n\r]+$/, '');
      if (statement.length > 10) {
        statements.push(statement);
      }
    }

    return statements.slice(0, 20); // Limit to prevent overflow
  }
}
