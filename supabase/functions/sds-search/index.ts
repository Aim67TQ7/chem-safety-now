
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

const GOOGLE_API_KEY = Deno.env.get('GOOGLE_API_KEY');
const GOOGLE_CSE_ID = Deno.env.get('GOOGLE_CSE_ID');

interface SearchRequest {
  product_name: string;
  max_results?: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { product_name, max_results = 5 }: SearchRequest = await req.json();
    
    console.log('🔍 Enhanced SDS document search request:', { product_name, max_results });

    // Check for existing documents first
    const { data: existingDocs, error: existingError } = await supabase
      .from('sds_documents')
      .select('*')
      .ilike('product_name', `%${product_name}%`)
      .order('ai_extraction_confidence', { ascending: false })
      .limit(3);

    if (existingError) {
      console.error('❌ Error checking existing documents:', existingError);
    }

    console.log('📊 Found existing documents:', {
      count: existingDocs?.length || 0,
      documents: existingDocs?.map(doc => ({
        name: doc.product_name,
        confidence: doc.ai_extraction_confidence
      }))
    });

    if (!GOOGLE_API_KEY || !GOOGLE_CSE_ID) {
      console.error('❌ Google API credentials not configured');
      return new Response(
        JSON.stringify({ 
          documents: existingDocs || [],
          total: existingDocs?.length || 0,
          source: 'database_only',
          message: 'Google Search not configured - showing database results only'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🔍 Starting enhanced Google CSE SDS document search for:', product_name);

    // Enhanced search variations with better targeting
    const searchVariations = [
      `"${product_name}" "safety data sheet" filetype:pdf`,
      `"${product_name}" "SDS" filetype:pdf`,
      `"${product_name}" "MSDS" filetype:pdf`,
      `${product_name} "safety data sheet" site:fastenal.com`,
      `${product_name} "SDS" site:grainger.com`,
      `${product_name} "safety data sheet" site:fishersci.com`,
      `${product_name} "SDS" site:sigmaaldrich.com`,
      `${product_name} "safety data sheet" site:3m.com`,
      `"${product_name}" "safety data sheet" -site:irs.gov -site:sec.gov -site:wikipedia.org`
    ];

    console.log('🔍 Created', searchVariations.length, 'enhanced search variations');

    const allResults: any[] = [];
    const seenUrls = new Set<string>();

    // Try each search variation
    for (let i = 0; i < searchVariations.length && allResults.length < max_results; i++) {
      const query = searchVariations[i];
      console.log(`🔍 Trying search variation ${i + 1}/${searchVariations.length}:`, query.split(' ').slice(0, 4).join(' ') + '...');
      
      try {
        const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CSE_ID}&q=${encodeURIComponent(query)}&num=10`;
        
        const response = await fetch(searchUrl);
        const data = await response.json();

        if (data.items && data.items.length > 0) {
          console.log('✅ Found', data.items.length, 'results');
          
          // Enhanced filtering for SDS documents
          const validResults = data.items.filter((item: any) => {
            const title = (item.title || '').toLowerCase();
            const url = (item.link || '').toLowerCase();
            const snippet = (item.snippet || '').toLowerCase();
            
            // Must be PDF or have PDF indicators
            const isPdf = url.includes('.pdf') || item.mime === 'application/pdf' || item.fileFormat === 'PDF';
            
            // Must have SDS indicators
            const hasSDSIndicators = title.includes('safety data sheet') || 
                                   title.includes('sds') || 
                                   title.includes('msds') ||
                                   snippet.includes('safety data sheet') ||
                                   snippet.includes('sds');
            
            // Must not be from excluded domains
            const isValidDomain = !url.includes('irs.gov') && 
                                !url.includes('sec.gov') && 
                                !url.includes('wikipedia.org') &&
                                !url.includes('investopedia.com') &&
                                !url.includes('reddit.com') &&
                                !url.includes('facebook.com');
            
            // Prefer trusted chemical/industrial domains
            const isTrustedDomain = url.includes('fastenal.com') ||
                                  url.includes('grainger.com') ||
                                  url.includes('fishersci.com') ||
                                  url.includes('sigmaaldrich.com') ||
                                  url.includes('3m.com') ||
                                  url.includes('dupont.com') ||
                                  url.includes('dow.com') ||
                                  url.includes('basf.com');
            
            const isUnique = !seenUrls.has(url);
            
            const isValid = isPdf && hasSDSIndicators && isValidDomain && isUnique;
            
            console.log('📋 Document validation:', {
              title: title.substring(0, 40) + '...',
              isPdf,
              hasSDSIndicators,
              isValidDomain,
              isTrustedDomain,
              isValid
            });
            
            if (isValid) {
              seenUrls.add(url);
              return true;
            }
            return false;
          });

          console.log('📋 Filtered to', validResults.length, 'valid SDS documents from', data.items.length, 'total results');

          // Add results with enhanced confidence scoring
          for (const item of validResults) {
            if (allResults.length >= max_results) break;
            
            const confidence = calculateEnhancedConfidence(item.title, item.snippet, item.link, product_name);
            
            allResults.push({
              title: item.title || 'Unknown Document',
              url: item.link,
              snippet: item.snippet || '',
              confidence,
              source: 'web',
              search_query: product_name,
              is_trusted_domain: item.link.includes('fastenal.com') || 
                               item.link.includes('grainger.com') ||
                               item.link.includes('fishersci.com') ||
                               item.link.includes('sigmaaldrich.com')
            });
          }
          
          // Break early if we found results from trusted domains
          if (validResults.some(item => item.link.includes('fastenal.com') || item.link.includes('grainger.com'))) {
            console.log('✅ Found results from trusted domains, stopping early');
            break;
          }
        } else {
          console.log('📄 No results for variation', i + 1);
        }
      } catch (error) {
        console.error('❌ Search variation', i + 1, 'failed:', error.message);
        continue;
      }
    }

    // Create SDS document records for new web results
    const newDocuments: any[] = [];
    
    for (const result of allResults) {
      try {
        // Check if document already exists by URL
        const { data: duplicate } = await supabase
          .from('sds_documents')
          .select('id')
          .eq('source_url', result.url)
          .single();

        if (!duplicate) {
          // Create new document record with enhanced metadata
          const docData = {
            product_name: result.search_query,
            file_name: extractFileName(result.title, result.url),
            source_url: result.url,
            document_type: 'sds',
            extraction_status: 'pending',
            ai_extraction_confidence: result.confidence,
            extraction_quality_score: result.confidence,
            created_at: new Date().toISOString(),
            ai_extracted_data: {
              search_metadata: {
                search_query: product_name,
                title: result.title,
                snippet: result.snippet,
                is_trusted_domain: result.is_trusted_domain,
                search_confidence: result.confidence
              }
            }
          };

          const { data: newDoc, error: insertError } = await supabase
            .from('sds_documents')
            .insert(docData)
            .select()
            .single();

          if (insertError) {
            console.error('❌ Error creating document record:', insertError);
          } else {
            console.log('✅ Created new document record:', newDoc.id, newDoc.product_name);
            newDocuments.push(newDoc);
          }
        }
      } catch (error) {
        console.error('❌ Error processing search result:', error);
      }
    }

    console.log('✅ Created', newDocuments.length, 'new document records from enhanced search');

    // Combine and sort results
    const combinedResults = [
      ...(existingDocs || []),
      ...newDocuments
    ];

    // Sort by relevance/confidence with preference for trusted domains
    combinedResults.sort((a, b) => {
      const aConf = a.ai_extraction_confidence || 0;
      const bConf = b.ai_extraction_confidence || 0;
      const aIsTrusted = a.source_url?.includes('fastenal.com') || a.source_url?.includes('grainger.com');
      const bIsTrusted = b.source_url?.includes('fastenal.com') || b.source_url?.includes('grainger.com');
      
      if (aIsTrusted && !bIsTrusted) return -1;
      if (!aIsTrusted && bIsTrusted) return 1;
      
      return bConf - aConf;
    });

    const finalResults = combinedResults.slice(0, max_results);

    // Log results summary
    finalResults.forEach((result, index) => {
      const confidence = result.ai_extraction_confidence || 0;
      const source = existingDocs?.some(doc => doc.id === result.id) ? 'Database' : 'Web';
      const isTrusted = result.source_url?.includes('fastenal.com') || result.source_url?.includes('grainger.com');
      console.log(`📋 Result ${index + 1}: ${result.product_name} - Confidence: ${confidence.toFixed(1)}% - Source: ${source}${isTrusted ? ' (Trusted)' : ''}`);
    });

    return new Response(
      JSON.stringify({ 
        documents: finalResults,
        total: finalResults.length,
        new_documents: newDocuments.length,
        existing_documents: existingDocs?.length || 0,
        source: 'enhanced_search',
        search_query: product_name
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Enhanced SDS search error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Enhanced search failed',
        details: error.message,
        documents: [],
        total: 0
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// Enhanced confidence calculation
function calculateEnhancedConfidence(title: string, snippet: string, url: string, searchTerm: string): number {
  let confidence = 50; // Base confidence
  
  const titleLower = (title || '').toLowerCase();
  const snippetLower = (snippet || '').toLowerCase();
  const urlLower = (url || '').toLowerCase();
  const searchLower = searchTerm.toLowerCase();
  
  // Boost for exact matches
  if (titleLower.includes(searchLower)) confidence += 30;
  if (snippetLower.includes(searchLower)) confidence += 15;
  
  // Boost for SDS indicators
  if (titleLower.includes('safety data sheet')) confidence += 25;
  if (titleLower.includes('sds')) confidence += 20;
  if (titleLower.includes('msds')) confidence += 15;
  
  // Boost for trusted domains
  if (urlLower.includes('fastenal.com') || urlLower.includes('grainger.com')) confidence += 20;
  if (urlLower.includes('fishersci.com') || urlLower.includes('sigmaaldrich.com')) confidence += 15;
  if (urlLower.includes('3m.com') || urlLower.includes('dupont.com')) confidence += 10;
  
  // Boost for PDF files
  if (urlLower.includes('.pdf')) confidence += 10;
  
  // Penalize for certain indicators
  if (titleLower.includes('wikipedia') || titleLower.includes('investment')) confidence -= 30;
  if (urlLower.includes('reddit.com') || urlLower.includes('facebook.com')) confidence -= 25;
  
  return Math.min(Math.max(confidence, 0), 95);
}

function extractFileName(title: string, url: string): string {
  // Try to extract a meaningful filename
  const urlParts = url.split('/');
  const lastPart = urlParts[urlParts.length - 1];
  
  if (lastPart && lastPart.includes('.pdf')) {
    return lastPart;
  }
  
  // Fallback to cleaned title
  const cleanTitle = (title || 'Unknown').replace(/[^\w\s-]/g, '').trim();
  return `${cleanTitle.substring(0, 50)}.pdf`;
}
