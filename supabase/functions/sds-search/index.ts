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
  extraction_quality_score?: number;
  is_readable?: boolean;
}

interface GoogleSearchResult {
  title: string;
  link: string;
  snippet: string;
  fileFormat?: string;
}

interface PDFReadabilityResult {
  isReadable: boolean;
  extractedText: string;
  textLength: number;
  qualityScore: number;
  hasStructuredData: boolean;
}

async function testPDFReadability(url: string): Promise<PDFReadabilityResult> {
  try {
    console.log('🔍 Testing PDF readability for:', url);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SDS-Scraper/1.0)',
        'Accept': 'application/pdf,*/*'
      }
    });
    
    if (!response.ok) {
      console.log(`⚠️ Failed to download for readability test ${url}: ${response.status}`);
      return {
        isReadable: false,
        extractedText: '',
        textLength: 0,
        qualityScore: 0,
        hasStructuredData: false
      };
    }
    
    const contentType = response.headers.get('content-type') || '';
    
    if (!contentType.includes('application/pdf') && !url.toLowerCase().includes('.pdf')) {
      console.log('⚠️ Not a PDF document');
      return {
        isReadable: false,
        extractedText: '',
        textLength: 0,
        qualityScore: 0,
        hasStructuredData: false
      };
    }
    
    const pdfArrayBuffer = await response.arrayBuffer();
    
    if (pdfArrayBuffer.byteLength === 0) {
      console.log('⚠️ Empty PDF document');
      return {
        isReadable: false,
        extractedText: '',
        textLength: 0,
        qualityScore: 0,
        hasStructuredData: false
      };
    }
    
    // Try to extract text using simple decoding first
    const pdfText = new TextDecoder('utf-8', { fatal: false }).decode(pdfArrayBuffer);
    
    // Check for readable text indicators
    const sdsIndicators = [
      'safety data sheet',
      'section 1',
      'hazard identification',
      'ghs',
      'h-codes',
      'h codes',
      'pictogram',
      'signal word',
      'cas number'
    ];
    
    let foundIndicators = 0;
    const lowerText = pdfText.toLowerCase();
    
    sdsIndicators.forEach(indicator => {
      if (lowerText.includes(indicator)) {
        foundIndicators++;
      }
    });
    
    // Check for structured data
    const hasHCodes = /h\d{3}/i.test(pdfText);
    const hasCAS = /\d{2,7}-\d{2}-\d/.test(pdfText);
    const hasSignalWord = /(danger|warning)/i.test(pdfText);
    const hasStructuredData = hasHCodes || hasCAS || hasSignalWord;
    
    // Calculate quality score based on multiple factors
    let qualityScore = 0;
    
    // Text length score (0-30 points)
    if (pdfText.length > 1000) qualityScore += 30;
    else if (pdfText.length > 500) qualityScore += 15;
    
    // SDS indicators score (0-40 points)
    qualityScore += (foundIndicators / sdsIndicators.length) * 40;
    
    // Structured data score (0-30 points)
    if (hasHCodes) qualityScore += 10;
    if (hasCAS) qualityScore += 10;
    if (hasSignalWord) qualityScore += 10;
    
    const isReadable = qualityScore >= 30 && foundIndicators >= 2;
    
    console.log(`📊 Readability test results - Score: ${qualityScore.toFixed(1)}, Readable: ${isReadable}, Indicators: ${foundIndicators}/${sdsIndicators.length}`);
    
    return {
      isReadable,
      extractedText: pdfText,
      textLength: pdfText.length,
      qualityScore,
      hasStructuredData
    };
    
  } catch (error) {
    console.error(`❌ Error testing PDF readability for ${url}:`, error);
    return {
      isReadable: false,
      extractedText: '',
      textLength: 0,
      qualityScore: 0,
      hasStructuredData: false
    };
  }
}

async function checkForExistingHigherQualityDocument(productName: string, sourceUrl: string, qualityScore: number): Promise<boolean> {
  try {
    console.log('🔍 Checking for existing higher quality documents...');
    
    // Search for similar documents by product name
    const { data: existingDocs, error } = await supabase
      .from('sds_documents')
      .select('id, product_name, source_url, extraction_quality_score, manufacturer, cas_number')
      .or(`product_name.ilike.%${productName}%,manufacturer.ilike.%${productName}%,cas_number.ilike.%${productName}%`);
    
    if (error) {
      console.error('❌ Error checking existing documents:', error);
      return false;
    }
    
    if (!existingDocs || existingDocs.length === 0) {
      console.log('✅ No existing documents found');
      return false;
    }
    
    // Check if we already have this exact URL
    const exactMatch = existingDocs.find(doc => doc.source_url === sourceUrl);
    if (exactMatch) {
      console.log('⚠️ Document with this URL already exists');
      return true;
    }
    
    // Check if we have a higher quality document for the same product
    const higherQualityExists = existingDocs.some(doc => {
      const existingScore = doc.extraction_quality_score || 0;
      return existingScore >= qualityScore;
    });
    
    if (higherQualityExists) {
      console.log(`⚠️ Higher quality document already exists (score >= ${qualityScore})`);
      return true;
    }
    
    console.log('✅ No higher quality document found, proceed with storage');
    return false;
    
  } catch (error) {
    console.error('❌ Error checking for existing documents:', error);
    return false;
  }
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

function extractSDSDataFromContent(content: string, productName: string, sourceUrl: string): ScrapedSDSDocument {
  // Extract manufacturer from content
  const manufacturerMatch = content.match(/manufacturer[:\s]*([^\n\r]{1,100})/i);
  const manufacturer = manufacturerMatch ? manufacturerMatch[1].trim() : undefined;
  
  // Extract CAS number
  const casMatch = content.match(/CAS[\s#]*:?\s*(\d{2,7}-\d{2}-\d)/i);
  const cas_number = casMatch ? casMatch[1] : undefined;
  
  // Extract H-codes
  const hCodeMatches = content.match(/H\d{3}[^\n\r]*/gi) || [];
  const h_codes = hCodeMatches.map(match => {
    const code = match.match(/H\d{3}/)?.[0] || '';
    const description = match.replace(/H\d{3}\s*:?\s*/, '').trim();
    return { code, description };
  });
  
  // Extract signal word
  const signalWordMatch = content.match(/signal word[:\s]*(danger|warning)/i);
  const signal_word = signalWordMatch ? signalWordMatch[1].toLowerCase() : undefined;
  
  // Extract hazard statements
  const hazardStatements = hCodeMatches.map(match => 
    match.replace(/H\d{3}\s*:?\s*/, '').trim()
  ).filter(statement => statement.length > 10);
  
  // Extract precautionary statements
  const pCodeMatches = content.match(/P\d{3}[^\n\r]*/gi) || [];
  const precautionary_statements = pCodeMatches.map(match => 
    match.replace(/P\d{3}\s*:?\s*/, '').trim()
  );
  
  // Extract GHS pictograms
  const pictogramMatches = content.match(/GHS\d{2}|flame|skull|exclamation|health hazard|corrosion/gi) || [];
  const pictograms = pictogramMatches.map(match => ({
    ghs_code: match.match(/GHS\d{2}/i)?.[0] || '',
    name: match.toLowerCase(),
    description: `${match} pictogram`
  }));
  
  return {
    product_name: productName,
    manufacturer,
    cas_number,
    source_url: sourceUrl,
    file_name: `${productName.replace(/[^a-zA-Z0-9]/g, '_')}_SDS.pdf`,
    document_type: 'safety_data_sheet',
    h_codes: h_codes.length > 0 ? h_codes : undefined,
    pictograms: pictograms.length > 0 ? pictograms : undefined,
    signal_word,
    hazard_statements: hazardStatements.length > 0 ? hazardStatements : undefined,
    precautionary_statements: precautionary_statements.length > 0 ? precautionary_statements : undefined
  };
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

async function downloadAndValidateDocument(url: string, productName: string): Promise<ScrapedSDSDocument | null> {
  try {
    console.log('📥 Downloading and validating PDF document:', url);
    
    // Step 1: Test PDF readability first
    const readabilityResult = await testPDFReadability(url);
    
    if (!readabilityResult.isReadable) {
      console.log(`⚠️ Document failed readability test: ${url} (Score: ${readabilityResult.qualityScore})`);
      return null;
    }
    
    // Step 2: Check for existing higher quality documents
    const hasHigherQuality = await checkForExistingHigherQualityDocument(
      productName, 
      url, 
      readabilityResult.qualityScore
    );
    
    if (hasHigherQuality) {
      console.log(`⚠️ Skipping document - higher quality version already exists: ${url}`);
      return null;
    }
    
    console.log('✅ Document passed validation checks:', url);
    
    // Step 3: Create document with quality metrics
    const document: ScrapedSDSDocument = {
      product_name: productName,
      source_url: url,
      file_name: `${productName.replace(/[^a-zA-Z0-9]/g, '_')}_SDS.pdf`,
      document_type: 'safety_data_sheet',
      extraction_quality_score: readabilityResult.qualityScore,
      is_readable: readabilityResult.isReadable
    };
    
    // Step 4: Extract basic data from readable text
    if (readabilityResult.hasStructuredData) {
      const extractedData = extractSDSDataFromContent(readabilityResult.extractedText, productName, url);
      Object.assign(document, extractedData);
    }
    
    return document;
    
  } catch (error) {
    console.error(`❌ Error downloading/validating ${url}:`, error);
    return null;
  }
}

async function scrapeSDSDocuments(productName: string, maxResults: number = 3): Promise<ScrapedSDSDocument[]> {
  console.log('🔍 Starting Google CSE SDS document search with quality validation for:', productName);
  
  try {
    // Step 1: Search using Google CSE with PDF focus
    const searchResults = await searchGoogleCSE(productName, maxResults * 2); // Get more results for filtering
    
    if (searchResults.length === 0) {
      console.log('📄 No Google CSE results found');
      return [];
    }
    
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
    
    // Step 3: Process PDF documents with quality validation
    const validatedDocs: ScrapedSDSDocument[] = [];
    
    for (let i = 0; i < Math.min(pdfResults.length, maxResults * 3); i++) { // Test more than needed
      const result = pdfResults[i];
      
      try {
        const doc = await downloadAndValidateDocument(result.link, productName);
        if (doc) {
          validatedDocs.push(doc);
          console.log(`✅ Successfully validated PDF: ${result.title} (Score: ${doc.extraction_quality_score})`);
          
          // Stop when we have enough high-quality documents
          if (validatedDocs.length >= maxResults) {
            break;
          }
        }
      } catch (error) {
        console.error(`❌ Error processing ${result.link}:`, error);
        continue;
      }
    }
    
    // Step 4: Sort by quality score and return top results
    const sortedDocs = validatedDocs.sort((a, b) => (b.extraction_quality_score || 0) - (a.extraction_quality_score || 0));
    const topQualityDocs = sortedDocs.slice(0, maxResults);
    
    console.log(`✅ Document validation completed, found ${topQualityDocs.length} high-quality PDF documents`);
    return topQualityDocs;
    
  } catch (error) {
    console.error('❌ SDS document search error:', error);
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
    
    console.log('🔍 SDS document search request with quality validation:', { product_name, max_results });

    // Step 1: Search existing documents in the database, prioritize high-quality ones
    const { data: existingDocs, error: searchError } = await supabase
      .from('sds_documents')
      .select('*')
      .or(`product_name.ilike.%${product_name}%,manufacturer.ilike.%${product_name}%,cas_number.ilike.%${product_name}%`)
      .not('extraction_quality_score', 'is', null) // Prioritize documents with quality scores
      .order('extraction_quality_score', { ascending: false })
      .limit(max_results);

    if (searchError) {
      console.error('❌ Database search error:', searchError);
      throw searchError;
    }

    console.log('📊 Found existing documents:', existingDocs?.length || 0);

    // Step 2: If we have results, rank them by confidence and limit to top 3
    if (existingDocs && existingDocs.length > 0) {
      console.log('🎯 Calculating confidence scores for existing documents...');
      
      const rankedDocs = confidenceScorer.rankDocuments(product_name, existingDocs);
      
      // Limit to top 3 results
      const topThreeResults = rankedDocs.slice(0, 3);
      
      // Log confidence scores and quality scores for debugging
      topThreeResults.forEach((doc, index) => {
        const qualityScore = doc.extraction_quality_score || 0;
        console.log(`📋 Document ${index + 1}: ${doc.product_name} - Confidence: ${(doc.confidence.score * 100).toFixed(1)}% - Quality: ${qualityScore.toFixed(1)} - Reasons: ${doc.confidence.reasons.join(', ')}`);
      });
      
      const topMatch = topThreeResults[0];
      
      // Auto-select if confidence is high enough and quality is good
      if (topMatch.confidence.autoSelect && topMatch.confidence.score >= 0.9 && (topMatch.extraction_quality_score || 0) >= 50) {
        console.log('✅ Auto-selecting top match with high confidence and quality:', topMatch.confidence.score);
        
        // Enhance document with extraction if needed
        const enhancedDocument = await enhanceDocumentWithExtraction(topMatch);
        
        return new Response(
          JSON.stringify({ 
            results: [enhancedDocument],
            source: 'database',
            auto_selected: true,
            confidence_score: topMatch.confidence.score,
            quality_score: topMatch.extraction_quality_score,
            match_reasons: topMatch.confidence.reasons,
            message: `Auto-selected best match (${(topMatch.confidence.score * 100).toFixed(1)}% confidence, ${(topMatch.extraction_quality_score || 0).toFixed(1)} quality)${enhancedDocument.extraction_status === 'processing' ? ' - Extracting additional hazard data...' : ''}`
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
      
      // Return top 3 ranked results for user selection with extraction enhancement
      const enhancedResults = await Promise.all(
        topThreeResults.map(doc => enhanceDocumentWithExtraction(doc))
      );
      
      return new Response(
        JSON.stringify({ 
          results: enhancedResults,
          source: 'database',
          auto_selected: false,
          message: `Found ${topThreeResults.length} potential matches - please select the best one`
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Step 3: No existing results found, create job and start PDF document search with quality validation
    console.log('💾 Creating SDS job for validated PDF document search:', product_name);
    
    const { data: jobData, error: jobError } = await supabase
      .from('sds_jobs')
      .insert({
        product_name,
        max_results: 3, // Limit new search results to 3 as well
        status: 'pending',
        message: 'Starting Google CSE PDF document search with quality validation...'
      })
      .select()
      .single();

    if (jobError) {
      console.error('❌ Job creation error:', jobError);
      throw jobError;
    }

    console.log('✅ Created job:', jobData.id);

    // Step 4: Perform PDF document scraping with quality validation
    try {
      await supabase
        .from('sds_jobs')
        .update({
          status: 'processing',
          message: 'Searching and validating PDF SDS documents...',
          progress: 25
        })
        .eq('id', jobData.id);

      const scrapedDocs = await scrapeSDSDocuments(product_name, 3);
      
      if (scrapedDocs.length > 0) {
        // Step 5: Store validated PDF documents in database
        console.log('💾 Storing', scrapedDocs.length, 'validated PDF documents');
        
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

        // Step 6: Rank the new documents by confidence and limit to top 3
        console.log('🎯 Calculating confidence scores for new validated documents...');
        const rankedNewDocs = confidenceScorer.rankDocuments(product_name, insertedDocs || []);
        
        // Limit to top 3 results
        const topThreeNewResults = rankedNewDocs.slice(0, 3);
        
        // Log confidence scores and quality scores for debugging
        topThreeNewResults.forEach((doc, index) => {
          const qualityScore = doc.extraction_quality_score || 0;
          console.log(`📋 New Document ${index + 1}: ${doc.product_name} - Confidence: ${(doc.confidence.score * 100).toFixed(1)}% - Quality: ${qualityScore.toFixed(1)} - Reasons: ${doc.confidence.reasons.join(', ')}`);
        });
        
        const topNewMatch = topThreeNewResults[0];
        
        // Step 7: Update job status to completed
        await supabase
          .from('sds_jobs')
          .update({
            status: 'completed',
            message: `Successfully found and validated ${topThreeNewResults.length} high-quality PDF SDS documents`,
            progress: 100
          })
          .eq('id', jobData.id);

        console.log('✅ Job completed successfully');

        // Auto-select if confidence is high enough and quality is good
        if (topNewMatch && topNewMatch.confidence.autoSelect && topNewMatch.confidence.score >= 0.9 && (topNewMatch.extraction_quality_score || 0) >= 50) {
          console.log('✅ Auto-selecting top new match with high confidence and quality:', topNewMatch.confidence.score);
          
          // Enhance document with extraction if needed
          const enhancedDocument = await enhanceDocumentWithExtraction(topNewMatch);
          
          return new Response(
            JSON.stringify({ 
              job_id: jobData.id,
              status: 'completed',
              results: [enhancedDocument],
              source: 'google_cse_pdf_search',
              auto_selected: true,
              confidence_score: topNewMatch.confidence.score,
              quality_score: topNewMatch.extraction_quality_score,
              match_reasons: topNewMatch.confidence.reasons,
              message: `Auto-selected best match (${(topNewMatch.confidence.score * 100).toFixed(1)}% confidence, ${(topNewMatch.extraction_quality_score || 0).toFixed(1)} quality)${enhancedDocument.extraction_status === 'processing' ? ' - Extracting additional hazard data...' : ''}`
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }

        // Return enhanced top 3 results for multiple matches
        const enhancedNewResults = await Promise.all(
          topThreeNewResults.map(doc => enhanceDocumentWithExtraction(doc))
        );

        return new Response(
          JSON.stringify({ 
            job_id: jobData.id,
            status: 'completed',
            results: enhancedNewResults,
            source: 'google_cse_pdf_search',
            auto_selected: false,
            message: `Found ${topThreeNewResults.length} validated PDF SDS documents - please select the best one`
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      } else {
        // No validated PDF documents found
        await supabase
          .from('sds_jobs')
          .update({
            status: 'completed',
            message: 'No readable/extractable PDF SDS documents found for this search term',
            progress: 100
          })
          .eq('id', jobData.id);

        return new Response(
          JSON.stringify({ 
            job_id: jobData.id,
            status: 'completed',
            results: [],
            source: 'google_cse_pdf_search',
            auto_selected: false,
            message: 'No readable/extractable PDF SDS documents found for this search term'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    } catch (scrapingError) {
      console.error('❌ PDF document search and validation process error:', scrapingError);
      
      // Update job status to failed
      await supabase
        .from('sds_jobs')
        .update({
          status: 'failed',
          error: scrapingError.message,
          message: 'PDF document search and validation process failed',
          progress: 0
        })
        .eq('id', jobData.id);

      return new Response(
        JSON.stringify({ 
          job_id: jobData.id,
          status: 'failed',
          results: [],
          error: 'PDF document search and validation process failed',
          message: scrapingError.message
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

  } catch (error) {
    console.error('❌ SDS document search error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Document search failed',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
