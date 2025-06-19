
import { SDSExtractedData } from './types.ts';
import { extractSDSData } from './sds-extractor.ts';

export async function downloadAndExtractPDF(url: string): Promise<SDSExtractedData> {
  try {
    console.log('📥 Downloading PDF for extraction:', url);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SDS-Extractor/1.0)',
        'Accept': 'application/pdf,*/*'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to download PDF: ${response.status}`);
    }
    
    const pdfArrayBuffer = await response.arrayBuffer();
    const pdfText = new TextDecoder('utf-8', { fatal: false }).decode(pdfArrayBuffer);
    
    return extractSDSData(pdfText);
    
  } catch (error) {
    console.error('❌ Error downloading/extracting PDF:', error);
    throw error;
  }
}
