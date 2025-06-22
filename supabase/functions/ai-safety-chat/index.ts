
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { corsHeaders } from '../_shared/cors.ts'

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

interface ChatRequest {
  message: string;
  conversation_history: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  sds_document?: any;
  facility_data?: any;
}

function buildSafetyManagerPrompt(sdsDocument?: any, facilityData?: any): string {
  let systemPrompt = `You are Stan, an experienced Chemical Safety Expert with 15 years in industrial safety. You're knowledgeable, approachable, and always prioritize worker safety. You speak conversationally but professionally, like a trusted colleague who genuinely cares about keeping people safe.

PERSONALITY TRAITS:
- Warm but professional - you're the safety expert people actually want to talk to
- Practical and solution-oriented - you focus on real-world applications
- Safety-conscious without being preachy - you explain WHY safety matters
- Experienced - you've seen it all and share relevant stories when helpful
- Clear communicator - you explain technical concepts in plain language

RESPONSE GUIDELINES:
1. Always be conversational and personable
2. Clearly distinguish between SDS data and your general experience
3. Provide practical, actionable advice
4. Ask clarifying questions when needed for better guidance
5. Reference specific regulatory standards when relevant (OSHA, NFPA, etc.)
6. Include confidence levels and suggest when to consult specialists

SOURCE ATTRIBUTION:
- When referencing SDS data: "According to the SDS for [chemical]..."
- When sharing experience: "In my experience..." or "I've seen cases where..."
- When unsure: "You should definitely consult your local safety officer about..."

CONVERSATION STYLE:
- Use contractions and natural language
- Ask follow-up questions to better help
- Provide context for recommendations
- Share brief relevant experiences when helpful`;

  if (facilityData?.facility_name) {
    systemPrompt += `\n\nFACILITY CONTEXT: You're currently helping someone at ${facilityData.facility_name}.`;
  }

  if (sdsDocument) {
    systemPrompt += `\n\nCURRENT CHEMICAL CONTEXT:
You have complete SDS data for: ${sdsDocument.product_name}`;
    
    if (sdsDocument.manufacturer) {
      systemPrompt += `\nManufacturer: ${sdsDocument.manufacturer}`;
    }
    
    if (sdsDocument.cas_number) {
      systemPrompt += `\nCAS Number: ${sdsDocument.cas_number}`;
    }
    
    if (sdsDocument.signal_word) {
      systemPrompt += `\nSignal Word: ${sdsDocument.signal_word}`;
    }
    
    if (sdsDocument.h_codes && sdsDocument.h_codes.length > 0) {
      systemPrompt += `\nHazard Codes:`;
      sdsDocument.h_codes.forEach((hCode: any) => {
        systemPrompt += `\n- ${hCode.code}: ${hCode.description}`;
      });
    }
    
    if (sdsDocument.pictograms && sdsDocument.pictograms.length > 0) {
      systemPrompt += `\nGHS Pictograms: ${sdsDocument.pictograms.map((p: any) => p.name).join(', ')}`;
    }
    
    if (sdsDocument.first_aid) {
      systemPrompt += `\nFirst Aid Information:`;
      if (sdsDocument.first_aid.skin_contact) {
        systemPrompt += `\n- Skin Contact: ${sdsDocument.first_aid.skin_contact}`;
      }
      if (sdsDocument.first_aid.eye_contact) {
        systemPrompt += `\n- Eye Contact: ${sdsDocument.first_aid.eye_contact}`;
      }
      if (sdsDocument.first_aid.inhalation) {
        systemPrompt += `\n- Inhalation: ${sdsDocument.first_aid.inhalation}`;
      }
      if (sdsDocument.first_aid.ingestion) {
        systemPrompt += `\n- Ingestion: ${sdsDocument.first_aid.ingestion}`;
      }
    }
    
    if (sdsDocument.precautionary_statements && sdsDocument.precautionary_statements.length > 0) {
      systemPrompt += `\nPrecautionary Statements: ${sdsDocument.precautionary_statements.slice(0, 5).join('; ')}`;
    }
    
    systemPrompt += `\n\nUse this SDS data to provide specific, accurate guidance for ${sdsDocument.product_name}. Always cite the SDS when referencing this information.`;
  } else {
    systemPrompt += `\n\nNo specific chemical selected. Provide general safety guidance and encourage the user to search for specific chemicals when discussing particular substances.`;
  }

  return systemPrompt;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversation_history, sds_document, facility_data }: ChatRequest = await req.json();
    
    console.log('🤖 Safety Stan Chat request:', { 
      message: message.substring(0, 100), 
      hasSDSData: !!sds_document,
      facilityName: facility_data?.facility_name 
    });

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Build the conversation messages
    const messages = [
      {
        role: 'system',
        content: buildSafetyManagerPrompt(sds_document, facility_data)
      },
      ...conversation_history,
      {
        role: 'user',
        content: message
      }
    ];

    console.log('🔄 Calling OpenAI API...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    console.log('✅ Safety Stan response generated successfully');

    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        usage: data.usage
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Safety Stan Chat error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate AI response',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
