
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileSearch, RefreshCw, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SDSEvaluationButtonProps {
  document: any;
  onEvaluationComplete: () => void;
}

const SDSEvaluationButton: React.FC<SDSEvaluationButtonProps> = ({ 
  document, 
  onEvaluationComplete 
}) => {
  const [isEvaluating, setIsEvaluating] = useState(false);

  const getEvaluationStatus = () => {
    const status = document.extraction_status || 'pending';
    const confidence = document.ai_extraction_confidence || 0;
    
    if (status === 'pending' || confidence === 0) {
      return { 
        label: 'Not Evaluated', 
        action: 'Evaluate PDF',
        icon: FileSearch,
        variant: 'outline' as const
      };
    }
    
    if (status === 'completed' && confidence >= 90) {
      return { 
        label: 'High Confidence', 
        action: 'Re-evaluate',
        icon: CheckCircle2,
        variant: 'secondary' as const
      };
    }
    
    return { 
      label: `${confidence}% Confidence`, 
      action: 'Re-evaluate',
      icon: RefreshCw,
      variant: 'outline' as const
    };
  };

  const handleEvaluate = async () => {
    if (!document.bucket_url && !document.source_url) {
      toast.error('No PDF URL available for evaluation');
      return;
    }

    setIsEvaluating(true);
    console.log('🔍 Starting OpenAI PDF evaluation for:', document.product_name);

    try {
      // Construct the public PDF URL for OpenAI access
      let pdfUrl = document.bucket_url || document.source_url;
      
      // If it's a bucket URL, convert to public URL
      if (document.bucket_url && document.bucket_url.startsWith('sds-documents/')) {
        pdfUrl = `https://fwzgsiysdwsmmkgqmbsd.supabase.co/storage/v1/object/public/${document.bucket_url}`;
      }

      console.log('📄 Sending PDF to OpenAI for analysis:', pdfUrl);

      // Call the OpenAI SDS analysis function
      const { data: analysisResult, error: analysisError } = await supabase.functions.invoke('openai-sds-analysis', {
        body: { 
          document_id: document.id,
          pdf_url: pdfUrl
        }
      });

      if (analysisError) {
        console.error('❌ OpenAI analysis error:', analysisError);
        throw new Error(analysisError.message || 'OpenAI analysis failed');
      }

      if (!analysisResult.success) {
        throw new Error(analysisResult.error || 'OpenAI analysis failed');
      }

      console.log('✅ OpenAI analysis completed:', analysisResult.data);

      // Update the document with the analysis results
      const extractedData = analysisResult.data;
      
      const updateData = {
        ai_extracted_data: {
          product_name: extractedData.product_name,
          manufacturer: extractedData.manufacturer,
          cas_number: extractedData.cas_number,
          signal_word: extractedData.signal_word,
          hazard_statements: extractedData.h_codes || [],
          ghs_pictograms: extractedData.ghs_pictograms || [],
          hmis_codes: extractedData.hmis_codes || {},
          confidence_score: extractedData.confidence_score || 0,
          processing_time_ms: extractedData.processing_time_ms || 0,
          analysis_method: 'openai_vision'
        },
        ai_extraction_confidence: extractedData.confidence_score || 0,
        ai_extraction_date: new Date().toISOString(),
        extraction_status: 'completed',
        hmis_codes: extractedData.hmis_codes || {},
        signal_word: extractedData.signal_word,
        pictograms: extractedData.ghs_pictograms || [],
        h_codes: extractedData.h_codes || []
      };

      const { error: updateError } = await supabase
        .from('sds_documents')
        .update(updateData)
        .eq('id', document.id);

      if (updateError) {
        console.error('❌ Error updating document:', updateError);
        throw updateError;
      }

      // Show success message based on confidence
      const confidence = extractedData.confidence_score || 0;
      
      if (confidence >= 90) {
        toast.success(`✅ High-confidence analysis completed for ${document.product_name} (${confidence}% confidence)`);
      } else if (confidence >= 70) {
        toast.success(`🤖 Analysis completed for ${document.product_name} (${confidence}% confidence)`);
      } else {
        toast.warning(`⚠️ ${document.product_name} analysis completed but may require manual review (${confidence}% confidence)`);
      }

      // Refresh the parent component
      onEvaluationComplete();

    } catch (error) {
      console.error('❌ Error during OpenAI analysis:', error);
      toast.error(`Failed to analyze ${document.product_name}: ${error.message}`);
    } finally {
      setIsEvaluating(false);
    }
  };

  const status = getEvaluationStatus();
  const StatusIcon = status.icon;

  return (
    <Button
      variant={status.variant}
      size="sm"
      onClick={handleEvaluate}
      disabled={isEvaluating}
      className="h-8 px-3 text-xs"
    >
      {isEvaluating ? (
        <>
          <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
          Analyzing...
        </>
      ) : (
        <>
          <StatusIcon className="h-3 w-3 mr-1.5" />
          {status.action}
        </>
      )}
    </Button>
  );
};

export default SDSEvaluationButton;
