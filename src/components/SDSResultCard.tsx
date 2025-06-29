
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Eye, ExternalLink, Bot, Loader2, Printer } from 'lucide-react';
import { RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

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
  facilityId?: string;
}

const SDSResultCard: React.FC<SDSResultCardProps> = ({
  document,
  onView,
  onDownload,
  isSelected,
  onSelect,
  showSelection,
  facilityId
}) => {
  const navigate = useNavigate();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasExtractedData, setHasExtractedData] = useState(false);
  const [savedDocumentId, setSavedDocumentId] = useState<string | null>(null);

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
        
        // Save the extracted data to sds_documents table
        const savedDoc = await saveToDatabase(data.data, pdfUrl);
        if (savedDoc) {
          setSavedDocumentId(savedDoc.id);
          setHasExtractedData(true);
          toast.success(`Label data extracted and saved for ${document.product_name}`);
        }
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

  const saveToDatabase = async (labelData: any, pdfUrl: string) => {
    try {
      console.log('💾 Saving extracted data to database...');
      
      // Create or update the SDS document record
      const documentData = {
        product_name: labelData.product_name || document.product_name,
        manufacturer: labelData.manufacturer || document.manufacturer,
        cas_number: labelData.cas_number,
        signal_word: labelData.signal_word,
        source_url: document.source_url,
        bucket_url: document.bucket_url || pdfUrl,
        file_name: `${document.product_name}_SDS.pdf`,
        file_type: 'application/pdf',
        
        // HMIS codes as JSON
        hmis_codes: labelData.hmis_codes || {},
        
        // H-codes as array of objects
        h_codes: labelData.h_codes ? labelData.h_codes.map((code: string) => ({
          code: code,
          description: `Hazard statement ${code}`
        })) : [],
        
        // GHS pictograms as array of strings
        pictograms: labelData.ghs_pictograms || [],
        
        // Set extraction metadata
        ai_extraction_confidence: labelData.confidence_score || 85,
        extraction_quality_score: labelData.confidence_score || 85,
        extraction_status: 'ai_enhanced',
        ai_extraction_date: new Date().toISOString(),
        is_readable: true,
        document_type: 'sds',
        
        // Additional extracted data
        revision_date: labelData.revision_date,
        
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: savedDoc, error: saveError } = await supabase
        .from('sds_documents')
        .insert([documentData])
        .select()
        .single();

      if (saveError) {
        console.error('❌ Database save error:', saveError);
        throw saveError;
      }

      console.log('✅ Document saved to database:', savedDoc.id);
      return savedDoc;

    } catch (error) {
      console.error('❌ Failed to save to database:', error);
      toast.error('Failed to save label data to database');
      return null;
    }
  };

  const handlePrintLabel = () => {
    if (savedDocumentId) {
      // Navigate to label printer with the saved document ID
      navigate(`/facility/${facilityId}/label-printer?documentId=${savedDocumentId}`);
    } else {
      toast.error('Please extract label data first');
    }
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
                <span>Extract Data</span>
              </>
            )}
          </Button>

          {hasExtractedData && (
            <Button
              variant="default"
              size="sm"
              onClick={handlePrintLabel}
              className="flex items-center space-x-1 bg-green-600 hover:bg-green-700 text-white"
            >
              <Printer className="h-4 w-4" />
              <span>Print Label</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SDSResultCard;
