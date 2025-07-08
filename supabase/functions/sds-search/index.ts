
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import ConfidenceScorer from '../_shared/confidence-scorer.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

const confidenceScorer = new ConfidenceScorer();

interface SearchRequest {
  product_name: string;
  max_results?: number;
}

interface ScrapedSDSDocument {
  product_name: string;
  manufacturer?: string;
  cas_number?: string;
  source_url: string;
  file_name: string;
  document_type: string;
  h_codes?: Array<{ code: string; description: string }>;
  pictograms?: Array<{ ghs_code: string; name: string; description?: string }>;
  signal_word?: string;
  hazard_statements?: string[];
  precautionary_statements?: string[];
}

interface GoogleSearchResult {
  title: string;
  link: string;
  snippet: string;
  fileFormat?: string;
}

interface SearchVariation {
  query: string;
  description: string;
}

function createSearchVariations(productName: string): SearchVariation[] {
  const variations: SearchVariation[] = [];
  
  // Clean and normalize the product name
  const cleanName = productName.trim();
  
  // Extract potential manufacturer (first word if it looks like a brand)
  const words = cleanName.split(/\s+/);
  const potentialManufacturer = words[0];
  const restOfName = words.slice(1).join(' ');
  
  // Common prefixes/suffixes to handle
  const commonPrefixes = ['AA', 'LC', 'HV', 'LV'];
  const commonSuffixes = ['LC', 'HV', 'LV', 'PLUS', 'PRO'];
  
  // 1. Exact search with quotes (most restrictive)
  variations.push({
    query: `"${cleanName}" "safety data sheet" filetype:pdf`,
    description: 'Exact product name with SDS'
  });
  
  // 2. Exact search with MSDS variation
  variations.push({
    query: `"${cleanName}" "MSDS" filetype:pdf`,
    description: 'Exact product name with MSDS'
  });
  
  // 3. Flexible search without quotes
  variations.push({
    query: `${cleanName} "safety data sheet" filetype:pdf`,
    description: 'Flexible product name with SDS'
  });
  
  // 4. Flexible search with MSDS
  variations.push({
    query: `${cleanName} "MSDS" filetype:pdf`,
    description: 'Flexible product name with MSDS'
  });
  
  // 5. If we have a potential manufacturer, search with manufacturer separately
  if (words.length > 1 && potentialManufacturer.length > 2) {
    variations.push({
      query: `${potentialManufacturer} ${restOfName} "safety data sheet" filetype:pdf`,
      description: 'Manufacturer and product separate'
    });
    
    // 6. Just the product part without manufacturer
    if (restOfName.length > 2) {
      variations.push({
        query: `"${restOfName}" "safety data sheet" filetype:pdf`,
        description: 'Product name without manufacturer'
      });
    }
  }
  
  // 7. Remove common prefixes/suffixes for broader search
  let simplifiedName = cleanName;
  
  // Remove common prefixes
  for (const prefix of commonPrefixes) {
    const prefixPattern = new RegExp(`\\b${prefix}\\s+`, 'gi');
    if (prefixPattern.test(simplifiedName)) {
      const withoutPrefix = simplifiedName.replace(prefixPattern, '').trim();
      if (withoutPrefix.length > 2) {
        variations.push({
          query: `"${withoutPrefix}" "safety data sheet" filetype:pdf`,
          description: `Without ${prefix} prefix`
        });
      }
    }
  }
  
  // Remove common suffixes
  for (const suffix of commonSuffixes) {
    const suffixPattern = new RegExp(`\\s+${suffix}\\b`, 'gi');
    if (suffixPattern.test(simplifiedName)) {
      const withoutSuffix = simplifiedName.replace(suffixPattern, '').trim();
      if (withoutSuffix.length > 2) {
        variations.push({
          query: `"${withoutSuffix}" "safety data sheet" filetype:pdf`,
          description: `Without ${suffix} suffix`
        });
      }
    }
  }
  
  // 8. Handle special characters and numbers
  const alphanumericOnly = cleanName.replace(/[^a-zA-Z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  if (alphanumericOnly !== cleanName && alphanumericOnly.length > 2) {
    variations.push({
      query: `${alphanumericOnly} "safety data sheet" filetype:pdf`,
      description: 'Alphanumeric characters only'
    });
  }
  
  // 9. Very broad search as last resort
  const coreTerms = cleanName.split(/\s+/).filter(word => word.length > 2);
  if (coreTerms.length > 1) {
    variations.push({
      query: `${coreTerms.join(' ')} safety data sheet filetype:pdf`,
      description: 'Core terms broad search'
    });
  }
  
  return variations;
}

async function searchGoogleCSEWithVariations(productName: string, maxResults: number = 10): Promise<{ results: GoogleSearchResult[], usedQuery: string }> {
  const apiKey = Deno.env.get('GOOGLE_API_KEY');
  const cseId = Deno.env.get('GOOGLE_CSE_ID');
  
  if (!apiKey || !cseId) {
    console.error('❌ Missing Google API credentials');
    console.error('GOOGLE_API_KEY exists:', !!apiKey);
    console.error('GOOGLE_CSE_ID exists:', !!cseId);
    throw new Error('Google API credentials not configured - check GOOGLE_API_KEY and GOOGLE_CSE_ID environment variables');
  }

  const searchVariations = createSearchVariations(productName);
  
  console.log(`🔍 Created ${searchVariations.length} search variations for: ${productName}`);
  
  // Try each search variation until we get results
  for (let i = 0; i < searchVariations.length; i++) {
    const variation = searchVariations[i];
    const encodedQuery = encodeURIComponent(variation.query);
    const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cseId}&q=${encodedQuery}&num=${Math.min(maxResults, 10)}`;
    
    console.log(`🔍 Trying search variation ${i + 1}/${searchVariations.length}: ${variation.description}`);
    console.log(`📝 Query: ${variation.query}`);
    
    try {
      const response = await fetch(searchUrl);
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Google CSE API error for variation ${i + 1}: ${response.status} ${response.statusText}`);
        console.error(`❌ Response body:`, errorText);
        
        // For API quota/authentication errors, don't continue trying other variations
        if (response.status === 429) {
          throw new Error('Google API quota exceeded. Please check your Google API usage limits.');
        }
        if (response.status === 403) {
          throw new Error('Google API access forbidden. Please check your API key and Custom Search Engine configuration.');
        }
        if (response.status === 400) {
          throw new Error(`Google API request error: ${errorText}`);
        }
        
        continue; // Try next variation for other errors
      }
      
      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        console.log(`✅ Found ${data.items.length} results with variation: ${variation.description}`);
        
        const results = data.items.map((item: any): GoogleSearchResult => ({
          title: item.title,
          link: item.link,
          snippet: item.snippet,
          fileFormat: item.fileFormat
        }));
        
        return { results, usedQuery: variation.query };
      } else {
        console.log(`📄 No results for variation ${i + 1}: ${variation.description}`);
      }
      
    } catch (error) {
      console.error(`❌ Error with search variation ${i + 1}:`, error);
      continue; // Try next variation
    }
  }
  
  console.log('📄 No results found with any search variation');
  return { results: [], usedQuery: searchVariations[0]?.query || productName };
}

function isPDFDocument(url: string, title: string, fileFormat?: string): boolean {
  // Check if it's explicitly marked as PDF
  if (fileFormat === 'PDF') return true;
  
  // Check URL for PDF extension
  if (url.toLowerCase().includes('.pdf')) return true;
  
  // Check title for PDF indicators
  if (title.toLowerCase().includes('.pdf')) return true;
  
  // Reject common web page patterns
  const webPagePatterns = [
    'wikipedia.org',
    'google.com',
    'facebook.com',
    'twitter.com',
    'linkedin.com',
    'youtube.com',
    '/search',
    '/products',
    '/catalog',
    '/category'
  ];
  
  const urlLower = url.toLowerCase();
  return !webPagePatterns.some(pattern => urlLower.includes(pattern));
}

async function scrapeSDSDocuments(productName: string, maxResults: number = 3): Promise<ScrapedSDSDocument[]> {
  console.log('🔍 Starting enhanced Google CSE SDS document search for:', productName);
  
  try {
    // Step 1: Search using Google CSE with progressive search variations
    const { results: searchResults, usedQuery } = await searchGoogleCSEWithVariations(productName, maxResults * 2);
    
    if (searchResults.length === 0) {
      console.log('📄 No Google CSE results found with any search variation');
      return [];
    }
    
    console.log(`✅ Found results using query: ${usedQuery}`);
    
    // Step 2: Filter results for actual PDF documents only
    const pdfResults = searchResults.filter(result => {
      const isPDF = isPDFDocument(result.link, result.title, result.fileFormat);
      
      if (!isPDF) {
        console.log(`⚠️ Filtering out non-PDF result: ${result.title} - ${result.link}`);
      }
      
      return isPDF;
    });
    
    console.log(`📋 Filtered to ${pdfResults.length} PDF documents from ${searchResults.length} total results`);
    
    if (pdfResults.length === 0) {
      console.log('❌ No PDF documents found in search results');
      return [];
    }
    
    // Step 3: Create document records for found PDFs (DON'T auto-download here)
    const documents: ScrapedSDSDocument[] = pdfResults.slice(0, maxResults).map(result => ({
      product_name: productName,
      source_url: result.link,
      file_name: `${productName.replace(/[^a-zA-Z0-9]/g, '_')}_SDS.pdf`,
      document_type: 'safety_data_sheet'
    }));
    
    console.log(`✅ Created ${documents.length} document records from enhanced CSE search`);
    return documents;
    
  } catch (error) {
    console.error('❌ Enhanced SDS document search process error:', error);
    throw error;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse and validate request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      console.error('❌ Failed to parse request JSON:', parseError);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request format',
          details: 'Request body must be valid JSON'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate required fields
    if (!requestBody || typeof requestBody !== 'object') {
      console.error('❌ Request body is not an object:', requestBody);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request body',
          details: 'Request body must be a JSON object'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { product_name, max_results = 3 } = requestBody;

    // Validate product_name
    if (!product_name || typeof product_name !== 'string' || !product_name.trim()) {
      console.error('❌ Invalid product_name:', { product_name, type: typeof product_name });
      return new Response(
        JSON.stringify({ 
          error: 'Invalid product name',
          details: 'product_name must be a non-empty string'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate max_results
    const validMaxResults = typeof max_results === 'number' && max_results > 0 ? max_results : 3;
    
    console.log('🔍 Enhanced SDS document search request:', { 
      product_name: product_name.trim(), 
      max_results: validMaxResults,
      original_max_results: max_results 
    });

    // Use trimmed product name for all operations
    const cleanProductName = product_name.trim();
    
    // Step 1: Search existing documents in database
    const { data: existingDocs, error: searchError } = await supabase
      .from('sds_documents')
      .select('*')
      .or(`product_name.ilike.%${cleanProductName}%,manufacturer.ilike.%${cleanProductName}%,cas_number.ilike.%${cleanProductName}%`)
      .limit(validMaxResults);

    if (searchError) {
      console.error('❌ Database search error:', searchError);
      throw searchError;
    }

    console.log('📊 Found existing documents:', existingDocs?.length || 0);

    // Step 2: Get web search results (without auto-saving)
    const webResults = await scrapeSDSDocuments(cleanProductName, Math.max(1, validMaxResults - (existingDocs?.length || 0)));
    
    // Step 3: Combine and rank all results
    const allResults = [...(existingDocs || []), ...webResults];
    
    if (allResults.length === 0) {
      return new Response(
        JSON.stringify({ 
          results: [],
          source: 'combined_search',
          auto_selected: false,
          message: 'No SDS documents found - try a different product name'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Step 4: Rank by confidence
    const rankedResults = confidenceScorer.rankDocuments(cleanProductName, allResults);
    
    // Limit to requested number of results
    const topResults = rankedResults.slice(0, validMaxResults);
    
    // Log confidence scores for debugging
    topResults.forEach((doc, index) => {
      console.log(`📋 Result ${index + 1}: ${doc.product_name} - Confidence: ${(doc.confidence.score * 100).toFixed(1)}% - Source: ${doc.id ? 'Database' : 'Web'}`);
    });

    return new Response(
      JSON.stringify({ 
        results: topResults,
        source: 'combined_search',
        auto_selected: false,
        message: `Found ${topResults.length} potential SDS documents. Please select one to process with AI extraction.`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Enhanced SDS document search error:', error);
    
    // Determine appropriate status code based on error type
    let statusCode = 500;
    let errorMessage = 'Enhanced document search failed';
    
    if (error.message.includes('Google API credentials not configured')) {
      statusCode = 503; // Service Unavailable
      errorMessage = 'Search service configuration error';
    } else if (error.message.includes('quota exceeded')) {
      statusCode = 429; // Too Many Requests
      errorMessage = 'Search service temporarily unavailable due to quota limits';
    } else if (error.message.includes('access forbidden')) {
      statusCode = 503; // Service Unavailable
      errorMessage = 'Search service access error';
    }
    
    // Enhanced error logging for better debugging
    console.error('🔧 Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      statusCode,
      timestamp: new Date().toISOString()
    });
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: statusCode,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
