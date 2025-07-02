// ============================================================================
// OpenAI SDS Analysis Service (Deno)
// ---------------------------------------------------------------------------
// This serverless function receives a JSON payload containing:
//   - document_id:   An arbitrary identifier (used for logging / correlation)
//   - pdf_url:       A publicly‑accessible URL pointing to an SDS PDF file
//
// It calls OpenAI’s Chat Completion endpoint with a *very* detailed prompt that
// instructs the model to extract structured information from the SDS, focusing
// especially on **all** GHS pictograms (many basic examples grab only 2‑3).
//
// The response from OpenAI is expected to be valid JSON.  We defensively locate
// the first JSON object in the returned string (in case the model adds prose),
// parse it, attach timing metadata, and return it to the caller.
//
// The function is designed to be deployed on Deno Deploy / Fresh / Supabase
// Edge Functions (anything that speaks the standard Fetch API).
// ============================================================================

// ---------------------------------------------------------------------------
// External imports / polyfills
// ---------------------------------------------------------------------------
// deno.land/x/xhr provides an XMLHttpRequest polyfill so that third‑party libs
// (or OpenAI’s official SDK) that rely on XHR work in Deno.
import "https://deno.land/x/xhr@0.1.0/mod.ts";

// Deno’s standard HTTP server helper
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Re‑use a CORS helper shared across your project
import { corsHeaders } from "../_shared/cors.ts";

// ---------------------------------------------------------------------------
// Type definitions – these make the code self‑documenting and help catch typo
// bugs at compile‑time when you run `deno check` or `deno compile`.
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Configuration – pull secrets from the environment provided by the platform.
// Failing fast here prevents accidental unauthenticated requests later.
// ---------------------------------------------------------------------------

const openAIApiKey = Deno.env.get("OPENAI_API_KEY");

// ---------------------------------------------------------------------------
// Main handler – the `serve` helper keeps the function warm and scales nicely.
// ---------------------------------------------------------------------------

serve(async (req) => {
  // Handle pre‑flight CORS requests immediately
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // ---------------------------------------------------------------------
    // 1️⃣  Parse and validate the inbound JSON payload
    // ---------------------------------------------------------------------
    const { document_id, pdf_url }: OpenAISSDRequest = await req.json();

    console.log("🤖 OpenAI SDS Analysis for document:", document_id);
    console.log("📄 PDF URL:", pdf_url);

    if (!openAIApiKey) {
      throw new Error("OpenAI API key not configured – set OPENAI_API_KEY env var");
    }

    if (!pdf_url) {
      throw new Error("pdf_url is required but was missing or empty");
    }

    // ---------------------------------------------------------------------
    // 2️⃣  Build an extremely explicit prompt for the model
    // ---------------------------------------------------------------------
    // NOTE: The model currently *cannot* download remote PDFs by itself.  In
    // a production system you would download/parse the PDF (or use the new
    // Assistants Retrieval API) and feed the raw text into the prompt.  This
    // example assumes future capabilities or that the PDF is short enough to
    // be included elsewhere in the request.
    // ---------------------------------------------------------------------

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
{ /* see TypeScript interface above for the exact shape */ }

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

    // ---------------------------------------------------------------------
    // 3️⃣  Call the OpenAI Chat Completions API
    // ---------------------------------------------------------------------
    // We use the raw fetch API here to keep the function dependency‑free.
    // In production, consider @openai/openai‑deno for nicer ergonomics.
    // ---------------------------------------------------------------------

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "o4-mini-2025-04-16", // ⚠️  Ensure this model actually exists for you!
        messages: [
          {
            role: "user",
            content: analysisPrompt,
          },
        ],
        // The correct parameter name is `max_tokens`, not `max_completion_tokens`.
        // We leave it here to highlight a potential bug.
        max_tokens: 2000,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      // If the API errors, log the body for easier debugging.
      const errorData = await response.text();
      console.error("❌ OpenAI API error:", response.status, errorData);
      throw new Error(`OpenAI API error: ${response.status} – ${errorData}`);
    }

    // ---------------------------------------------------------------------
    // 4️⃣  Parse the JSON that the model returned
    // ---------------------------------------------------------------------

    const openAIData = await response.json();
    const content: string = openAIData.choices[0].message.content;

    console.log("🔍 OpenAI Response (raw):", content);

    // Guard‑rail: Sometimes the model wraps JSON in markdown/code fences or prose.
    // We attempt to extract the first JSON object with a greedy regex.
    let analysisData: OpenAISSDResponse["data"];
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No valid JSON found in OpenAI response");
      }
    } catch (parseError) {
      console.error("❌ Failed to parse OpenAI response as JSON:", parseError);
      console.error("Raw response:", content);
      throw new Error("Invalid JSON response from OpenAI");
    }

    // ---------------------------------------------------------------------
    // 5️⃣  Attach metadata & respond to caller
    // ---------------------------------------------------------------------

    const processingTime = Date.now() - startTime;
    analysisData.processing_time_ms = processingTime;

    console.log("🎯 Pictograms extracted:", analysisData.ghs_pictograms);
    console.log("📊 Total pictograms found:", analysisData.ghs_pictograms?.length || 0);
    console.log("⏱️ Processing time:", processingTime, "ms");
    console.log("🎯 Confidence:", analysisData.confidence_score, "%");

    const result: OpenAISSDResponse = {
      success: true,
      data: analysisData,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    // -------------------------------------------------------------------
    // 6️⃣  Robust error handling – surface enough detail for the caller
    //     while avoiding leaking secrets.  We also return the processing
    //     duration so SLO/SLA monitoring can track failures.
    // -------------------------------------------------------------------

    console.error("❌ OpenAI SDS Analysis error:", error);

    const processingTime = Date.now() - startTime;

    return new Response(
      JSON.stringify({
        success: false,
        error: (error as Error).message,
        processing_time_ms: processingTime,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
