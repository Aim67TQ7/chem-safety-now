import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Eye, ExternalLink, Printer, Bot } from 'lucide-react';
import { RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import SDSEvaluationButton from '@/components/SDSEvaluationButton';
import { useIsMobile } from '@/hooks/use-mobile';

interface SDSResultCardProps {
  document: {
    id?: string;
    product_name: string;
    manufacturer?: string;
    source_url: string;
    bucket_url?: string;
    confidence?: {
      score: number;
      reasons: string[];
    };
    extraction_quality_score?: number | null;
    is_readable?: boolean | null;
    created_at?: string;
    h_codes?: any;
    signal_word?: string | null;
    pictograms?: any;
    ai_extraction_confidence?: number | null;
    extraction_status?: string | null;
    ai_extracted_data?: any;
    file_name?: string;
    cas_number?: string | null;
  };
  onView: (document: any) => void;
  onDownload: (document: any) => void;
  onPrintLabel?: (document: any) => void;
  onAskAI?: (document: any) => void;
  onEvaluationComplete?: () => void;
  isSelected: boolean;
  onSelect: (document: any) => void;
  showSelection: boolean;
  facilitySlug?: string;
  isAdminContext?: boolean;
}

const SDSResultCard: React.FC<SDSResultCardProps> = ({
  document,
  onView,
  onDownload,
  onPrintLabel,
  onAskAI,
  onEvaluationComplete,
  isSelected,
  onSelect,
  showSelection,
  facilitySlug,
  isAdminContext = false
}) => {
  const { isMobile, isTouchDevice } = useIsMobile();

  return (
    <>
      <Card className={`border-border hover:shadow-lg transition-shadow ${isSelected ? 'ring-2 ring-primary bg-primary/5' : ''}`}>
        <CardHeader className={`${isMobile ? 'pb-2' : 'pb-3'}`}>
          <div className={`flex items-start ${isMobile ? 'flex-col space-y-2' : 'justify-between'}`}>
            <div className="flex items-center space-x-2 flex-1">
              {showSelection && (
                <div className={`flex items-center space-x-2 ${isMobile ? 'mb-2' : 'mr-3'}`}>
                  <RadioGroupItem 
                    value={document.id || document.source_url}
                    id={document.id || document.source_url}
                    checked={isSelected}
                    onClick={() => onSelect(document)}
                    className={isTouchDevice ? 'h-5 w-5' : ''}
                  />
                  <Label htmlFor={document.id || document.source_url} className="sr-only">
                    Select {document.product_name}
                  </Label>
                </div>
              )}
              <FileText className={`${isMobile ? 'h-6 w-6' : 'h-5 w-5'} text-primary flex-shrink-0`} />
              <CardTitle className={`${isMobile ? 'text-lg' : 'text-lg'} cursor-pointer leading-tight`} onClick={() => onSelect(document)}>
                {document.product_name}
              </CardTitle>
            </div>
            {document.confidence && (
              <span className={`text-xs bg-success/10 text-success border border-success/20 px-2 py-1 rounded ${isMobile ? 'self-start' : ''}`}>
                {(document.confidence.score * 100).toFixed(0)}% match
              </span>
            )}
          </div>
          {document.manufacturer && (
            <p className={`${isMobile ? 'text-sm' : 'text-sm'} text-muted-foreground`}>
              <strong>Manufacturer:</strong> {document.manufacturer}
            </p>
          )}
          <div className={`flex items-center space-x-1 ${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground`}>
            <ExternalLink className="h-3 w-3" />
            <span className="truncate">{document.source_url}</span>
          </div>
          
          {/* Confidence reasons if available */}
          {document.confidence?.reasons && document.confidence.reasons.length > 0 && (
            <div className={`${isMobile ? 'mt-2' : 'mt-2'}`}>
              <span className="text-xs font-medium text-success">
                Matched on: {document.confidence.reasons.join(', ')}
              </span>
            </div>
          )}
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'flex-wrap gap-2 justify-center'}`}>
            <Button
              variant="outline"
              size={isMobile ? "default" : "sm"}
              onClick={() => onView(document)}
              className={`${isMobile ? 'h-10 w-full justify-start' : 'h-8 px-3 text-xs'} ${isTouchDevice ? 'min-h-[44px]' : ''}`}
            >
              <ExternalLink className={`${isMobile ? 'h-4 w-4 mr-2' : 'h-3 w-3 mr-1.5'}`} />
              View PDF
            </Button>
            {onPrintLabel && (
              <Button
                variant="default"
                size={isMobile ? "default" : "sm"}
                onClick={() => onPrintLabel(document)}
                className={`${isMobile ? 'h-10 w-full justify-start' : 'h-8 px-3 text-xs'} ${isTouchDevice ? 'min-h-[44px]' : ''} bg-primary hover:bg-primary/90 text-primary-foreground`}
              >
                <Printer className={`${isMobile ? 'h-4 w-4 mr-2' : 'h-3 w-3 mr-1.5'}`} />
                Print Label
              </Button>
            )}
            {onAskAI && (
              <Button
                variant="outline"
                size={isMobile ? "default" : "sm"}
                onClick={() => onAskAI(document)}
                className={`${isMobile ? 'h-10 w-full justify-start' : 'h-8 px-3 text-xs'} ${isTouchDevice ? 'min-h-[44px]' : ''}`}
              >
                <Bot className={`${isMobile ? 'h-4 w-4 mr-2' : 'h-3 w-3 mr-1.5'}`} />
                Use AI
              </Button>
            )}
            {onEvaluationComplete && (
              <div className={isMobile ? 'w-full' : ''}>
                <SDSEvaluationButton 
                  document={document} 
                  onEvaluationComplete={onEvaluationComplete}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default SDSResultCard;
