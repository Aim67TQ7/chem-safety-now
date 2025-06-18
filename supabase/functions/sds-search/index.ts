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
    throw new Error('Google API credentials not configured');
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
        console.error(`❌ Google CSE API error for variation ${i + 1}: ${response.status} ${response.statusText}`);
        continue; // Try next variation
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

async function searchGoogleCSE(productName: string, maxResults: number = 10): Promise<GoogleSearchResult[]> {
  const apiKey = Deno.env.get('GOOGLE_API_KEY');
  const cseId = Deno.env.get('GOOGLE_CSE_ID');
  
  if (!apiKey || !cseId) {
    console.error('❌ Missing Google API credentials');
    throw new Error('Google API credentials not configured');
  }

  // Enhanced search query specifically for PDF SDS documents
  const searchQuery = `"${productName}" "safety data sheet" filetype:pdf OR "${productName}" "SDS" filetype:pdf OR "${productName}" "MSDS" filetype:pdf`;
  const encodedQuery = encodeURIComponent(searchQuery);
  
  const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cseId}&q=${encodedQuery}&num=${Math.min(maxResults, 10)}`;
  
  console.log('🔍 Searching Google CSE for PDF SDS documents:', productName);
  
  try {
    const response = await fetch(searchUrl);
    if (!response.ok) {
      throw new Error(`Google CSE API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.items) {
      console.log('📄 No search results found');
      return [];
    }
    
    console.log(`📄 Found ${data.items.length} Google CSE results`);
    
    return data.items.map((item: any): GoogleSearchResult => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet,
      fileFormat: item.fileFormat
    }));
    
  } catch (error) {
    console.error('❌ Google CSE search error:', error);
    throw error;
  }
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
    
    // Step 3: Create document records for all found PDFs
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

async function triggerTextExtraction(document: any): Promise<void> {
  try {
    console.log('🔍 Triggering text extraction for document:', document.id);
    
    // Check if document already has extracted data
    if (document.h_codes && document.h_codes.length > 0) {
      console.log('✅ Document already has extracted data, skipping extraction');
      return;
    }
    
    // Only extract if we have a bucket_url
    if (!document.bucket_url) {
      console.log('⚠️ No bucket_url found, skipping text extraction');
      return;
    }
    
    // Call the extract-sds-text function
    const { error } = await supabase.functions.invoke('extract-sds-text', {
      body: {
        document_id: document.id,
        bucket_url: document.bucket_url
      }
    });
    
    if (error) {
      console.error('❌ Text extraction failed:', error);
    } else {
      console.log('✅ Text extraction initiated successfully');
    }
  } catch (error) {
    console.error('❌ Error triggering text extraction:', error);
  }
}

async function enhanceDocumentWithExtraction(document: any): Promise<any> {
  // Check if document needs text extraction
  const needsExtraction = !document.h_codes || document.h_codes.length === 0;
  
  if (needsExtraction && document.bucket_url) {
    // Trigger extraction in background
    EdgeRuntime.waitUntil(triggerTextExtraction(document));
    
    // Add extraction status to document
    return {
      ...document,
      extraction_status: 'processing',
      extraction_message: 'Extracting hazard data...'
    };
  }
  
  return {
    ...document,
    extraction_status: document.h_codes?.length > 0 ? 'complete' : 'pending'
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { product_name, max_results = 10 }: SearchRequest = await req.json();
    
    console.log('🔍 Enhanced SDS document search request:', { product_name, max_results });

    // Step 1: Search existing documents in database (NO QUALITY FILTERS)
    const { data: existingDocs, error: searchError } = await supabase
      .from('sds_documents')
      .select('*')
      .or(`product_name.ilike.%${product_name}%,manufacturer.ilike.%${product_name}%,cas_number.ilike.%${product_name}%`)
      .limit(max_results);

    if (searchError) {
      console.error('❌ Database search error:', searchError);
      throw searchError;
    }

    console.log('📊 Found existing documents:', existingDocs?.length || 0);

    // Step 2: If we have existing documents, rank them by confidence only
    if (existingDocs && existingDocs.length > 0) {
      console.log('🎯 Calculating confidence scores for existing documents...');
      
      const rankedDocs = confidenceScorer.rankDocuments(product_name, existingDocs);
      
      // Limit to top 3 results
      const topThreeResults = rankedDocs.slice(0, 3);
      
      // Log confidence scores for debugging
      topThreeResults.forEach((doc, index) => {
        console.log(`📋 Document ${index + 1}: ${doc.product_name} - Confidence: ${(doc.confidence.score * 100).toFixed(1)}% - Reasons: ${doc.confidence.reasons.join(', ')}`);
      });
      
      const topMatch = topThreeResults[0];
      
      // Auto-select based on confidence only (≥70%)
      if (topMatch.confidence.score >= 0.7) {
        console.log('✅ Auto-selecting top existing match with good confidence:', topMatch.confidence.score);
        
        // Enhance document with extraction if needed
        const enhancedDocument = await enhanceDocumentWithExtraction(topMatch);
        
        return new Response(
          JSON.stringify({ 
            results: [enhancedDocument],
            source: 'database',
            auto_selected: true,
            confidence_score: topMatch.confidence.score,
            match_reasons: topMatch.confidence.reasons,
            message: `Auto-selected best match (${(topMatch.confidence.score * 100).toFixed(1)}% confidence)${enhancedDocument.extraction_status === 'processing' ? ' - Extracting additional hazard data...' : ''}`
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      // If confidence is below 70%, go directly to CSE instead of returning low-confidence existing docs
      console.log(`⚠️ Top existing document confidence ${(topMatch.confidence.score * 100).toFixed(1)}% is below 70%, proceeding to enhanced CSE search`);
    }

    // Step 3: No suitable existing documents found, create job and search CSE
    console.log('💾 Creating SDS job for enhanced CSE document search:', product_name);
    
    const { data: jobData, error: jobError } = await supabase
      .from('sds_jobs')
      .insert({
        product_name,
        max_results: 3,
        status: 'pending',
        message: 'Starting enhanced Google CSE PDF document search with multiple variations...'
      })
      .select()
      .single();

    if (jobError) {
      console.error('❌ Job creation error:', jobError);
      throw jobError;
    }

    console.log('✅ Created job:', jobData.id);

    // Step 4: Perform enhanced PDF document scraping
    try {
      await supabase
        .from('sds_jobs')
        .update({
          status: 'processing',
          message: 'Searching for PDF SDS documents with enhanced query variations...',
          progress: 25
        })
        .eq('id', jobData.id);

      const scrapedDocs = await scrapeSDSDocuments(product_name, 3);
      
      if (scrapedDocs.length > 0) {
        // Step 5: Store all found PDF documents
        console.log('💾 Storing', scrapedDocs.length, 'PDF documents from enhanced search');
        
        const documentsToInsert = scrapedDocs.map(doc => ({
          ...doc,
          job_id: jobData.id,
          created_at: new Date().toISOString()
        }));

        const { data: insertedDocs, error: insertError } = await supabase
          .from('sds_documents')
          .insert(documentsToInsert)
          .select();

        if (insertError) {
          console.error('❌ Document insertion error:', insertError);
          throw insertError;
        }

        // Step 6: Rank the new documents by confidence
        console.log('🎯 Calculating confidence scores for new documents...');
        const rankedNewDocs = confidenceScorer.rankDocuments(product_name, insertedDocs || []);
        
        // Limit to top 3 results
        const topThreeNewResults = rankedNewDocs.slice(0, 3);
        
        // Log confidence scores for debugging
        topThreeNewResults.forEach((doc, index) => {
          console.log(`📋 New Document ${index + 1}: ${doc.product_name} - Confidence: ${(doc.confidence.score * 100).toFixed(1)}% - Reasons: ${doc.confidence.reasons.join(', ')}`);
        });
        
        const topNewMatch = topThreeNewResults[0];
        
        // Step 7: Update job status to completed
        await supabase
          .from('sds_jobs')
          .update({
            status: 'completed',
            message: `Successfully found ${topThreeNewResults.length} PDF SDS documents using enhanced search`,
            progress: 100
          })
          .eq('id', jobData.id);

        console.log('✅ Enhanced search job completed successfully');

        // Auto-select new documents based on confidence only (≥70%)
        if (topNewMatch && topNewMatch.confidence.score >= 0.7) {
          console.log('✅ Auto-selecting top new match with good confidence:', topNewMatch.confidence.score);
          
          // Enhance document with extraction if needed
          const enhancedDocument = await enhanceDocumentWithExtraction(topNewMatch);
          
          return new Response(
            JSON.stringify({ 
              job_id: jobData.id,
              status: 'completed',
              results: [enhancedDocument],
              source: 'enhanced_google_cse_search',
              auto_selected: true,
              confidence_score: topNewMatch.confidence.score,
              match_reasons: topNewMatch.confidence.reasons,
              message: `Auto-selected best match (${(topNewMatch.confidence.score * 100).toFixed(1)}% confidence)${enhancedDocument.extraction_status === 'processing' ? ' - Extracting additional hazard data...' : ''}`
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }

        // Return top 3 results for multiple matches
        const enhancedNewResults = await Promise.all(
          topThreeNewResults.map(doc => enhanceDocumentWithExtraction(doc))
        );

        return new Response(
          JSON.stringify({ 
            job_id: jobData.id,
            status: 'completed',
            results: enhancedNewResults,
            source: 'enhanced_google_cse_search',
            auto_selected: false,
            message: `Found ${topThreeNewResults.length} PDF SDS documents using enhanced search - please select the best one`
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      } else {
        // No PDF documents found with any search variation
        await supabase
          .from('sds_jobs')
          .update({
            status: 'completed',
            message: 'No PDF SDS documents found with any search variation',
            progress: 100
          })
          .eq('id', jobData.id);

        return new Response(
          JSON.stringify({ 
            job_id: jobData.id,
            status: 'completed',
            results: [],
            source: 'enhanced_google_cse_search',
            auto_selected: false,
            message: 'No PDF SDS documents found with any search variation - try a different product name'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    } catch (scrapingError) {
      console.error('❌ Enhanced PDF document search process error:', scrapingError);
      
      // Update job status to failed
      await supabase
        .from('sds_jobs')
        .update({
          status: 'failed',
          error: scrapingError.message,
          message: 'Enhanced PDF document search process failed',
          progress: 0
        })
        .eq('id', jobData.id);

      return new Response(
        JSON.stringify({ 
          job_id: jobData.id,
          status: 'failed',
          results: [],
          error: 'Enhanced PDF document search process failed',
          message: scrapingError.message
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

  } catch (error) {
    console.error('❌ Enhanced SDS document search error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Enhanced document search failed',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
