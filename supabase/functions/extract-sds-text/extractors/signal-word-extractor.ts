
export class SignalWordExtractor {
  private static readonly SIGNAL_WORD_PATTERNS = [
    /Signal[\s]+Word[\s]*:?\s*(DANGER|WARNING)/gi,
    /\b(DANGER|WARNING)\b(?=[\s]*[^\w])/gi
  ];

  public static extract(text: string): string | null {
    for (const pattern of this.SIGNAL_WORD_PATTERNS) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].toUpperCase();
      }
    }
    return null;
  }
}
