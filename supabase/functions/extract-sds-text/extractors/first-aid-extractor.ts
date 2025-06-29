
export class FirstAidExtractor {
  public static extract(text: string): Record<string, string> {
    const firstAid: Record<string, string> = {};
    
    const sections = [
      { key: 'inhalation', patterns: [/first aid.*inhalation[:\s]*([^]*?)(?=\n\s*[a-z]|\n\s*\d+\.|$)/gi] },
      { key: 'skin', patterns: [/first aid.*skin[:\s]*([^]*?)(?=\n\s*[a-z]|\n\s*\d+\.|$)/gi] },
      { key: 'eyes', patterns: [/first aid.*eye[:\s]*([^]*?)(?=\n\s*[a-z]|\n\s*\d+\.|$)/gi] },
      { key: 'ingestion', patterns: [/first aid.*ingestion[:\s]*([^]*?)(?=\n\s*[a-z]|\n\s*\d+\.|$)/gi] }
    ];

    for (const section of sections) {
      for (const pattern of section.patterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          firstAid[section.key] = match[1].trim().substring(0, 500);
          break;
        }
      }
    }

    return firstAid;
  }
}
