
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
  return `You are an expert chemical safety data analyst. Extract the following critical information from this SDS (Safety Data Sheet) document for safety label generation. Focus on accuracy and completeness.

CRITICAL REQUIREMENTS:
1. HMIS Ratings (MOST IMPORTANT): Health, Flammability, Physical (0-4 scale), Special hazards
2. Product Title: Official product name
3. Chemical Compound: Main chemical name and formula
4. Manufacturer: Company name and any product ID
5. GHS Pictograms: Identify which pictograms are referenced
6. Required PPE: Personal protective equipment needed
7. Current date for label printing

SDS Document Text:
${sdsText.substring(0, 8000)}

Please extract and return ONLY a JSON object with this exact structure:
{
  "hmis_health": <number 0-4>,
  "hmis_flammability": <number 0-4>,
  "hmis_physical": <number 0-4>,  
  "hmis_special": "<any special hazard codes or empty string>",
  "hmis_confidence": <confidence 0-100>,
  "product_title": "<official product name>",
  "chemical_compound": "<primary chemical name>",
  "chemical_formula": "<molecular formula if available>",
  "manufacturer": "<company name>",
  "product_id": "<product ID, lot number, or catalog number>",
  "ghs_pictograms": [
    {
      "code": "<GHS code like GHS02, GHS07, etc>",
      "name": "<pictogram name like flame, exclamation, etc>",
      "confidence": <confidence 0-100>
    }
  ],
  "required_ppe": ["<list of required PPE items>"],
  "extraction_confidence": <overall confidence 0-100>,
  "label_print_date": "${new Date().toISOString().split('T')[0]}"
}

EXTRACTION GUIDELINES:
- For HMIS: Look for explicit HMIS ratings first, then NFPA ratings as backup
- If HMIS not found but NFPA exists, use NFPA values as HMIS approximation
- For pictograms: Match hazard statements to correct GHS pictograms
- For PPE: Extract from precautionary statements and handling procedures
- Use high confidence (80+) only when data is explicitly stated
- Use medium confidence (50-79) for inferred data
- Use low confidence (below 50) for uncertain extractions`
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
          content: 'You are an expert chemical safety analyst specializing in SDS document analysis and GHS compliance. Always return valid JSON responses.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 2000
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
    
    console.log('🤖 Starting AI-enhanced SDS extraction for document:', document_id);

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

    // Check if we already have AI-enhanced data
    if (document.ai_extracted_data && document.ai_extraction_confidence > 70) {
      console.log('✅ Document already has high-confidence AI extraction');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Document already has AI-enhanced data',
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

    // Create extraction prompt and call OpenAI
    const extractionPrompt = createExtractionPrompt(sdsText);
    console.log('🤖 Calling OpenAI for enhanced extraction...');
    
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

    // Validate and enhance the extracted data
    const validatedData = {
      // HMIS ratings (ensure 0-4 range)
      hmis_codes: {
        health: Math.max(0, Math.min(4, extractedData.hmis_health || 0)),
        flammability: Math.max(0, Math.min(4, extractedData.hmis_flammability || 0)),
        physical: Math.max(0, Math.min(4, extractedData.hmis_physical || 0)),
        special: extractedData.hmis_special || ''
      },
      
      // Enhanced product information
      ai_extracted_data: {
        product_title: extractedData.product_title || document.product_name,
        chemical_compound: extractedData.chemical_compound || '',
        chemical_formula: extractedData.chemical_formula || '',
        manufacturer: extractedData.manufacturer || document.manufacturer,
        product_id: extractedData.product_id || '',
        ghs_pictograms: extractedData.ghs_pictograms || [],
        required_ppe: extractedData.required_ppe || [],
        hmis_confidence: extractedData.hmis_confidence || 50,
        label_print_date: extractedData.label_print_date
      },
      
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

    console.log('✅ Successfully completed AI-enhanced SDS extraction');
    console.log(`📊 Extraction confidence: ${validatedData.ai_extraction_confidence}%`);
    console.log(`🏥 HMIS Health: ${validatedData.hmis_codes.health}`);
    console.log(`🔥 HMIS Flammability: ${validatedData.hmis_codes.flammability}`);
    console.log(`⚠️ HMIS Physical: ${validatedData.hmis_codes.physical}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        extracted_data: validatedData,
        confidence: validatedData.ai_extraction_confidence,
        message: `AI extraction completed with ${validatedData.ai_extraction_confidence}% confidence`
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
