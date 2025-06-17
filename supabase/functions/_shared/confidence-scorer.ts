
/**
 * Confidence scoring utility for SDS document matching
 * Provides weighted scoring based on multiple matching criteria
 */

interface MatchResult {
  score: number;
  reasons: string[];
  autoSelect: boolean;
}

interface ScoringWeights {
  productName: number;
  casNumber: number;
  manufacturer: number;
  contentMatch: number;
}

const DEFAULT_WEIGHTS: ScoringWeights = {
  productName: 0.4,  // 40%
  casNumber: 0.3,    // 30%
  manufacturer: 0.2, // 20%
  contentMatch: 0.1  // 10%
};

export class ConfidenceScorer {
  private weights: ScoringWeights;

  constructor(weights: ScoringWeights = DEFAULT_WEIGHTS) {
    this.weights = weights;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + substitutionCost
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Calculate string similarity score (0-1)
   */
  private stringSimilarity(str1: string, str2: string): number {
    if (!str1 || !str2) return 0;
    
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    
    if (s1 === s2) return 1;
    
    const maxLength = Math.max(s1.length, s2.length);
    if (maxLength === 0) return 1;
    
    const distance = this.levenshteinDistance(s1, s2);
    return 1 - (distance / maxLength);
  }

  /**
   * Score product name match
   */
  private scoreProductName(searchTerm: string, documentName: string): { score: number; reason?: string } {
    const similarity = this.stringSimilarity(searchTerm, documentName);
    
    if (similarity >= 0.95) return { score: 1, reason: 'Product name (exact)' };
    if (similarity >= 0.8) return { score: 0.9, reason: 'Product name (near match)' };
    if (similarity >= 0.6) return { score: 0.7, reason: 'Product name (partial)' };
    
    // Check if search term is contained within document name
    const searchLower = searchTerm.toLowerCase();
    const docLower = documentName.toLowerCase();
    
    if (docLower.includes(searchLower) || searchLower.includes(docLower)) {
      return { score: 0.6, reason: 'Product name (contains)' };
    }
    
    return { score: similarity };
  }

  /**
   * Score CAS number match
   */
  private scoreCasNumber(searchTerm: string, documentCas?: string): { score: number; reason?: string } {
    if (!documentCas) return { score: 0 };
    
    // Extract CAS-like patterns from search term
    const casPattern = /\d{2,7}-\d{2}-\d/g;
    const searchCas = searchTerm.match(casPattern)?.[0];
    
    if (!searchCas) return { score: 0 };
    
    if (searchCas === documentCas) {
      return { score: 1, reason: 'CAS number (exact)' };
    }
    
    return { score: 0 };
  }

  /**
   * Score manufacturer match
   */
  private scoreManufacturer(searchTerm: string, documentManufacturer?: string): { score: number; reason?: string } {
    if (!documentManufacturer) return { score: 0 };
    
    const similarity = this.stringSimilarity(searchTerm, documentManufacturer);
    
    if (similarity >= 0.9) return { score: 1, reason: 'Manufacturer (exact)' };
    if (similarity >= 0.7) return { score: 0.8, reason: 'Manufacturer (close)' };
    
    return { score: similarity };
  }

  /**
   * Score content match (H-codes, signal words, etc.)
   */
  private scoreContentMatch(searchTerm: string, document: any): { score: number; reason?: string } {
    let score = 0;
    const reasons: string[] = [];
    
    // Check H-codes
    if (document.h_codes && Array.isArray(document.h_codes)) {
      const searchUpper = searchTerm.toUpperCase();
      const hasHCodeMatch = document.h_codes.some((hCode: any) => 
        searchUpper.includes(hCode.code) || (hCode.description && searchUpper.includes(hCode.description.toUpperCase()))
      );
      
      if (hasHCodeMatch) {
        score += 0.5;
        reasons.push('Hazard codes');
      }
    }
    
    // Check signal word
    if (document.signal_word) {
      const searchUpper = searchTerm.toUpperCase();
      if (searchUpper.includes(document.signal_word.toUpperCase())) {
        score += 0.3;
        reasons.push('Signal word');
      }
    }
    
    // Check pictograms
    if (document.pictograms && Array.isArray(document.pictograms)) {
      const searchLower = searchTerm.toLowerCase();
      const hasPictogramMatch = document.pictograms.some((pictogram: any) =>
        searchLower.includes(pictogram.name.toLowerCase())
      );
      
      if (hasPictogramMatch) {
        score += 0.2;
        reasons.push('Pictograms');
      }
    }
    
    return { 
      score: Math.min(score, 1),
      reason: reasons.length > 0 ? `Content (${reasons.join(', ')})` : undefined
    };
  }

  /**
   * Calculate overall confidence score for a document match
   */
  public calculateConfidence(searchTerm: string, document: any): MatchResult {
    const productNameResult = this.scoreProductName(searchTerm, document.product_name);
    const casNumberResult = this.scoreCasNumber(searchTerm, document.cas_number);
    const manufacturerResult = this.scoreManufacturer(searchTerm, document.manufacturer);
    const contentResult = this.scoreContentMatch(searchTerm, document);
    
    // Calculate weighted score
    const totalScore = 
      (productNameResult.score * this.weights.productName) +
      (casNumberResult.score * this.weights.casNumber) +
      (manufacturerResult.score * this.weights.manufacturer) +
      (contentResult.score * this.weights.contentMatch);
    
    // Collect match reasons
    const reasons: string[] = [];
    if (productNameResult.reason) reasons.push(productNameResult.reason);
    if (casNumberResult.reason) reasons.push(casNumberResult.reason);
    if (manufacturerResult.reason) reasons.push(manufacturerResult.reason);
    if (contentResult.reason) reasons.push(contentResult.reason);
    
    // Determine auto-selection
    const autoSelect = totalScore >= 0.9;
    
    return {
      score: totalScore,
      reasons,
      autoSelect
    };
  }

  /**
   * Rank and score multiple documents
   */
  public rankDocuments(searchTerm: string, documents: any[]): Array<any & { confidence: MatchResult }> {
    return documents
      .map(doc => ({
        ...doc,
        confidence: this.calculateConfidence(searchTerm, doc)
      }))
      .sort((a, b) => b.confidence.score - a.confidence.score);
  }
}

export default ConfidenceScorer;
