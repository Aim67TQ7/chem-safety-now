
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Eye, Bot, ExternalLink } from 'lucide-react';
import { RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

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
  };
  onView: (document: any) => void;
  onDownload: (document: any) => void;
  isSelected: boolean;
  onSelect: (document: any) => void;
  showSelection: boolean;
}

const SDSResultCard: React.FC<SDSResultCardProps> = ({
  document,
  onView,
  onDownload,
  isSelected,
  onSelect,
  showSelection
}) => {
  return (
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
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onView(document)}
            className="flex items-center space-x-1"
          >
            <Eye className="h-4 w-4" />
            <span>View</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDownload(document)}
            className="flex items-center space-x-1"
          >
            <Download className="h-4 w-4" />
            <span>Download</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SDSResultCard;
