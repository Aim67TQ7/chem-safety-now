
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
    
    if (status === 'osha_compliant' && confidence >= 98) {
      return { 
        label: 'OSHA Compliant', 
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
    console.log('🔍 Starting PDF evaluation for:', document.product_name);

    try {
      // Call the extract-sds-text edge function with enhanced GHS-to-HMIS conversion
      const { data: extractionResult, error: extractionError } = await supabase.functions.invoke('extract-sds-text', {
        body: { 
          document_id: document.id,
          bucket_url: document.bucket_url || document.source_url
        }
      });

      if (extractionError) {
        console.error('❌ PDF evaluation error:', extractionError);
        throw new Error(extractionError.message || 'Evaluation failed');
      }

      console.log('✅ PDF evaluation completed:', extractionResult);

      // Show success message with quality score
      const qualityScore = extractionResult.quality_score || 0;
      const confidence = extractionResult.confidence || 0;
      
      if (qualityScore >= 90 && confidence >= 98) {
        toast.success(`✅ OSHA-compliant evaluation completed for ${document.product_name} (${confidence}% confidence)`);
      } else if (qualityScore >= 70) {
        toast.success(`🤖 AI-enhanced evaluation completed for ${document.product_name} (${confidence}% confidence)`);
      } else {
        toast.warning(`⚠️ ${document.product_name} evaluation completed but may require manual review`);
      }

      // Refresh the parent component
      onEvaluationComplete();

    } catch (error) {
      console.error('❌ Error during PDF evaluation:', error);
      toast.error(`Failed to evaluate ${document.product_name}: ${error.message}`);
    } finally {
      setIsEvaluating(false);
    }
  };

  const status = getEvaluationStatus();
  const StatusIcon = status.icon;

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={status.variant}
        size="sm"
        onClick={handleEvaluate}
        disabled={isEvaluating}
        className="text-xs h-6 px-2"
      >
        {isEvaluating ? (
          <>
            <Loader2 className="h-2 w-2 mr-1 animate-spin" />
            Evaluating...
          </>
        ) : (
          <>
            <StatusIcon className="h-2 w-2 mr-1" />
            {status.action}
          </>
        )}
      </Button>
      
      {document.ai_extraction_date && (
        <span className="text-xs text-gray-500">
          {new Date(document.ai_extraction_date).toLocaleDateString()}
        </span>
      )}
    </div>
  );
};

export default SDSEvaluationButton;
