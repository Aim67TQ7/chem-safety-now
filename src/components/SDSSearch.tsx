
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import SDSSearchInput from './SDSSearchInput';
import SDSResultCard from './SDSResultCard';
import LabelPrinterPopup from './popups/LabelPrinterPopup';
import DocumentViewerPopup from './popups/DocumentViewerPopup';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup } from '@/components/ui/radio-group';
import { FileText, Loader2, CheckCircle, AlertTriangle, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { AuditService } from '@/services/auditService';

interface SDSSearchProps {
  facilityId: string;
  onDocumentSelect?: (document: any) => void;
  onAskAI?: (document: any) => void;
}

const SDSSearch: React.FC<SDSSearchProps> = ({ facilityId, onDocumentSelect, onAskAI }) => {
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<string>('');
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<any>(null);
  const [showLabelPrinter, setShowLabelPrinter] = useState(false);
  const [processedDocument, setProcessedDocument] = useState<any>(null);

  // Query for existing SDS documents in the library with pagination
  const { data: existingDocuments } = useQuery({
    queryKey: ['sds-documents-library'],
    queryFn: async () => {
      console.log('📚 Fetching SDS documents library...');
      const response = await supabase.functions.invoke('sds-documents', {
        body: { limit: 50, page: 1 }
      });
      
      if (response.error) {
        console.error('❌ Error fetching documents library:', response.error);
        return [];
      }
      
      console.log('✅ Fetched documents library:', response.data?.documents?.length || 0);
      return response.data?.documents || [];
    },
    enabled: true
  });

  const handleSearchResults = (results: any[]) => {
    console.log('🔍 Search results received:', results.length);
    setSearchResults(results);
    setIsSearching(false);
    setSelectedDocument(null);
    setProcessedDocument(null);
  };

  const handleSearchStart = () => {
    setIsSearching(true);
    setSearchResults([]);
    setSelectedDocument(null);
    setProcessedDocument(null);
  };

  const handleDocumentSelect = (document: any) => {
    console.log('📋 Document selected:', document.product_name);
    setSelectedDocument(document);
  };

  const handleConfirmSelection = async () => {
    if (!selectedDocument) return;

    setIsProcessing(true);
    setProcessingStage('Preparing document...');
    console.log('🔧 Processing selected document:', selectedDocument.product_name);

    try {
      let documentToProcess = selectedDocument;
      
      // Step 1: Save document to database if it's from web search (no id means it's new)
      if (!selectedDocument.id) {
        setProcessingStage('Saving document to database...');
        console.log('💾 Saving new document to database...');
        
        const { data: savedDoc, error: saveError } = await supabase
          .from('sds_documents')
          .insert({
            product_name: selectedDocument.product_name,
            manufacturer: selectedDocument.manufacturer,
            source_url: selectedDocument.source_url,
            bucket_url: selectedDocument.bucket_url,
            file_name: selectedDocument.file_name || `${selectedDocument.product_name.replace(/[^a-zA-Z0-9]/g, '_')}_SDS.pdf`,
            document_type: 'safety_data_sheet'
          })
          .select()
          .single();

        if (saveError) {
          console.error('❌ Error saving document:', saveError);
          throw saveError;
        }

        documentToProcess = savedDoc;
        console.log('✅ Document saved with ID:', documentToProcess.id);
      }

      // Step 2: Download PDF if it's from external source
      if (selectedDocument.source_url && !selectedDocument.bucket_url) {
        setProcessingStage('Downloading PDF...');
        console.log('📥 Downloading PDF from external source...');
        
        const { data: downloadResult, error: downloadError } = await supabase.functions.invoke('download-sds-pdf', {
          body: {
            document_id: documentToProcess.id,
            source_url: selectedDocument.source_url,
            file_name: selectedDocument.file_name || `${selectedDocument.product_name.replace(/[^a-zA-Z0-9]/g, '_')}_SDS.pdf`
          }
        });

        if (downloadError) {
          console.error('❌ PDF download error:', downloadError);
          throw downloadError;
        }

        console.log('✅ PDF downloaded successfully:', downloadResult.bucket_url);
        documentToProcess.bucket_url = downloadResult.bucket_url;
      }

      // Step 3: Trigger OSHA-compliant AI extraction
      setProcessingStage('Extracting OSHA-compliant data with AI...');
      console.log('🤖 Starting OSHA-compliant SDS extraction...');
      
      const { data: extractionResult, error: extractionError } = await supabase.functions.invoke('ai-enhanced-sds-extraction', {
        body: { document_id: documentToProcess.id }
      });

      if (extractionError) {
        console.error('❌ AI extraction error:', extractionError);
        throw extractionError;
      }

      console.log('✅ AI extraction completed:', extractionResult);

      // Step 4: Fetch the updated document with extraction results
      setProcessingStage('Finalizing extraction results...');
      const { data: updatedDoc, error: fetchError } = await supabase
        .from('sds_documents')
        .select('*')
        .eq('id', documentToProcess.id)
        .single();

      if (fetchError) {
        console.error('❌ Error fetching updated document:', fetchError);
        throw fetchError;
      }

      setProcessedDocument(updatedDoc);
      
      // Log SDS access for audit trail
      await AuditService.logSDSAccess(facilityId, updatedDoc.product_name, updatedDoc.id);

      // Notify parent components
      if (onDocumentSelect) {
        onDocumentSelect(updatedDoc);
      }

      // Show success message based on extraction status with fallbacks
      const extractionStatus = (updatedDoc as any).extraction_status || 'completed';
      const aiConfidence = (updatedDoc as any).ai_extraction_confidence || 0;
      
      if (extractionStatus === 'osha_compliant') {
        toast.success(`✅ OSHA-compliant extraction completed for ${updatedDoc.product_name} (${aiConfidence}% confidence)`);
      } else if (extractionStatus === 'manual_review_required') {
        toast.warning(`⚠️ ${updatedDoc.product_name} requires manual review by EHS specialist before labeling`);
      } else {
        toast.success(`Successfully processed SDS for ${updatedDoc.product_name}`);
      }

      console.log('✅ Document processing completed');

    } catch (error) {
      console.error('❌ Error processing document:', error);
      toast.error(`Failed to process ${selectedDocument.product_name}: ${error.message}`);
    } finally {
      setIsProcessing(false);
      setProcessingStage('');
    }
  };

  const handleView = (document: any) => {
    console.log('👁️ Viewing document:', document.product_name);
    setViewingDocument(document);
    setShowDocumentViewer(true);
  };

  const handleDownload = (document: any) => {
    console.log('📥 Downloading document:', document.product_name);
    if (document.source_url) {
      window.open(document.source_url, '_blank');
      toast.success(`Opening download for ${document.product_name}`);
    } else {
      toast.error('Download URL not available');
    }
  };

  const handlePrintLabel = () => {
    if (processedDocument) {
      setShowLabelPrinter(true);
    }
  };

  const handleAskAI = (document: any) => {
    console.log('🤖 Ask Stanley about document:', document.product_name);
    
    if (onAskAI) {
      onAskAI(document);
    }
    
    toast.success(`Stanley is ready to answer questions about ${document.product_name}`);
  };

  const getComplianceIcon = (doc: any) => {
    const status = (doc as any).extraction_status || 'completed';
    if (status === 'osha_compliant') return Shield;
    if (status === 'manual_review_required') return AlertTriangle;
    return CheckCircle;
  };

  const getComplianceColor = (doc: any) => {
    const status = (doc as any).extraction_status || 'completed';
    if (status === 'osha_compliant') return 'text-green-600';
    if (status === 'manual_review_required') return 'text-orange-600';
    return 'text-blue-600';
  };

  return (
    <div className="space-y-6">
      {/* Main Search Input */}
      <SDSSearchInput
        facilityId={facilityId}
        onSearchResults={handleSearchResults}
        onSearchStart={handleSearchStart}
      />

      {/* Search Status */}
      {isSearching && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-blue-700">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>Searching SDS documents database...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processing Status */}
      {isProcessing && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-green-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{processingStage}</span>
            </div>
            <div className="mt-2 text-sm text-green-600">
              This may take up to 2 minutes for OSHA-compliant extraction...
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Results with Selection */}
      {!isSearching && searchResults.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Found {searchResults.length} SDS Document{searchResults.length > 1 ? 's' : ''}
            </h3>
            {selectedDocument && (
              <Button 
                onClick={handleConfirmSelection}
                disabled={isProcessing}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Process & Extract Data'
                )}
              </Button>
            )}
          </div>
          
          <RadioGroup value={selectedDocument?.id || selectedDocument?.source_url || ''}>
            <div className="grid gap-4">
              {searchResults.map((document, index) => (
                <SDSResultCard
                  key={document.id || index}
                  document={document}
                  onView={handleView}
                  onDownload={handleDownload}
                  isSelected={selectedDocument === document}
                  onSelect={handleDocumentSelect}
                  showSelection={true}
                />
              ))}
            </div>
          </RadioGroup>
          
          {searchResults.length > 1 && (
            <div className="mt-2 p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-600">
                <strong>Select one document</strong> to download, extract OSHA-compliant data, and generate safety labels.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Processed Document Display */}
      {processedDocument && (
        <Card className={`border-2 ${
          (processedDocument as any).extraction_status === 'osha_compliant' 
            ? 'border-green-200 bg-green-50' 
            : (processedDocument as any).extraction_status === 'manual_review_required'
            ? 'border-orange-200 bg-orange-50'
            : 'border-blue-200 bg-blue-50'
        }`}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                {(() => {
                  const ComplianceIcon = getComplianceIcon(processedDocument);
                  return <ComplianceIcon className={`h-5 w-5 mt-1 ${getComplianceColor(processedDocument)}`} />;
                })()}
                <div className="flex-1">
                  <h4 className={`font-medium ${
                    (processedDocument as any).extraction_status === 'osha_compliant' 
                      ? 'text-green-900' 
                      : (processedDocument as any).extraction_status === 'manual_review_required'
                      ? 'text-orange-900'
                      : 'text-blue-900'
                  }`}>
                    {(processedDocument as any).extraction_status === 'osha_compliant' && '🏥 OSHA Compliant: '}
                    {(processedDocument as any).extraction_status === 'manual_review_required' && '⚠️ Manual Review Required: '}
                    {(processedDocument as any).extraction_status === 'ai_enhanced' && '🤖 AI Enhanced: '}
                    {processedDocument.product_name}
                  </h4>
                  {processedDocument.manufacturer && (
                    <p className={`text-sm ${
                      (processedDocument as any).extraction_status === 'osha_compliant' 
                        ? 'text-green-700' 
                        : (processedDocument as any).extraction_status === 'manual_review_required'
                        ? 'text-orange-700'
                        : 'text-blue-700'
                    }`}>
                      Manufacturer: {processedDocument.manufacturer}
                    </p>
                  )}
                  {(processedDocument as any).ai_extraction_confidence && (
                    <div className={`text-sm mt-2 ${
                      (processedDocument as any).extraction_status === 'osha_compliant' 
                        ? 'text-green-700' 
                        : (processedDocument as any).extraction_status === 'manual_review_required'
                        ? 'text-orange-700'
                        : 'text-blue-700'
                    }`}>
                      <strong>Confidence Score:</strong> {(processedDocument as any).ai_extraction_confidence}%
                      {(processedDocument as any).extraction_status === 'osha_compliant' && ' (OSHA Compliant)'}
                    </div>
                  )}
                  {processedDocument.hmis_codes && (
                    <div className={`text-sm mt-1 ${
                      (processedDocument as any).extraction_status === 'osha_compliant' 
                        ? 'text-green-700' 
                        : (processedDocument as any).extraction_status === 'manual_review_required'
                        ? 'text-orange-700'
                        : 'text-blue-700'
                    }`}>
                      <strong>HMIS Codes:</strong> Health: {processedDocument.hmis_codes.health}, 
                      Flammability: {processedDocument.hmis_codes.flammability}, 
                      Physical: {processedDocument.hmis_codes.physical}
                    </div>
                  )}
                  {(processedDocument as any).extraction_status === 'manual_review_required' && (
                    <div className="text-xs text-orange-700 bg-orange-100 p-2 rounded border border-orange-200 mt-2">
                      <AlertTriangle className="h-3 w-3 inline mr-1" />
                      This document requires manual review by an EHS specialist before use for labeling.
                    </div>
                  )}
                </div>
              </div>
              <Button 
                onClick={handlePrintLabel}
                size="sm"
                className={`ml-4 text-white ${
                  (processedDocument as any).extraction_status === 'osha_compliant' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : (processedDocument as any).extraction_status === 'manual_review_required'
                    ? 'bg-orange-600 hover:bg-orange-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                Print Label
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Document Viewer Popup */}
      <DocumentViewerPopup
        isOpen={showDocumentViewer}
        onClose={() => {
          setShowDocumentViewer(false);
          setViewingDocument(null);
        }}
        document={viewingDocument}
        onDownload={handleDownload}
        onAskAI={handleAskAI}
      />

      {/* Label Printer Popup */}
      <LabelPrinterPopup
        isOpen={showLabelPrinter}
        onClose={() => setShowLabelPrinter(false)}
        initialProductName={processedDocument?.product_name}
        initialManufacturer={processedDocument?.manufacturer}
        selectedDocument={processedDocument}
      />
    </div>
  );
};

export default SDSSearch;
