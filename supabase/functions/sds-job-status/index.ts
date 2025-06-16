
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const jobId = url.pathname.split('/').pop();

    if (!jobId) {
      return new Response(
        JSON.stringify({ error: 'Job ID is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('📊 Checking job status for:', jobId);

    // Get job status
    const { data: jobData, error: jobError } = await supabase
      .from('sds_jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError) {
      console.error('❌ Job query error:', jobError);
      throw jobError;
    }

    if (!jobData) {
      return new Response(
        JSON.stringify({ error: 'Job not found' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // If job is completed, get the results
    let results = [];
    if (jobData.status === 'completed') {
      const { data: documents } = await supabase
        .from('sds_documents')
        .select('*')
        .eq('job_id', jobId);
      
      results = documents || [];
    }

    return new Response(
      JSON.stringify({
        id: jobData.id,
        status: jobData.status,
        progress: jobData.progress,
        message: jobData.message,
        error: jobData.error,
        results
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Job status error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to get job status',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
