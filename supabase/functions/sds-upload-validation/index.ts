import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { file_path, original_filename, facility_id } = await req.json()

    console.log('🔍 Validating SDS upload:', { file_path, original_filename, facility_id })

    // Download the file for validation
    const { data: fileData, error: downloadError } = await supabaseClient.storage
      .from('sds-documents')
      .download(file_path)

    if (downloadError) {
      throw new Error(`Failed to download file: ${downloadError.message}`)
    }

    // Convert file to text for analysis
    const fileArrayBuffer = await fileData.arrayBuffer()
    const fileBase64 = btoa(String.fromCharCode(...new Uint8Array(fileArrayBuffer)))

    // Call extract-sds-text function to process the document
    const { data: extractionResult, error: extractionError } = await supabaseClient.functions.invoke('extract-sds-text', {
      body: {
        document_id: crypto.randomUUID(),
        file_data: fileBase64,
        file_name: original_filename,
        validate_only: true
      }
    })

    if (extractionError) {
      console.error('❌ Extraction failed:', extractionError)
      return new Response(
        JSON.stringify({
          is_valid: false,
          validation_errors: ['Failed to extract text from PDF. Please ensure this is a valid PDF file.'],
          confidence_score: 0
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }

    const extractedData = extractionResult?.extracted_data || {}
    const fullText = extractedData.full_text || ''

    // SDS Validation Rules
    const validationErrors: string[] = []
    const warnings: string[] = []
    let confidenceScore = 0

    // 1. Check for SDS-specific content
    const sdsKeywords = [
      'safety data sheet',
      'material safety data sheet',
      'section 1',
      'product identifier',
      'hazard identification',
      'composition',
      'first aid measures',
      'fire fighting measures',
      'accidental release measures',
      'handling and storage',
      'exposure controls',
      'physical and chemical properties',
      'stability and reactivity',
      'toxicological information',
      'ecological information',
      'disposal considerations',
      'transport information',
      'regulatory information'
    ]

    const foundKeywords = sdsKeywords.filter(keyword => 
      fullText.toLowerCase().includes(keyword.toLowerCase())
    )

    if (foundKeywords.length < 5) {
      validationErrors.push('Document does not appear to be a Safety Data Sheet')
    } else {
      confidenceScore += Math.min(foundKeywords.length * 5, 40)
    }

    // 2. Check for required GHS sections (at least 8 of 16 sections)
    const ghsSections = [
      'section 1', 'section 2', 'section 3', 'section 4',
      'section 5', 'section 6', 'section 7', 'section 8',
      'section 9', 'section 10', 'section 11', 'section 12',
      'section 13', 'section 14', 'section 15', 'section 16'
    ]

    const foundSections = ghsSections.filter(section =>
      fullText.toLowerCase().includes(section.toLowerCase())
    )

    if (foundSections.length < 8) {
      validationErrors.push('Document missing too many required GHS sections')
    } else {
      confidenceScore += Math.min(foundSections.length * 2, 20)
    }

    // 3. Check for product name
    let productName = extractedData.product_name || ''
    if (!productName && fullText.length > 100) {
      // Try to extract product name from Section 1
      const section1Match = fullText.match(/section\s*1[^a-z]*product[^:]*:?\s*([^\n\r]{1,100})/i)
      if (section1Match) {
        productName = section1Match[1].trim()
      }
    }

    if (!productName) {
      validationErrors.push('Could not identify product name')
    } else {
      confidenceScore += 10
    }

    // 4. Check for manufacturer information
    let manufacturer = extractedData.manufacturer || ''
    if (!manufacturer && fullText.length > 100) {
      const manufacturerPatterns = [
        /manufacturer[^:]*:?\s*([^\n\r]{1,100})/i,
        /company[^:]*:?\s*([^\n\r]{1,100})/i,
        /supplier[^:]*:?\s*([^\n\r]{1,100})/i
      ]
      
      for (const pattern of manufacturerPatterns) {
        const match = fullText.match(pattern)
        if (match) {
          manufacturer = match[1].trim()
          break
        }
      }
    }

    if (!manufacturer) {
      warnings.push('Manufacturer information not clearly identified')
    } else {
      confidenceScore += 10
    }

    // 5. Check for hazard information
    const hasHazardInfo = extractedData.h_codes?.length > 0 || 
                         extractedData.pictograms?.length > 0 ||
                         extractedData.signal_word ||
                         fullText.toLowerCase().includes('hazard')

    if (!hasHazardInfo) {
      warnings.push('Limited hazard information found')
    } else {
      confidenceScore += 20
    }

    // 6. Check document length (SDS should be substantial)
    if (fullText.length < 1000) {
      validationErrors.push('Document appears too short to be a complete SDS')
    }

    // 7. Check for obvious non-SDS content
    const nonSDSIndicators = [
      'invoice', 'receipt', 'purchase order', 'catalog',
      'manual', 'brochure', 'advertisement', 'email'
    ]

    const foundNonSDSIndicators = nonSDSIndicators.filter(indicator =>
      fullText.toLowerCase().includes(indicator.toLowerCase())
    )

    if (foundNonSDSIndicators.length > 2) {
      validationErrors.push('Document appears to be a different type of document')
    }

    const isValid = validationErrors.length === 0
    const finalConfidenceScore = Math.min(confidenceScore, 100)

    console.log('✅ Validation complete:', {
      isValid,
      confidenceScore: finalConfidenceScore,
      errorsCount: validationErrors.length,
      warningsCount: warnings.length
    })

    return new Response(
      JSON.stringify({
        is_valid: isValid,
        confidence_score: finalConfidenceScore,
        product_name: productName,
        manufacturer: manufacturer,
        validation_errors: validationErrors,
        warnings: warnings,
        extracted_data: extractedData,
        sections_found: foundSections.length,
        keywords_found: foundKeywords.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('❌ Validation error:', error)
    return new Response(
      JSON.stringify({
        is_valid: false,
        validation_errors: [`Validation failed: ${error.message}`],
        confidence_score: 0
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  }
})