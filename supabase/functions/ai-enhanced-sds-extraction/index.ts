
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

interface EnhancedSDSData {
  // HMIS values (most important)
  hmis_health: number;
  hmis_flammability: number;
  hmis_physical: number;
  hmis_special: string;
  hmis_confidence: number;
  
  // Product information
  product_title: string;
  chemical_compound: string;
  chemical_formula: string;
  manufacturer: string;
  product_id: string;
  
  // Safety information
  ghs_pictograms: Array<{
    code: string;
    name: string;
    confidence: number;
  }>;
  required_ppe: string[];
  
  // Metadata
  extraction_confidence: number;
  label_print_date: string;
}

function createExtractionPrompt(sdsText: string): string {
  return `You are an expert chemical safety data analyst specializing in HMIS (Hazardous Materials Identification System) scoring. Extract the following critical information from this SDS document for safety label generation.

CRITICAL HMIS SCORING CRITERIA:
You MUST use these standardized HMIS scoring criteria (0-4 scale):

🔷 HEALTH HAZARD (Blue Bar) - Rate 0-4:
• 4: Life-threatening or major permanent damage (e.g., hydrogen cyanide, phosgene, carcinogens)
• 3: Serious temporary/residual injury, medical attention needed (e.g., strong acids/bases, phenol, H₂S)
• 2: Temporary injury may occur, prompt treatment usually not required (e.g., solvents causing CNS depression)
• 1: Irritation or minor reversible injury (e.g., isopropyl alcohol, ammonia solution)
• 0: No significant risk to health (e.g., water, inert substances)

🔥 FLAMMABILITY (Red Bar) - Rate 0-4 based on flash points:
• 4: Flash point < 73°F (22.8°C) AND boiling point < 100°F (37.8°C)
• 3: Flash point < 100°F (37.8°C)
• 2: Flash point 100–200°F (37.8–93.3°C)
• 1: Flash point > 200°F (93.3°C)
• 0: Will not burn under typical fire conditions (e.g., water, salts)

⚙️ PHYSICAL HAZARD/REACTIVITY (Yellow Bar) - Rate 0-4:
• 4: May detonate or explode under normal conditions (e.g., nitroglycerin)
• 3: May detonate with strong initiating force or heat (e.g., ammonium perchlorate)
• 2: Unstable with violent chemical change (e.g., peroxides, cyanides in heat)
• 1: Normally stable, but unstable when heated (e.g., sodium)
• 0: Stable and unreactive under fire conditions (e.g., common solvents)

🧤 PERSONAL PROTECTION (White Bar) - Use these codes:
• A: Safety glasses
• B: Safety glasses, gloves
• C: Safety glasses, gloves, apron
• D: Face shield, gloves, apron
• E: Safety glasses, gloves, dust respirator
• F: Safety glasses, gloves, apron, dust respirator
• G: Safety glasses, vapor respirator
• H: Splash goggles, gloves, apron, vapor respirator
• X: Consult supervisor or SDS for guidance

EXTRACTION REQUIREMENTS:
1. Look for explicit HMIS ratings first
2. If not found, calculate using flash point, LD50, pH, volatility data
3. Extract CAS numbers in format XX-XX-X (e.g., "67-63-0")
4. Find chemical formulas (e.g., "C3H8O")
5. Identify official product names
6. Map GHS pictograms to correct codes (GHS01-GHS09)
7. Determine PPE requirements using A-X coding system

Use SDS Sections 2, 4, 5, 9, 10, and 11 for information gathering.

SDS Document Text:
${sdsText.substring(0, 12000)}

Extract and return ONLY a JSON object with this exact structure:
{
  "hmis_health": <number 0-4 using criteria above>,
  "hmis_flammability": <number 0-4 using flash point criteria>,
  "hmis_physical": <number 0-4 using reactivity criteria>,  
  "hmis_special": "<PPE code A-X or special hazard codes>",
  "hmis_confidence": <confidence 0-100 based on data availability>,
  "product_title": "<official product name>",
  "chemical_compound": "<primary chemical name>",
  "chemical_formula": "<molecular formula like C3H8O>",
  "manufacturer": "<company name>",
  "product_id": "<product ID, lot number, or catalog number>",
  "cas_number": "<CAS number in XX-XX-X format>",
  "ghs_pictograms": [
    {
      "code": "<GHS code like GHS02, GHS07>",
      "name": "<pictogram name like flame, exclamation>",
      "confidence": <confidence 0-100>
    }
  ],
  "required_ppe": ["<PPE items based on precautionary statements>"],
  "extraction_confidence": <overall confidence 0-100>,
  "label_print_date": "${new Date().toISOString().split('T')[0]}"
}

SCORING LOGIC:
- Use explicit HMIS ratings when available (confidence 90+)
- Calculate from flash points for flammability (confidence 80+)
- Infer from toxicity data (LD50) for health ratings (confidence 70+)
- Use reactivity warnings for physical hazards (confidence 60+)
- Default to conservative ratings if uncertain (confidence <50)`
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
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert chemical safety analyst and HMIS scoring specialist. You understand flash points, LD50 values, reactivity data, and can accurately score HMIS ratings using standardized criteria. Always return valid JSON responses with precise HMIS scores.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 2500
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
    
    console.log('🤖 Starting AI-enhanced SDS extraction with HMIS expertise for document:', document_id);

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

    // Check if we already have high-confidence AI-enhanced data
    if (document.ai_extracted_data && document.ai_extraction_confidence > 80) {
      console.log('✅ Document already has high-confidence AI extraction');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Document already has high-confidence AI-enhanced data',
          data: document.ai_extracted_data,
          confidence: document.ai_extraction_confidence
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract text for AI analysis
    const sdsText = document.full_text || '';
    if (!sdsText || sdsText.length < 100) {
      throw new Error('Insufficient text content for AI analysis');
    }

    // Create enhanced extraction prompt with HMIS expertise
    const extractionPrompt = createExtractionPrompt(sdsText);
    console.log('🧠 Calling OpenAI with HMIS scoring expertise...');
    
    const aiResponse = await callOpenAI(extractionPrompt);
    
    // Parse AI response
    let extractedData: EnhancedSDSData;
    try {
      // Clean the response to extract JSON
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }
      extractedData = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('❌ Failed to parse AI response:', parseError);
      throw new Error('Invalid JSON response from AI');
    }

    // Validate and enhance the extracted data with HMIS intelligence
    const validatedData = {
      // HMIS ratings with validation (ensure 0-4 range)
      hmis_codes: {
        health: Math.max(0, Math.min(4, extractedData.hmis_health || 0)),
        flammability: Math.max(0, Math.min(4, extractedData.hmis_flammability || 0)),
        physical: Math.max(0, Math.min(4, extractedData.hmis_physical || 0)),
        special: extractedData.hmis_special || ''
      },
      
      // Enhanced product information with better extraction
      ai_extracted_data: {
        product_title: extractedData.product_title || document.product_name,
        chemical_compound: extractedData.chemical_compound || '',
        chemical_formula: extractedData.chemical_formula || '',
        manufacturer: extractedData.manufacturer || document.manufacturer,
        product_id: extractedData.product_id || '',
        cas_number: extractedData.cas_number || document.cas_number,
        ghs_pictograms: extractedData.ghs_pictograms || [],
        required_ppe: extractedData.required_ppe || [],
        hmis_confidence: extractedData.hmis_confidence || 50,
        label_print_date: extractedData.label_print_date
      },
      
      // Update CAS number if found by AI
      cas_number: extractedData.cas_number || document.cas_number,
      
      ai_extraction_confidence: extractedData.extraction_confidence || 50,
      ai_extraction_date: new Date().toISOString()
    };

    // Update the document with AI-enhanced data
    const { error: updateError } = await supabase
      .from('sds_documents')
      .update(validatedData)
      .eq('id', document_id);

    if (updateError) {
      console.error('❌ Error updating document:', updateError);
      throw updateError;
    }

    console.log('✅ Successfully completed AI-enhanced SDS extraction with HMIS scoring');
    console.log(`📊 Extraction confidence: ${validatedData.ai_extraction_confidence}%`);
    console.log(`🏥 HMIS Health: ${validatedData.hmis_codes.health} (Blue)`);
    console.log(`🔥 HMIS Flammability: ${validatedData.hmis_codes.flammability} (Red)`);
    console.log(`⚠️ HMIS Physical: ${validatedData.hmis_codes.physical} (Yellow)`);
    console.log(`🧤 HMIS Special: ${validatedData.hmis_codes.special} (White)`);

    return new Response(
      JSON.stringify({ 
        success: true,
        extracted_data: validatedData,
        confidence: validatedData.ai_extraction_confidence,
        message: `AI extraction completed with ${validatedData.ai_extraction_confidence}% confidence using HMIS scoring criteria`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ AI-enhanced SDS extraction error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'AI extraction failed',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
