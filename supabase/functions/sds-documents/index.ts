
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  document_type?: string;
  extraction_status?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const search = url.searchParams.get('search');
    const document_type = url.searchParams.get('document_type');
    const extraction_status = url.searchParams.get('extraction_status');

    console.log('📋 Fetching SDS documents with params:', { page, limit, search, document_type, extraction_status });

    // Build the query
    let query = supabase
      .from('sds_documents')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Add filters if provided
    if (search) {
      query = query.or(`product_name.ilike.%${search}%,manufacturer.ilike.%${search}%,cas_number.ilike.%${search}%`);
    }

    if (document_type) {
      query = query.eq('document_type', document_type);
    }

    if (extraction_status) {
      query = query.eq('extraction_status', extraction_status);
    }

    // Add pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: documents, error, count } = await query;

    if (error) {
      console.error('❌ Database query error:', error);
      throw error;
    }

    console.log('✅ Retrieved documents:', documents?.length || 0, 'of', count || 0, 'total');

    return new Response(
      JSON.stringify({ 
        documents: documents || [],
        count: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
        hasMore: count ? (offset + limit) < count : false
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Documents fetch error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch documents',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
