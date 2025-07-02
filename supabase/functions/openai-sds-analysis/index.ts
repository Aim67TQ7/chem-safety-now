
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

    // Enhanced analysis prompt with comprehensive pictogram extraction
    const analysisPrompt = `You are an expert chemical safety data sheet (SDS) analyzer specializing in comprehensive GHS pictogram identification. I will provide you with a PDF document URL containing an SDS. Your primary task is to identify ALL pictograms present in the document.

Please access and carefully analyze the PDF at this URL: ${pdf_url}

CRITICAL PICTOGRAM EXTRACTION INSTRUCTIONS:
🎯 PRIMARY OBJECTIVE: Extract ALL pictograms - documents commonly contain 4-6 pictograms, not just 2-3.

PICTOGRAM IDENTIFICATION STRATEGY:
1. **Visual Analysis**: Look for diamond-shaped symbols with black pictograms on white backgrounds with red borders
2. **Section 2 Analysis**: Examine "Hazard Identification" or "Label Elements" sections thoroughly
3. **Text-Based Detection**: Look for pictogram references in text:
   - "Pictogram:" followed by descriptions
   - GHS codes (GHS01, GHS02, etc.)
   - Signal words linked to specific pictograms
   - H-codes that correspond to pictograms

COMPREHENSIVE PICTOGRAM LIST - Look for ALL of these:
   - GHS01: Exploding Bomb (explosives, self-reactive substances)
   - GHS02: Flame (flammable liquids/solids/gases)
   - GHS03: Flame Over Circle (oxidizing liquids/solids/gases)
   - GHS04: Gas Cylinder (gases under pressure)
   - GHS05: Corrosion (corrosive to metals, skin corrosion, eye damage)
   - GHS06: Skull and Crossbones (acute toxicity)
   - GHS07: Exclamation Mark (skin/eye irritation, acute toxicity)
   - GHS08: Health Hazard (carcinogen, mutagen, reproductive toxicity, respiratory sensitizer)
   - GHS09: Environment (aquatic toxicity)

PICTOGRAM CROSS-REFERENCE:
- If you find H-codes, map them to pictograms:
  * H200-H299 → Physical hazards (GHS01, GHS02, GHS03, GHS04)
  * H300-H399 → Health hazards (GHS05, GHS06, GHS07, GHS08)
  * H400-H499 → Environmental hazards (GHS09)
- Check for multiple pictogram categories per chemical

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
  "ghs_pictograms": ["array of ALL GHS pictogram names - be thorough, look for ALL 4+ pictograms"],
  "revision_date": "string - Date when SDS was last revised (YYYY-MM-DD format if possible)",
  "signal_word": "string - DANGER or WARNING",
  "h_codes": ["array of H-codes like H225, H319, etc."],
  "confidence_score": "number - Your confidence in this analysis (0-100)"
}

IMPORTANT INSTRUCTIONS:
1. Access the PDF document at the provided URL and extract information from its contents
2. Use "N/A" for any field you cannot determine with confidence
3. For HMIS codes, follow standard 0-4 scale (0=minimal, 4=severe hazard)
4. PPE codes: A-K represent specific equipment combinations, X means consult supervisor
5. Be precise with CAS numbers and H-codes - these are critical safety identifiers
6. **CRITICAL**: Look for ALL pictograms - don't stop at 3, there may be 4 or more
7. Check Section 2.2 (Label Elements) thoroughly for complete pictogram list
8. If multiple products are listed, focus on the primary/main product
9. Confidence score should reflect how clearly the information was presented in the document

Please analyze the SDS document at the URL provided and return only the requested JSON data. Pay special attention to capturing ALL pictograms present in the document.`;

    // Make the OpenAI API call using GPT-4 for better analysis
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'o4-mini-2025-04-16',
        messages: [
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.1
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ OpenAI API error:', response.status, errorData);
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
      console.error('Raw response:', content);
      throw new Error('Invalid JSON response from OpenAI');
    }

    const processingTime = Date.now() - startTime;
    
    // Add processing metadata
    analysisData.processing_time_ms = processingTime;
    
    // Log detailed pictogram extraction results
    console.log('🎯 Pictograms extracted:', analysisData.ghs_pictograms);
    console.log('📊 Total pictograms found:', analysisData.ghs_pictograms?.length || 0);
    
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
