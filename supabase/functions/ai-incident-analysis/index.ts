
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { corsHeaders } from '../_shared/cors.ts'

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

interface IncidentAnalysisRequest {
  incident_data: any;
  analysis_type: 'root_cause' | 'recommendations' | 'follow_up_questions' | 'chemical_correlation';
  related_sds_documents?: any[];
  facility_data?: any;
}

function buildIncidentAnalysisPrompt(incidentData: any, analysisType: string, sdsDocuments?: any[], facilityData?: any): string {
  let systemPrompt = `You are Sarah, an experienced Chemical Safety Manager with 15 years in industrial safety. You're analyzing a workplace incident to provide expert safety insights. Always maintain your warm but professional personality while delivering critical safety analysis.

INCIDENT ANALYSIS EXPERTISE:
- Root cause analysis using systematic investigation methods
- Regulatory compliance (OSHA, EPA, DOT standards)
- Chemical hazard assessment and SDS interpretation
- Injury prevention and safety system design
- Incident investigation best practices

ANALYSIS GUIDELINES:
1. Be thorough but concise in your analysis
2. Provide actionable recommendations
3. Reference specific regulations when applicable
4. Consider both immediate and systemic factors
5. Prioritize worker safety above all else

INCIDENT DETAILS:
- Type: ${incidentData.incident_type}
- Location: ${incidentData.location}
- Description: ${incidentData.description}
- Activity: ${incidentData.activity_being_performed}
- Person Involved: ${incidentData.person_involved_name} (${incidentData.person_involved_job_title || 'Position not specified'})
- Date: ${incidentData.incident_date}`;

  if (incidentData.equipment_materials_involved) {
    systemPrompt += `\n- Equipment/Materials: ${incidentData.equipment_materials_involved}`;
  }

  if (incidentData.ppe_used !== null) {
    systemPrompt += `\n- PPE Used: ${incidentData.ppe_used ? 'Yes' : 'No'}`;
    if (incidentData.ppe_details) {
      systemPrompt += ` (${incidentData.ppe_details})`;
    }
  }

  if (incidentData.immediate_actions_taken) {
    systemPrompt += `\n- Immediate Actions: ${incidentData.immediate_actions_taken}`;
  }

  if (sdsDocuments && sdsDocuments.length > 0) {
    systemPrompt += `\n\nRELATED CHEMICAL DATA:`;
    sdsDocuments.forEach(sds => {
      systemPrompt += `\n- ${sds.product_name}`;
      if (sds.manufacturer) systemPrompt += ` (${sds.manufacturer})`;
      if (sds.signal_word) systemPrompt += ` - Signal Word: ${sds.signal_word}`;
      if (sds.h_codes && sds.h_codes.length > 0) {
        systemPrompt += `\n  Hazards: ${sds.h_codes.map((h: any) => `${h.code}: ${h.description}`).join('; ')}`;
      }
    });
  }

  if (facilityData?.facility_name) {
    systemPrompt += `\n\nFACILITY CONTEXT: ${facilityData.facility_name}`;
  }

  // Add specific analysis type instructions
  switch (analysisType) {
    case 'root_cause':
      systemPrompt += `\n\nANALYSIS REQUESTED: ROOT CAUSE ANALYSIS
Provide a systematic root cause analysis using the 5-Whys method or fishbone diagram approach. Identify:
1. Immediate causes (what directly caused the incident)
2. Basic causes (underlying factors that allowed it to happen)
3. Root causes (systemic issues in management systems)
Focus on preventable factors and system failures.`;
      break;
    
    case 'recommendations':
      systemPrompt += `\n\nANALYSIS REQUESTED: CORRECTIVE ACTION RECOMMENDATIONS
Provide specific, actionable recommendations prioritized by:
1. Immediate actions (to prevent recurrence)
2. Short-term improvements (within 30 days)
3. Long-term system changes (process improvements)
Include regulatory requirements and best practices.`;
      break;
    
    case 'follow_up_questions':
      systemPrompt += `\n\nANALYSIS REQUESTED: INVESTIGATION FOLLOW-UP QUESTIONS
Generate 5-8 critical questions that should be investigated further to:
1. Clarify unclear aspects of the incident
2. Identify additional contributing factors
3. Gather evidence for root cause analysis
4. Ensure regulatory compliance requirements are met`;
      break;
    
    case 'chemical_correlation':
      systemPrompt += `\n\nANALYSIS REQUESTED: CHEMICAL HAZARD CORRELATION
Analyze the relationship between any chemicals involved and the incident:
1. Chemical properties that may have contributed
2. Proper handling procedures that were missed
3. PPE requirements based on SDS data
4. Storage and compatibility issues
5. Regulatory reporting requirements for chemical incidents`;
      break;
  }

  return systemPrompt;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { incident_data, analysis_type, related_sds_documents, facility_data }: IncidentAnalysisRequest = await req.json();
    
    console.log('🔍 AI Incident Analysis request:', { 
      analysisType: analysis_type,
      incidentType: incident_data.incident_type,
      hasSDSData: !!(related_sds_documents && related_sds_documents.length > 0),
      facilityName: facility_data?.facility_name 
    });

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const systemPrompt = buildIncidentAnalysisPrompt(incident_data, analysis_type, related_sds_documents, facility_data);

    console.log('🔄 Calling OpenAI API for incident analysis...');
    
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
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Please provide a ${analysis_type.replace('_', ' ')} analysis for this incident.`
          }
        ],
        temperature: 0.3,
        max_tokens: 1200,
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

    console.log('✅ AI incident analysis generated successfully');

    return new Response(
      JSON.stringify({ 
        analysis: aiResponse,
        analysis_type,
        confidence_score: 0.85, // Default confidence for now
        usage: data.usage
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ AI Incident Analysis error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate incident analysis',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
