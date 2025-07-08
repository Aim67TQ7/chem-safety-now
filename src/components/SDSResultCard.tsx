import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Eye, ExternalLink, Bot, Loader2, Printer } from 'lucide-react';
import { RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import ExtractedDataPopup from './popups/ExtractedDataPopup';

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
  facilitySlug?: string;
  isAdminContext?: boolean; // Add admin context prop
}

const SDSResultCard: React.FC<SDSResultCardProps> = ({
  document,
  onView,
  onDownload,
  isSelected,
  onSelect,
  showSelection,
  facilitySlug,
  isAdminContext = false
}) => {
  const navigate = useNavigate();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isQuickPrinting, setIsQuickPrinting] = useState(false);
  const [extractedDataPopupOpen, setExtractedDataPopupOpen] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
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
          
          // Enhanced pictogram processing - prioritize actual GHS pictograms
          const processedData = await processPictogramData(data.data);
          setExtractedData(processedData);
          
          setExtractedDataPopupOpen(true);
          toast.success(`Label data extracted for ${document.product_name}`);
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

  const processPictogramData = async (labelData: any) => {
    // Enhanced pictogram processing - prioritize GHS pictograms over H-codes
    const pictogramMapping: Record<string, string> = {
      'ghs01': 'exploding_bomb',
      'ghs02': 'flame', 
      'ghs03': 'flame_over_circle',
      'ghs04': 'gas_cylinder',
      'ghs05': 'corrosion',
      'ghs06': 'skull_crossbones',
      'ghs07': 'exclamation',
      'ghs08': 'health_hazard',
      'ghs09': 'environment'
    };

    let processedPictograms = [];

    // First priority: Direct GHS pictogram codes from extraction
    if (labelData.ghs_pictograms && Array.isArray(labelData.ghs_pictograms)) {
      processedPictograms = labelData.ghs_pictograms
        .map((code: string) => {
          const normalizedCode = code.toLowerCase().replace(/[^a-z0-9]/g, '');
          return pictogramMapping[normalizedCode] || null;
        })
        .filter(Boolean);
    }

    // Second priority: Derive pictograms from H-codes if no direct pictograms found
    if (processedPictograms.length === 0 && labelData.h_codes && Array.isArray(labelData.h_codes)) {
      const hCodeToPictogram: Record<string, string> = {
        'h200': 'exploding_bomb', 'h201': 'exploding_bomb', 'h202': 'exploding_bomb',
        'h220': 'flame', 'h221': 'flame', 'h222': 'flame', 'h223': 'flame', 'h224': 'flame', 'h225': 'flame', 'h226': 'flame',
        'h270': 'flame_over_circle', 'h271': 'flame_over_circle', 'h272': 'flame_over_circle',
        'h280': 'gas_cylinder', 'h281': 'gas_cylinder',
        'h290': 'corrosion', 'h314': 'corrosion', 'h318': 'corrosion',
        'h300': 'skull_crossbones', 'h301': 'skull_crossbones', 'h302': 'skull_crossbones', 'h310': 'skull_crossbones', 'h311': 'skull_crossbones', 'h330': 'skull_crossbones', 'h331': 'skull_crossbones',
        'h303': 'exclamation', 'h312': 'exclamation', 'h315': 'exclamation', 'h316': 'exclamation', 'h317': 'exclamation', 'h319': 'exclamation', 'h320': 'exclamation', 'h332': 'exclamation', 'h335': 'exclamation', 'h336': 'exclamation',
        'h340': 'health_hazard', 'h341': 'health_hazard', 'h350': 'health_hazard', 'h351': 'health_hazard', 'h360': 'health_hazard', 'h361': 'health_hazard', 'h362': 'health_hazard', 'h370': 'health_hazard', 'h371': 'health_hazard', 'h372': 'health_hazard', 'h373': 'health_hazard',
        'h400': 'environment', 'h401': 'environment', 'h402': 'environment', 'h410': 'environment', 'h411': 'environment', 'h412': 'environment', 'h413': 'environment'
      };

      const derivedPictograms = new Set<string>();
      labelData.h_codes.forEach((hCode: string) => {
        const normalizedHCode = hCode.toLowerCase().replace(/[^a-z0-9]/g, '');
        const pictogram = hCodeToPictogram[normalizedHCode];
        if (pictogram) {
          derivedPictograms.add(pictogram);
        }
      });

      processedPictograms = Array.from(derivedPictograms);
    }

    return {
      ...labelData,
      pictograms: processedPictograms,
      prioritized_pictograms: true
    };
  };

  const saveToDatabase = async (labelData: any, pdfUrl: string) => {
    try {
      console.log('💾 Saving extracted data to database...');
      console.log('📋 Label data structure:', labelData);
      
      // Handle both OpenAI and extract-sds-text response formats
      const isExtractSdsFormat = labelData.hmis_health !== undefined || labelData.product_name || labelData.manufacturer;
      
      // Create or update the SDS document record
      const documentData = {
        product_name: labelData.product_name || document.product_name,
        manufacturer: labelData.manufacturer || document.manufacturer,
        cas_number: labelData.cas_number || labelData.cas_numbers?.[0],
        signal_word: labelData.signal_word,
        source_url: document.source_url,
        bucket_url: document.bucket_url || pdfUrl,
        file_name: `${document.product_name}_SDS.pdf`,
        file_type: 'application/pdf',
        
        // HMIS codes - handle both formats
        hmis_codes: isExtractSdsFormat ? {
          health: labelData.hmis_health || 0,
          flammability: labelData.hmis_flammability || 0,
          physical_hazard: labelData.hmis_physical || 0,
          ppe: labelData.hmis_ppe || 'A'
        } : (labelData.hmis_codes || {}),
        
        // H-codes - handle both formats
        h_codes: (() => {
          const codes = labelData.h_codes || labelData.hazard_codes || [];
          if (Array.isArray(codes)) {
            return codes.map((code: any) => 
              typeof code === 'string' ? { code, description: `Hazard statement ${code}` } : code
            );
          }
          return [];
        })(),
        
        // GHS pictograms - handle both formats
        pictograms: labelData.pictograms || labelData.ghs_pictograms || [],
        
        // Set extraction metadata
        ai_extraction_confidence: labelData.confidence_score || labelData.quality_score || 85,
        extraction_quality_score: labelData.confidence_score || labelData.quality_score || 85,
        extraction_status: 'ai_enhanced',
        ai_extraction_date: new Date().toISOString(),
        is_readable: true,
        document_type: 'sds',
        
        // Additional extracted data
        revision_date: labelData.revision_date,
        full_text: labelData.full_text,
        
        // Additional safety data
        hazard_statements: labelData.hazard_statements || [],
        precautionary_statements: labelData.precautionary_statements || [],
        physical_hazards: labelData.physical_hazards || [],
        health_hazards: labelData.health_hazards || [],
        environmental_hazards: labelData.environmental_hazards || [],
        first_aid: labelData.first_aid || {},
        
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
    if (savedDocumentId && facilitySlug) {
      // Navigate to label printer with the facility slug (not ID)
      console.log('🖨️ Navigating to label printer:', `/facility/${facilitySlug}/label-printer?documentId=${savedDocumentId}`);
      navigate(`/facility/${facilitySlug}/label-printer?documentId=${savedDocumentId}`);
      setExtractedDataPopupOpen(false);
    } else {
      console.error('❌ Missing data for label printing:', { savedDocumentId, facilitySlug });
      toast.error('Please extract label data first or facility information is missing');
    }
  };

  const handleQuickPrint = async () => {
    try {
      setIsQuickPrinting(true);
      console.log('🚀 Starting Quick Print for:', document.product_name);

      const pdfUrl = document.bucket_url || document.source_url;
      
      // Step 1: Extract data using proper extraction function
      toast.loading('Extracting label data...');
      const { data, error } = await supabase.functions.invoke('extract-sds-text', {
        body: {
          pdf_url: pdfUrl,
          product_name: document.product_name,
          manufacturer: document.manufacturer
        }
      });

      if (error) {
        console.error('❌ Quick Print extraction error:', error);
        throw error;
      }

      if (data.success && data.extractedData) {
        // Step 2: Save to database
        toast.loading('Saving document...');
        const savedDoc = await saveToDatabase(data.extractedData, pdfUrl);
        
        if (savedDoc) {
          // Step 3: Navigate immediately
          toast.loading('Opening label printer...');
          
          const printerUrl = isAdminContext 
            ? `/admin/label-printer?documentId=${savedDoc.id}`
            : `/facility/${facilitySlug}/label-printer?documentId=${savedDoc.id}`;
          
          console.log('🖨️ Quick Print navigating to:', printerUrl);
          navigate(printerUrl);
          
          toast.success(`Redirecting to label printer for ${document.product_name}`);
        }
      } else {
        throw new Error(data.error || 'Quick Print failed');
      }

    } catch (error: any) {
      console.error('❌ Quick Print failed:', error);
      toast.error(`Quick Print failed: ${error.message}`);
    } finally {
      setIsQuickPrinting(false);
    }
  };

  const handleViewDocument = () => {
    onView(document);
    setExtractedDataPopupOpen(false);
  };

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
              disabled={isAnalyzing || isQuickPrinting}
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

            <Button
              variant="default"
              size="sm"
              onClick={handleQuickPrint}
              disabled={isQuickPrinting || isAnalyzing}
              className="flex items-center space-x-1 bg-green-600 hover:bg-green-700 text-white"
            >
              {isQuickPrinting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Printer className="h-4 w-4" />
                  <span>Quick Print</span>
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Extracted Data Popup */}
      <ExtractedDataPopup
        isOpen={extractedDataPopupOpen}
        onClose={() => setExtractedDataPopupOpen(false)}
        extractedData={extractedData || {}}
        onPrintLabel={handlePrintLabel}
        onViewDocument={handleViewDocument}
      />
    </>
  );
};

export default SDSResultCard;
