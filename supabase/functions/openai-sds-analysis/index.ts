
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts'

interface OpenAISSDRequest {
  document_id: string;
  pdf_url: string;
}

interface OpenAISSDResponse {
  success: boolean;
  data?: {
    product_name: string;
    cas_number: string;
    manufacturer: string;
    hmis_codes: {
      health: string;
      flammability: number;
      physical_hazard: number;
      ppe: string;
    };
    ghs_pictograms: string[];
    revision_date: string;
    signal_word: string;
    h_codes: string[];
    confidence_score: number;
    processing_time_ms: number;
  };
  error?: string;
}

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { document_id, pdf_url }: OpenAISSDRequest = await req.json();
    
    console.log('🤖 OpenAI SDS Analysis for document:', document_id);
    console.log('📄 PDF URL:', pdf_url);

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Create the analysis prompt
    const analysisPrompt = `You are an expert chemical safety data sheet (SDS) analyzer. Please analyze this SDS document and extract the following information in the exact JSON format specified:

REQUIRED OUTPUT FORMAT:
{
  "product_name": "string - Main product/chemical name",
  "cas_number": "string - CAS registry number (format: XXXXX-XX-X)",
  "manufacturer": "string - Company name that manufactured/distributed this product",
  "hmis_codes": {
    "health": "string - Health hazard rating (0-4, may include * for chronic hazards)",
    "flammability": "number - Flammability rating (0-4)",
    "physical_hazard": "number - Physical hazard rating (0-4)", 
    "ppe": "string - Personal protective equipment code (A-K or X)"
  },
  "ghs_pictograms": ["array of GHS pictogram names like Flame, Skull-and-Crossbones, etc."],
  "revision_date": "string - Date when SDS was last revised (YYYY-MM-DD format if possible)",
  "signal_word": "string - DANGER or WARNING",
  "h_codes": ["array of H-codes like H225, H319, etc."],
  "confidence_score": "number - Your confidence in this analysis (0-100)"
}

IMPORTANT INSTRUCTIONS:
1. Extract information ONLY from what you can clearly see in the document
2. Use "N/A" for any field you cannot determine with confidence
3. For HMIS codes, follow standard 0-4 scale (0=minimal, 4=severe hazard)
4. PPE codes: A-K represent specific equipment combinations, X means consult supervisor
5. Be precise with CAS numbers and H-codes - these are critical safety identifiers
6. If multiple products are listed, focus on the primary/main product
7. Confidence score should reflect how clearly the information was presented in the document

Please analyze this SDS document thoroughly and provide the requested information:`;

    // Make the OpenAI API call
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: analysisPrompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: pdf_url,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 1500,
        temperature: 0.1
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
    }

    const openAIData = await response.json();
    const content = openAIData.choices[0].message.content;
    
    console.log('🔍 OpenAI Response:', content);

    // Parse the JSON response
    let analysisData;
    try {
      // Extract JSON from the response (in case OpenAI adds extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No valid JSON found in OpenAI response');
      }
    } catch (parseError) {
      console.error('❌ Failed to parse OpenAI response as JSON:', parseError);
      throw new Error('Invalid JSON response from OpenAI');
    }

    const processingTime = Date.now() - startTime;
    
    // Add processing metadata
    analysisData.processing_time_ms = processingTime;
    
    console.log('✅ OpenAI SDS Analysis complete');
    console.log('📊 Extracted Data:', analysisData);
    console.log('⏱️ Processing time:', processingTime, 'ms');
    console.log('🎯 Confidence:', analysisData.confidence_score, '%');

    const result: OpenAISSDResponse = {
      success: true,
      data: analysisData
    };

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ OpenAI SDS Analysis error:', error);
    const processingTime = Date.now() - startTime;
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        processing_time_ms: processingTime
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
