
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from '../_shared/cors.ts';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

interface SearchAssistRequest {
  query: string;
}

interface SearchSuggestion {
  corrected_query?: string;
  spelling_corrections?: string[];
  suggested_manufacturers?: string[];
  alternative_terms?: string[];
  search_tips?: string[];
  confidence: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query }: SearchAssistRequest = await req.json();
    
    console.log('🤖 AI Search Assist request for:', query);

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    if (!query || query.trim().length < 2) {
      return new Response(
        JSON.stringify({ 
          suggestions: {
            search_tips: ['Enter at least 2 characters to get search suggestions']
          }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
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
            content: `You are a chemical safety expert helping users search for Safety Data Sheets (SDS). 
            
            CRITICAL: All searches MUST be for Safety Data Sheets specifically. Documents must contain "Safety Data Sheet" or "MSDS" to be valid results.
            
            Your job is to analyze search queries and provide helpful suggestions to improve SDS search results while ensuring they target actual Safety Data Sheets.
            
            For the given search query, provide:
            1. Spelling corrections if needed (but keep SDS focus)
            2. Possible manufacturer/brand names that make this chemical
            3. Alternative chemical names or synonyms
            4. Search tips to improve SDS-specific results
            
            IMPORTANT: Always emphasize that results must be Safety Data Sheets, not product catalogs, Wikipedia pages, or general product information.
            
            Response format (JSON only, no markdown):
            {
              "corrected_query": "corrected spelling if needed, null if no correction",
              "spelling_corrections": ["list of spelling corrections if any"],
              "suggested_manufacturers": ["list of 3-5 common manufacturers that make this chemical"],
              "alternative_terms": ["list of alternative chemical names, synonyms, or CAS numbers"],
              "search_tips": ["3-4 practical tips for better SDS search results, emphasizing SDS requirement"],
              "confidence": 0.85
            }
            
            Be concise and practical. Focus on real chemical manufacturers and actual alternative names. Always remind about SDS requirement.`
          },
          {
            role: 'user',
            content: `Analyze this SDS search query: "${query}"`
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    console.log('🤖 AI Response:', aiResponse);
    
    // Parse the AI response as JSON
    let suggestions: SearchSuggestion;
    try {
      suggestions = JSON.parse(aiResponse);
      
      // Ensure search tips always emphasize SDS requirement
      if (suggestions.search_tips) {
        suggestions.search_tips = suggestions.search_tips.map(tip => {
          if (!tip.toLowerCase().includes('sds') && !tip.toLowerCase().includes('safety data sheet') && !tip.toLowerCase().includes('msds')) {
            return tip + ' - ensure results are actual Safety Data Sheets';
          }
          return tip;
        });
        
        // Add SDS emphasis tip if not present
        const hasSdsTip = suggestions.search_tips.some(tip => 
          tip.toLowerCase().includes('safety data sheet') || 
          tip.toLowerCase().includes('sds') || 
          tip.toLowerCase().includes('msds')
        );
        
        if (!hasSdsTip) {
          suggestions.search_tips.unshift('Look specifically for "Safety Data Sheet" or "MSDS" documents, not product catalogs');
        }
      } else {
        suggestions.search_tips = ['Look specifically for "Safety Data Sheet" or "MSDS" documents, not product catalogs'];
      }
      
    } catch (parseError) {
      console.error('❌ Failed to parse AI response as JSON:', parseError);
      // Fallback response with SDS emphasis
      suggestions = {
        search_tips: [
          'Look specifically for "Safety Data Sheet" or "MSDS" documents, not product catalogs',
          'Try using the exact product name from the container label',
          'Include manufacturer name if known',
          'Use chemical name instead of trade name for SDS documents'
        ],
        confidence: 0.5
      };
    }

    return new Response(
      JSON.stringify({ suggestions }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ AI Search Assist error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Search assistance temporarily unavailable',
        suggestions: {
          search_tips: [
            'Look specifically for "Safety Data Sheet" or "MSDS" documents',
            'Try using the exact product name from the container label'
          ],
          confidence: 0.1
        }
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
