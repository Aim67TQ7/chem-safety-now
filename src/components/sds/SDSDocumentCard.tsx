import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Printer, AlertTriangle } from 'lucide-react';
import { getSDSDocumentStatus, getComplianceStatusBadge } from '@/utils/sdsStatusUtils';
import SDSEvaluationButton from '@/components/SDSEvaluationButton';

interface SDSDocument {
  id: string;
  product_name: string;
  manufacturer?: string | null;
  cas_number?: string | null;
  source_url: string;
  bucket_url?: string | null;
  file_name: string;
  extraction_quality_score?: number | null;
  is_readable?: boolean | null;
  created_at: string;
  h_codes?: any; // JSON field from Supabase
  signal_word?: string | null;
  pictograms?: any; // JSON field from Supabase
  ai_extraction_confidence?: number | null;
  extraction_status?: string | null;
  ai_extracted_data?: any;
}

interface SDSDocumentCardProps {
  document: SDSDocument;
  onView: (doc: SDSDocument) => void;
  onPrintLabel: (doc: SDSDocument) => void;
  onEvaluationComplete: () => void;
  searchTerm?: string;
}

const highlightSearchTerm = (text: string, searchTerm: string) => {
  if (!searchTerm) return text;
  
  const regex = new RegExp(`(${searchTerm})`, 'gi');
  const parts = text.split(regex);
  
  return parts.map((part, index) => 
    regex.test(part) ? (
      <mark key={index} className="bg-yellow-200 px-1 rounded">
        {part}
      </mark>
    ) : part
  );
};

export const SDSDocumentCard = ({ 
  document, 
  onView, 
  onPrintLabel, 
  onEvaluationComplete,
  searchTerm = ''
}: SDSDocumentCardProps) => {
  const statusInfo = getSDSDocumentStatus(document);
  const badgeInfo = getComplianceStatusBadge(document);

  return (
    <Card className="hover:shadow-md transition-shadow border border-border bg-card">
      <CardContent className="p-4">
        {/* Mobile-first layout */}
        <div className="space-y-3">
          {/* Header with product name and status */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base text-foreground leading-tight">
                {highlightSearchTerm(document.product_name, searchTerm)}
              </h3>
              {document.manufacturer && (
                <p className="text-sm text-muted-foreground mt-1">
                  {highlightSearchTerm(document.manufacturer, searchTerm)}
                </p>
              )}
            </div>
            <Badge 
              variant={badgeInfo.variant}
              className={`shrink-0 text-xs ${badgeInfo.className}`}
            >
              {badgeInfo.label}
            </Badge>
          </div>

          {/* Key details - only show if relevant */}
          {(document.cas_number || document.signal_word) && (
            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              {document.cas_number && (
                <span>CAS: {highlightSearchTerm(document.cas_number, searchTerm)}</span>
              )}
              {document.signal_word && (
                <Badge variant="outline" className="text-xs">
                  {document.signal_word}
                </Badge>
              )}
            </div>
          )}

          {/* Warning for manual review */}
          {document.extraction_status === 'manual_review_required' && (
            <div className="flex items-center gap-2 p-2 bg-orange-50 text-orange-700 rounded-md text-xs">
              <AlertTriangle className="h-3 w-3 shrink-0" />
              <span>Requires EHS review before labeling</span>
            </div>
          )}

          {/* Action buttons - mobile-optimized */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex gap-2 flex-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onView(document)}
                className="flex-1 h-9"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View SDS
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => onPrintLabel(document)}
                className={`flex-1 h-9 text-white ${
                  document.extraction_status === 'osha_compliant' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : document.extraction_status === 'manual_review_required'
                    ? 'bg-orange-600 hover:bg-orange-700'
                    : 'bg-primary hover:bg-primary/90'
                }`}
              >
                <Printer className="h-4 w-4 mr-2" />
                Print Label
              </Button>
            </div>
            <div className="sm:w-auto">
              <SDSEvaluationButton 
                document={document} 
                onEvaluationComplete={onEvaluationComplete}
              />
            </div>
          </div>

          {/* Footer with date */}
          <div className="flex justify-between items-center text-xs text-muted-foreground pt-2 border-t border-border">
            <span>Added {new Date(document.created_at).toLocaleDateString()}</span>
            {statusInfo.isEvaluated && (
              <span className="font-medium">
                {Math.round(statusInfo.confidence)}% confidence
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};