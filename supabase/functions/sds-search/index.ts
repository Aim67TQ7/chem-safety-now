
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

async function scrapeSDSDocuments(productName: string, maxResults: number = 10): Promise<ScrapedSDSDocument[]> {
  console.log('🔍 Starting SDS scraping for:', productName);
  
  try {
    // Example scraping implementation - you can replace this with actual scraper logic
    // This could call an external scraping service or implement web scraping
    const searchQuery = encodeURIComponent(productName);
    
    // Mock scraper results for now - replace with actual scraping logic
    const mockResults: ScrapedSDSDocument[] = [
      {
        product_name: productName,
        manufacturer: 'Example Chemical Co.',
        cas_number: '108-88-3',
        source_url: `https://example-sds-site.com/sds/${searchQuery}`,
        file_name: `${productName}_SDS.pdf`,
        document_type: 'safety_data_sheet',
        signal_word: 'Danger',
        h_codes: [
          { code: 'H225', description: 'Highly flammable liquid and vapour' },
          { code: 'H304', description: 'May be fatal if swallowed and enters airways' }
        ],
        pictograms: [
          { ghs_code: 'GHS02', name: 'Flame' },
          { ghs_code: 'GHS08', name: 'Health hazard' }
        ],
        hazard_statements: ['Highly flammable liquid and vapour', 'May be fatal if swallowed and enters airways'],
        precautionary_statements: ['Keep away from heat/sparks/open flames/hot surfaces', 'Do NOT induce vomiting']
      }
    ];
    
    // TODO: Replace with actual scraping implementation
    // For example, you could:
    // 1. Call an external scraping API
    // 2. Use a headless browser to scrape SDS websites
    // 3. Query multiple chemical databases
    
    console.log('✅ Scraping completed, found:', mockResults.length, 'documents');
    return mockResults.slice(0, maxResults);
    
  } catch (error) {
    console.error('❌ Scraping error:', error);
    return [];
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
        message: 'Starting SDS document scraping...'
      })
      .select()
      .single();

    if (jobError) {
      console.error('❌ Job creation error:', jobError);
      throw jobError;
    }

    console.log('✅ Created job:', jobData.id);

    // Step 4: Perform scraping
    try {
      await supabase
        .from('sds_jobs')
        .update({
          status: 'processing',
          message: 'Scraping SDS documents...',
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
            message: `Successfully found and stored ${insertedDocs?.length || 0} SDS documents`,
            progress: 100
          })
          .eq('id', jobData.id);

        console.log('✅ Job completed successfully');

        return new Response(
          JSON.stringify({ 
            job_id: jobData.id,
            status: 'completed',
            results: insertedDocs || [],
            source: 'scraper',
            message: `Found ${insertedDocs?.length || 0} new SDS documents`
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
            message: 'No SDS documents found for this search term',
            progress: 100
          })
          .eq('id', jobData.id);

        return new Response(
          JSON.stringify({ 
            job_id: jobData.id,
            status: 'completed',
            results: [],
            source: 'scraper',
            message: 'No SDS documents found for this search term'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    } catch (scrapingError) {
      console.error('❌ Scraping process error:', scrapingError);
      
      // Update job status to failed
      await supabase
        .from('sds_jobs')
        .update({
          status: 'failed',
          error: scrapingError.message,
          message: 'Scraping process failed',
          progress: 0
        })
        .eq('id', jobData.id);

      return new Response(
        JSON.stringify({ 
          job_id: jobData.id,
          status: 'failed',
          results: [],
          error: 'Scraping process failed',
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
