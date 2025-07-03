import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { 
      error_type,
      error_level = 'error',
      error_message,
      error_stack,
      error_code,
      facility_id,
      user_agent,
      url,
      session_id,
      additional_context = {}
    } = await req.json()

    // Validate required fields
    if (!error_type || !error_message) {
      return new Response(
        JSON.stringify({ error: 'error_type and error_message are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Insert error into tracking table
    const { data, error } = await supabaseClient
      .from('error_tracking')
      .insert({
        error_type,
        error_level,
        error_message: error_message.substring(0, 1000), // Limit message length
        error_stack: error_stack?.substring(0, 5000), // Limit stack trace
        error_code,
        facility_id,
        user_agent,
        url,
        session_id,
        additional_context: {
          ...additional_context,
          timestamp: new Date().toISOString(),
          server_side: true
        }
      })
      .select()

    if (error) {
      console.error('Error tracking failed:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to track error', details: error }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // For critical errors, also create high-priority feedback if facility_id provided
    if (error_level === 'critical' && facility_id) {
      try {
        await supabaseClient
          .from('facility_feedback')
          .insert({
            facility_id,
            feedback_type: 'problem',
            message: `🚨 CRITICAL SERVER ERROR: ${error_message}`,
            user_agent: user_agent || 'Server',
            priority: 'high',
            metadata: {
              url: url || 'N/A',
              timestamp: new Date().toISOString(),
              error_context: additional_context,
              auto_generated: true,
              server_error: true
            }
          })
      } catch (feedbackError) {
        console.error('Failed to create critical error feedback:', feedbackError)
        // Don't fail the main request if feedback creation fails
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        error_id: data?.[0]?.id,
        message: 'Error tracked successfully' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})