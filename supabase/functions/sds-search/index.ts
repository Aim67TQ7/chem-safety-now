
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

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

async function searchGoogleCSE(productName: string, maxResults: number = 10): Promise<GoogleSearchResult[]> {
  const apiKey = Deno.env.get('GOOGLE_API_KEY');
  const cseId = Deno.env.get('GOOGLE_CSE_ID');
  
  if (!apiKey || !cseId) {
    console.error('❌ Missing Google API credentials');
    throw new Error('Google API credentials not configured');
  }

  // Construct search query for SDS documents
  const searchQuery = `"${productName}" safety data sheet filetype:pdf OR "SDS" OR "MSDS"`;
  const encodedQuery = encodeURIComponent(searchQuery);
  
  const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cseId}&q=${encodedQuery}&num=${Math.min(maxResults, 10)}`;
  
  console.log('🔍 Searching Google CSE for:', productName);
  
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

async function downloadAndParseDocument(url: string, productName: string): Promise<ScrapedSDSDocument | null> {
  try {
    console.log('📥 Attempting to download:', url);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SDS-Scraper/1.0)'
      }
    });
    
    if (!response.ok) {
      console.log(`⚠️ Failed to download ${url}: ${response.status}`);
      return null;
    }
    
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('application/pdf')) {
      // For PDF files, we can't parse content directly in edge function
      // Return basic document info with source URL for future processing
      return {
        product_name: productName,
        source_url: url,
        file_name: `${productName.replace(/[^a-zA-Z0-9]/g, '_')}_SDS.pdf`,
        document_type: 'safety_data_sheet'
      };
    } else if (contentType.includes('text/html') || contentType.includes('text/plain')) {
      // Parse HTML/text content for SDS information
      const content = await response.text();
      return extractSDSDataFromContent(content, productName, url);
    }
    
    return null;
  } catch (error) {
    console.error(`❌ Error downloading ${url}:`, error);
    return null;
  }
}

async function scrapeSDSDocuments(productName: string, maxResults: number = 10): Promise<ScrapedSDSDocument[]> {
  console.log('🔍 Starting Google CSE SDS scraping for:', productName);
  
  try {
    // Step 1: Search using Google CSE
    const searchResults = await searchGoogleCSE(productName, maxResults);
    
    if (searchResults.length === 0) {
      console.log('📄 No Google CSE results found');
      return [];
    }
    
    // Step 2: Filter results for likely SDS documents
    const sdsResults = searchResults.filter(result => {
      const titleLower = result.title.toLowerCase();
      const snippetLower = result.snippet.toLowerCase();
      const linkLower = result.link.toLowerCase();
      
      return (
        titleLower.includes('safety data sheet') ||
        titleLower.includes('sds') ||
        titleLower.includes('msds') ||
        snippetLower.includes('safety data sheet') ||
        snippetLower.includes('hazard') ||
        linkLower.includes('sds') ||
        linkLower.includes('msds') ||
        result.fileFormat === 'PDF'
      );
    });
    
    console.log(`📋 Filtered to ${sdsResults.length} potential SDS documents`);
    
    // Step 3: Download and parse documents
    const scrapedDocs: ScrapedSDSDocument[] = [];
    
    for (let i = 0; i < Math.min(sdsResults.length, maxResults); i++) {
      const result = sdsResults[i];
      
      try {
        const doc = await downloadAndParseDocument(result.link, productName);
        if (doc) {
          scrapedDocs.push(doc);
          console.log(`✅ Successfully processed: ${result.title}`);
        }
      } catch (error) {
        console.error(`❌ Error processing ${result.link}:`, error);
        continue;
      }
    }
    
    console.log(`✅ Scraping completed, processed ${scrapedDocs.length} documents`);
    return scrapedDocs;
    
  } catch (error) {
    console.error('❌ SDS scraping error:', error);
    throw error;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { product_name, max_results = 10 }: SearchRequest = await req.json();
    
    console.log('🔍 SDS search request:', { product_name, max_results });

    // Step 1: Search existing documents in the database
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

    // Step 2: If we have results, return them immediately
    if (existingDocs && existingDocs.length > 0) {
      return new Response(
        JSON.stringify({ 
          results: existingDocs,
          source: 'database'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Step 3: No existing results found, create job and start scraping
    console.log('💾 Creating SDS job for:', product_name);
    
    const { data: jobData, error: jobError } = await supabase
      .from('sds_jobs')
      .insert({
        product_name,
        max_results,
        status: 'pending',
        message: 'Starting Google CSE SDS document scraping...'
      })
      .select()
      .single();

    if (jobError) {
      console.error('❌ Job creation error:', jobError);
      throw jobError;
    }

    console.log('✅ Created job:', jobData.id);

    // Step 4: Perform scraping using Google CSE
    try {
      await supabase
        .from('sds_jobs')
        .update({
          status: 'processing',
          message: 'Searching Google CSE for SDS documents...',
          progress: 25
        })
        .eq('id', jobData.id);

      const scrapedDocs = await scrapeSDSDocuments(product_name, max_results);
      
      if (scrapedDocs.length > 0) {
        // Step 5: Store scraped documents in database
        console.log('💾 Storing', scrapedDocs.length, 'scraped documents');
        
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

        // Step 6: Update job status to completed
        await supabase
          .from('sds_jobs')
          .update({
            status: 'completed',
            message: `Successfully found and stored ${insertedDocs?.length || 0} SDS documents via Google CSE`,
            progress: 100
          })
          .eq('id', jobData.id);

        console.log('✅ Job completed successfully');

        return new Response(
          JSON.stringify({ 
            job_id: jobData.id,
            status: 'completed',
            results: insertedDocs || [],
            source: 'google_cse_scraper',
            message: `Found ${insertedDocs?.length || 0} new SDS documents via Google CSE`
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      } else {
        // No documents found via scraping
        await supabase
          .from('sds_jobs')
          .update({
            status: 'completed',
            message: 'No SDS documents found via Google CSE for this search term',
            progress: 100
          })
          .eq('id', jobData.id);

        return new Response(
          JSON.stringify({ 
            job_id: jobData.id,
            status: 'completed',
            results: [],
            source: 'google_cse_scraper',
            message: 'No SDS documents found via Google CSE for this search term'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    } catch (scrapingError) {
      console.error('❌ Google CSE scraping process error:', scrapingError);
      
      // Update job status to failed
      await supabase
        .from('sds_jobs')
        .update({
          status: 'failed',
          error: scrapingError.message,
          message: 'Google CSE scraping process failed',
          progress: 0
        })
        .eq('id', jobData.id);

      return new Response(
        JSON.stringify({ 
          job_id: jobData.id,
          status: 'failed',
          results: [],
          error: 'Google CSE scraping process failed',
          message: scrapingError.message
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

  } catch (error) {
    console.error('❌ SDS search error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Search failed',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
