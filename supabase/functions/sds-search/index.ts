
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
    const { product_name, max_results = 3 }: SearchRequest = await req.json();
    
    console.log('🔍 Enhanced SDS document search request:', { product_name, max_results });

    // Check for existing documents first
    const { data: existingDocs, error: existingError } = await supabase
      .from('sds_documents')
      .select('*')
      .ilike('product_name', `%${product_name}%`)
      .order('created_at', { ascending: false })
      .limit(5);

    if (existingError) {
      console.error('❌ Error checking existing documents:', existingError);
    }

    console.log('📊 Found existing documents:', existingDocs?.length || 0);

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

    // Create search variations with better query construction
    const searchVariations = [
      `"${product_name}" "safety data sheet" filetype:pdf`,
      `"${product_name}" "MSDS" filetype:pdf`,
      `${product_name} "safety data sheet" filetype:pdf`,
      `${product_name} "SDS" filetype:pdf`,
      `"${product_name}" site:fastenal.com filetype:pdf`,
      `"${product_name}" site:grainger.com filetype:pdf`,
      `"${product_name}" safety data sheet`
    ];

    console.log('🔍 Created', searchVariations.length, 'search variations for:', product_name);

    const allResults: any[] = [];
    const seenUrls = new Set<string>();

    // Try each search variation
    for (let i = 0; i < searchVariations.length && allResults.length < max_results; i++) {
      const query = searchVariations[i];
      console.log('🔍 Trying search variation', i + 1 + '/' + searchVariations.length + ':', query.split(' ').slice(0, 3).join(' ') + (query.split(' ').length > 3 ? '...' : ''));
      
      try {
        const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CSE_ID}&q=${encodeURIComponent(query)}&num=10`;
        
        console.log('📝 Query:', query);
        
        const response = await fetch(searchUrl);
        const data = await response.json();

        if (data.items && data.items.length > 0) {
          console.log('✅ Found', data.items.length, 'results with variation:', query.split('"')[1] || 'Flexible search');
          
          // Filter for PDF documents and avoid duplicates
          const pdfResults = data.items.filter((item: any) => {
            const isPdf = item.link && (
              item.link.toLowerCase().includes('.pdf') || 
              item.mime === 'application/pdf' ||
              item.fileFormat === 'PDF'
            );
            const isUnique = !seenUrls.has(item.link);
            if (isPdf && isUnique) {
              seenUrls.add(item.link);
              return true;
            }
            return false;
          });

          console.log('📋 Filtered to', pdfResults.length, 'PDF documents from', data.items.length, 'total results');

          // Add results with enhanced metadata
          for (const item of pdfResults) {
            if (allResults.length >= max_results) break;
            
            allResults.push({
              title: item.title || 'Unknown Document',
              url: item.link,
              snippet: item.snippet || '',
              confidence: calculateConfidence(item.title, item.snippet, product_name),
              source: 'web',
              search_query: product_name // Preserve original search query
            });
          }
        } else {
          console.log('📄 No results for variation', i + 1 + ':', query.split('"')[1] || 'Generic search');
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
        // Check if document already exists by URL or similar title
        const { data: duplicate } = await supabase
          .from('sds_documents')
          .select('id')
          .eq('source_url', result.url)
          .single();

        if (!duplicate) {
          // Create new document record with preserved search query
          const docData = {
            product_name: result.search_query, // Use original search query instead of generic title
            file_name: extractFileName(result.title, result.url),
            source_url: result.url,
            document_type: 'sds',
            extraction_status: 'pending',
            ai_extraction_confidence: result.confidence || 75,
            created_at: new Date().toISOString()
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

    console.log('✅ Created', newDocuments.length, 'document records from enhanced CSE search');

    // Combine existing and new documents
    const combinedResults = [
      ...(existingDocs || []),
      ...newDocuments
    ];

    // Sort by relevance/confidence
    combinedResults.sort((a, b) => {
      const aConf = a.ai_extraction_confidence || 0;
      const bConf = b.ai_extraction_confidence || 0;
      return bConf - aConf;
    });

    // Log results summary
    combinedResults.forEach((result, index) => {
      const confidence = result.ai_extraction_confidence || 0;
      const source = existingDocs?.some(doc => doc.id === result.id) ? 'Database' : 'Web';
      console.log(`📋 Result ${index + 1}: ${result.product_name} - Confidence: ${confidence.toFixed(1)}% - Source: ${source}`);
    });

    return new Response(
      JSON.stringify({ 
        documents: combinedResults.slice(0, max_results),
        total: combinedResults.length,
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
        search_query: null
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

// Helper functions
function calculateConfidence(title: string, snippet: string, searchTerm: string): number {
  let confidence = 50; // Base confidence
  
  const titleLower = (title || '').toLowerCase();
  const snippetLower = (snippet || '').toLowerCase();
  const searchLower = searchTerm.toLowerCase();
  
  // Boost for exact matches
  if (titleLower.includes(searchLower)) confidence += 30;
  if (snippetLower.includes(searchLower)) confidence += 15;
  
  // Boost for SDS indicators
  if (titleLower.includes('safety data sheet') || titleLower.includes('sds')) confidence += 20;
  if (titleLower.includes('msds')) confidence += 15;
  
  // Boost for trusted domains
  if (title.includes('fastenal.com') || title.includes('grainger.com')) confidence += 10;
  
  return Math.min(confidence, 95);
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
