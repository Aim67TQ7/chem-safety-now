
export class TextCleaner {
  public static clean(text: string): string {
    return text
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
      .replace(/\s+/g, ' ')
      .replace(/[\uFFFD\uFEFF]/g, '')
      .trim()
      .normalize('NFD');
  }
}
