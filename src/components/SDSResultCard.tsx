
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Eye, ExternalLink, Bot, Loader2 } from 'lucide-react';
import { RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [labelData, setLabelData] = useState<any>(null);
  const [showLabelData, setShowLabelData] = useState(false);

  const handleLabelAnalysis = async () => {
    try {
      setIsAnalyzing(true);
      console.log('🤖 Starting OpenAI SDS analysis for:', document.product_name);

      const pdfUrl = document.bucket_url || document.source_url;
      
      const { data, error } = await supabase.functions.invoke('openai-sds-analysis', {
        body: {
          document_id: document.id || 'temp-id',
          pdf_url: pdfUrl
        }
      });

      if (error) {
        console.error('❌ OpenAI analysis error:', error);
        throw error;
      }

      if (data.success && data.data) {
        console.log('✅ OpenAI analysis complete:', data.data);
        setLabelData(data.data);
        setShowLabelData(true);
        toast.success(`Label data extracted for ${document.product_name}`);
      } else {
        throw new Error(data.error || 'Analysis failed');
      }

    } catch (error: any) {
      console.error('❌ Label analysis failed:', error);
      toast.error(`Failed to analyze document: ${error.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderLabelData = () => {
    if (!labelData) return null;

    return (
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-blue-900">Label Data Analysis</h4>
          <div className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded">
            {labelData.confidence_score}% confidence
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <label className="font-medium text-gray-700">Product Name:</label>
            <p className="text-gray-900">{labelData.product_name || 'N/A'}</p>
          </div>
          
          <div>
            <label className="font-medium text-gray-700">Manufacturer:</label>
            <p className="text-gray-900">{labelData.manufacturer || 'N/A'}</p>
          </div>
          
          <div>
            <label className="font-medium text-gray-700">CAS Number:</label>
            <p className="text-gray-900">{labelData.cas_number || 'N/A'}</p>
          </div>
          
          <div>
            <label className="font-medium text-gray-700">Signal Word:</label>
            <p className={`font-semibold ${labelData.signal_word === 'DANGER' ? 'text-red-600' : 'text-orange-600'}`}>
              {labelData.signal_word || 'N/A'}
            </p>
          </div>
          
          {labelData.hmis_codes && (
            <div className="md:col-span-2">
              <label className="font-medium text-gray-700">HMIS Codes:</label>
              <div className="flex space-x-4 mt-1">
                <span className="text-xs bg-blue-100 px-2 py-1 rounded">
                  Health: {labelData.hmis_codes.health || 'N/A'}
                </span>
                <span className="text-xs bg-red-100 px-2 py-1 rounded">
                  Flammability: {labelData.hmis_codes.flammability || 'N/A'}
                </span>
                <span className="text-xs bg-yellow-100 px-2 py-1 rounded">
                  Physical: {labelData.hmis_codes.physical_hazard || 'N/A'}
                </span>
                <span className="text-xs bg-purple-100 px-2 py-1 rounded">
                  PPE: {labelData.hmis_codes.ppe || 'N/A'}
                </span>
              </div>
            </div>
          )}
          
          {labelData.h_codes && labelData.h_codes.length > 0 && (
            <div className="md:col-span-2">
              <label className="font-medium text-gray-700">H-Codes:</label>
              <div className="flex flex-wrap gap-1 mt-1">
                {labelData.h_codes.slice(0, 8).map((hCode: string, index: number) => (
                  <span key={index} className="text-xs bg-gray-100 px-2 py-1 rounded border">
                    {hCode}
                  </span>
                ))}
                {labelData.h_codes.length > 8 && (
                  <span className="text-xs text-gray-500">+{labelData.h_codes.length - 8} more</span>
                )}
              </div>
            </div>
          )}
          
          {labelData.ghs_pictograms && labelData.ghs_pictograms.length > 0 && (
            <div className="md:col-span-2">
              <label className="font-medium text-gray-700">GHS Pictograms:</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {labelData.ghs_pictograms.map((pictogram: string, index: number) => (
                  <span key={index} className="text-xs bg-orange-100 px-2 py-1 rounded border border-orange-200">
                    {pictogram}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {labelData.revision_date && (
            <div>
              <label className="font-medium text-gray-700">Revision Date:</label>
              <p className="text-gray-900">{labelData.revision_date}</p>
            </div>
          )}
        </div>
        
        <div className="mt-3 pt-3 border-t border-blue-200">
          <div className="flex items-center justify-between text-xs text-blue-600">
            <span>Processing time: {labelData.processing_time_ms}ms</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowLabelData(false)}
              className="text-xs h-6 px-2"
            >
              Hide
            </Button>
          </div>
        </div>
      </div>
    );
  };

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
        <div className="flex justify-center space-x-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => onDownload(document)}
            className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Eye className="h-4 w-4" />
            <span>View</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleLabelAnalysis}
            disabled={isAnalyzing}
            className="flex items-center space-x-1 border-purple-300 text-purple-700 hover:bg-purple-50"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Bot className="h-4 w-4" />
                <span>Label Data</span>
              </>
            )}
          </Button>
        </div>
        
        {showLabelData && renderLabelData()}
      </CardContent>
    </Card>
  );
};

export default SDSResultCard;
