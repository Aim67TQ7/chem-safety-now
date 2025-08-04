import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Eye, ExternalLink, Printer, Bot } from 'lucide-react';
import { RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import SDSEvaluationButton from '@/components/SDSEvaluationButton';

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

  return (
    <>
      <Card className={`border-gray-200 hover:shadow-lg transition-shadow ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2 flex-1">
              {showSelection && (
                <div className="flex items-center space-x-2 mr-3">
                  <RadioGroupItem 
                    value={document.id || document.source_url}
                    id={document.id || document.source_url}
                    checked={isSelected}
                    onClick={() => onSelect(document)}
                  />
                  <Label htmlFor={document.id || document.source_url} className="sr-only">
                    Select {document.product_name}
                  </Label>
                </div>
              )}
              <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <CardTitle className="text-lg cursor-pointer" onClick={() => onSelect(document)}>
                {document.product_name}
              </CardTitle>
            </div>
            {document.confidence && (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                {(document.confidence.score * 100).toFixed(0)}% match
              </span>
            )}
          </div>
          {document.manufacturer && (
            <p className="text-sm text-gray-600">
              <strong>Manufacturer:</strong> {document.manufacturer}
            </p>
          )}
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <ExternalLink className="h-3 w-3" />
            <span className="truncate">{document.source_url}</span>
          </div>
          
          {/* Confidence reasons if available */}
          {document.confidence?.reasons && document.confidence.reasons.length > 0 && (
            <div className="mt-2">
              <span className="text-xs font-medium text-green-600">
                Matched on: {document.confidence.reasons.join(', ')}
              </span>
            </div>
          )}
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2 justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onView(document)}
              className="h-8 px-3 text-xs"
            >
              <ExternalLink className="h-3 w-3 mr-1.5" />
              View PDF
            </Button>
            {onPrintLabel && (
              <Button
                variant="default"
                size="sm"
                onClick={() => onPrintLabel(document)}
                className="h-8 px-3 text-xs bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Printer className="h-3 w-3 mr-1.5" />
                Print Label
              </Button>
            )}
            {onAskAI && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAskAI(document)}
                className="h-8 px-3 text-xs"
              >
                <Bot className="h-3 w-3 mr-1.5" />
                Use AI
              </Button>
            )}
            {onEvaluationComplete && (
              <SDSEvaluationButton 
                document={document} 
                onEvaluationComplete={onEvaluationComplete}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default SDSResultCard;
