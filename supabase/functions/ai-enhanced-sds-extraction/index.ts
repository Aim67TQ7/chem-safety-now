
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

interface OSHAExtractionResponse {
  status: 'ok' | 'manual-review';
  product_identifier: { value: string; confidence: number };
  signal_word: { value: 'Danger' | 'Warning' | 'None'; confidence: number };
  pictograms: Array<{
    name: string;
    unicode: string;
    confidence: number;
  }>;
  hazard_statements: Array<{ value: string; confidence: number }>;
  precautionary_statements_critical: Array<{ value: string; confidence: number }>;
  hmis: {
    health: { value: number; confidence: number };
    flammability: { value: number; confidence: number };
    physical: { value: number; confidence: number };
    ppe: { value: string; confidence: number };
  };
  overall_confidence: number;
}

function createOSHAExtractionPrompt(sdsText: string): string {
  return `You are "SDS-Label-Extractor v1.0," an OSHA-compliant expert on the Hazard Communication Standard (29 CFR 1910.1200, GHS Rev 7).  
Goal: From the full, raw text of a Safety Data Sheet (SDS) provided below, identify the information needed for a U.S. workplace secondary container label with ≥ 0.98 confidence.  
If ≥ 0.98 confidence cannot be reached for **every** element, output "status":"manual-review" and explain the low-confidence fields.

1. **Locate the data in this priority order**  
   • Section 2 "Hazard(s) Identification" – pictograms, signal word, hazard statements.  
   • Section 1 "Identification" – product identifier/trade name.  
   • Section 4 "First-aid Measures" & Section 7 "Handling & Storage" – critical cautionary statements if Section 2 omits them.  
   • Section 16 or any footers – HMIS (Health, Flammability, Physical Hazard, PPE code).  
   • Anywhere images show GHS symbols → map to standard IDs (e.g., flame, skull-and-crossbones, exclamation-mark).  
   • Ignore marketing language and supplier SDS summaries.

2. **Parse & reconcile**  
   • Trim whitespace, join wrapped lines, preserve punctuation.  
   • Accept common synonyms (e.g., "Warning" ↔ signal word).  
   • If multiple conflicting values appear, choose the one with the **highest safety rating** (more severe) and lower the element's confidence accordingly.  
   • Normalize HMIS to 0-4 integers; normalize PPE code to a single letter A–K or "X."  
   • Return pictograms as an array of the official GHS keyword strings: ["flame","gas-cylinder", …].

3. **Deliver JSON exactly in this schema**  
   {
     "status": "ok" | "manual-review",
     "product_identifier": { "value": "...", "confidence": 0.00-1.00 },
     "signal_word":        { "value": "Danger | Warning | None", "confidence": … },
     "pictograms":         [
                              { "name": "flame", "unicode": "🔥", "confidence": … },
                              …
                            ],
     "hazard_statements":  [{ "value": "...", "confidence": … }, …],
     "precautionary_statements_critical": [{ "value": "...", "confidence": … }, …],
     "hmis": {
       "health":        { "value": 0-4, "confidence": … },
       "flammability":  { "value": 0-4, "confidence": … },
       "physical":      { "value": 0-4, "confidence": … },
       "ppe":           { "value": "A"-"K" | "X", "confidence": … }
     },
     "overall_confidence": 0.00-1.00
   }
• overall_confidence = harmonic mean of all element confidences; must be ≥ 0.98 to avoid "manual-review".

Quality checks (abort if any fail)
• At least one pictogram OR one hazard statement must be present.
• Signal word must be "Warning" or "Danger" if any GHS category 1–3 hazards are detected.
• HMIS ratings must be integers 0-4; none can be null.
• No confidence may be < 0.80 in a successful extraction.

Output only the JSON block – no prose, no markdown — so that downstream code can parse it cleanly.

SDS Document Text:
${sdsText.substring(0, 12000)}`;
}

async function callOpenAI(prompt: string): Promise<any> {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4.1-2025-04-14',
      messages: [
        {
          role: 'system',
          content: 'You are SDS-Label-Extractor v1.0, an OSHA-compliant expert on the Hazard Communication Standard. You extract information from SDS documents with ≥98% confidence for secondary container labeling. Always return valid JSON responses with precise confidence scores.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 3000
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { document_id } = await req.json();
    
    console.log('🤖 Starting OSHA-compliant SDS extraction for document:', document_id);

    // Get the SDS document
    const { data: document, error: docError } = await supabase
      .from('sds_documents')
      .select('*')
      .eq('id', document_id)
      .single();

    if (docError || !document) {
      throw new Error('SDS document not found');
    }

    console.log('📄 Processing document:', document.product_name);

    // Check if we already have high-confidence OSHA-compliant data
    if (document.ai_extracted_data && document.ai_extraction_confidence >= 98) {
      console.log('✅ Document already has high-confidence OSHA extraction');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Document already has high-confidence OSHA-compliant data',
          data: document.ai_extracted_data,
          confidence: document.ai_extraction_confidence
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract text for AI analysis
    const sdsText = document.full_text || '';
    if (!sdsText || sdsText.length < 100) {
      throw new Error('Insufficient text content for OSHA analysis');
    }

    // Create OSHA-compliant extraction prompt
    const extractionPrompt = createOSHAExtractionPrompt(sdsText);
    console.log('🧠 Calling OpenAI with OSHA-compliant extraction...');
    
    const aiResponse = await callOpenAI(extractionPrompt);
    
    // Parse AI response
    let extractedData: OSHAExtractionResponse;
    try {
      // Clean the response to extract JSON
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }
      extractedData = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('❌ Failed to parse OSHA extraction response:', parseError);
      throw new Error('Invalid JSON response from OSHA extraction');
    }

    // Validate OSHA extraction quality
    if (extractedData.status === 'manual-review' || extractedData.overall_confidence < 0.98) {
      console.log('⚠️ OSHA extraction requires manual review:', extractedData.overall_confidence);
      
      // Store the data but flag for manual review
      const { error: updateError } = await supabase
        .from('sds_documents')
        .update({
          ai_extracted_data: extractedData,
          ai_extraction_confidence: Math.round(extractedData.overall_confidence * 100),
          ai_extraction_date: new Date().toISOString(),
          extraction_status: 'manual_review_required'
        })
        .eq('id', document_id);

      if (updateError) {
        console.error('❌ Error updating document for manual review:', updateError);
        throw updateError;
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          status: 'manual_review_required',
          extracted_data: extractedData,
          confidence: Math.round(extractedData.overall_confidence * 100),
          message: `OSHA extraction completed but requires manual review (${Math.round(extractedData.overall_confidence * 100)}% confidence)`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Convert OSHA data to our database format
    const validatedData = {
      // HMIS ratings from OSHA extraction
      hmis_codes: {
        health: extractedData.hmis.health.value,
        flammability: extractedData.hmis.flammability.value,
        physical: extractedData.hmis.physical.value,
        special: extractedData.hmis.ppe.value
      },
      
      // Enhanced product information
      ai_extracted_data: {
        product_title: extractedData.product_identifier.value,
        signal_word: extractedData.signal_word.value,
        hazard_statements: extractedData.hazard_statements.map(h => h.value),
        precautionary_statements: extractedData.precautionary_statements_critical.map(p => p.value),
        ghs_pictograms: extractedData.pictograms.map(p => ({
          name: p.name,
          unicode: p.unicode,
          confidence: p.confidence
        })),
        hmis_confidence: Math.min(
          extractedData.hmis.health.confidence,
          extractedData.hmis.flammability.confidence,
          extractedData.hmis.physical.confidence,
          extractedData.hmis.ppe.confidence
        ) * 100,
        overall_confidence: extractedData.overall_confidence * 100,
        osha_compliant: true,
        extraction_method: 'osha_compliant_v1.0'
      },
      
      // Update signal word and pictograms in main document
      signal_word: extractedData.signal_word.value,
      pictograms: extractedData.pictograms.map(p => p.name),
      
      ai_extraction_confidence: Math.round(extractedData.overall_confidence * 100),
      ai_extraction_date: new Date().toISOString(),
      extraction_status: 'osha_compliant'
    };

    // Update the document with OSHA-compliant data
    const { error: updateError } = await supabase
      .from('sds_documents')
      .update(validatedData)
      .eq('id', document_id);

    if (updateError) {
      console.error('❌ Error updating document:', updateError);
      throw updateError;
    }

    console.log('✅ Successfully completed OSHA-compliant SDS extraction');
    console.log(`📊 Overall confidence: ${Math.round(extractedData.overall_confidence * 100)}%`);
    console.log(`🏥 HMIS Health: ${extractedData.hmis.health.value}`);
    console.log(`🔥 HMIS Flammability: ${extractedData.hmis.flammability.value}`);
    console.log(`⚠️ HMIS Physical: ${extractedData.hmis.physical.value}`);
    console.log(`🧤 HMIS PPE: ${extractedData.hmis.ppe.value}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        status: 'osha_compliant',
        extracted_data: validatedData,
        confidence: Math.round(extractedData.overall_confidence * 100),
        message: `OSHA-compliant extraction completed with ${Math.round(extractedData.overall_confidence * 100)}% confidence`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ OSHA-compliant SDS extraction error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'OSHA extraction failed',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
