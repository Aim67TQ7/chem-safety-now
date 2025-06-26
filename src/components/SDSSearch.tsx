
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
import { FileText, Loader2 } from 'lucide-react';
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
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<any>(null);
  const [showLabelPrinter, setShowLabelPrinter] = useState(false);
  const [processedDocument, setProcessedDocument] = useState<any>(null);

  // Query for existing SDS documents in the library
  const { data: existingDocuments } = useQuery({
    queryKey: ['sds-documents-library'],
    queryFn: async () => {
      console.log('📚 Fetching SDS documents library...');
      const response = await supabase.functions.invoke('sds-documents');
      
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
    console.log('🔧 Processing selected document:', selectedDocument.product_name);

    try {
      // Step 1: Save document to database if it's from web search (no id means it's new)
      let documentToProcess = selectedDocument;
      
      if (!selectedDocument.id) {
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

      // Step 2: Trigger AI-enhanced extraction
      console.log('🤖 Starting AI-enhanced SDS extraction...');
      const { data: extractionResult, error: extractionError } = await supabase.functions.invoke('ai-enhanced-sds-extraction', {
        body: { document_id: documentToProcess.id }
      });

      if (extractionError) {
        console.error('❌ AI extraction error:', extractionError);
        throw extractionError;
      }

      // Step 3: Fetch the updated document with extraction results
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

      toast.success(`Successfully processed SDS for ${updatedDoc.product_name}`);
      console.log('✅ Document processing completed');

    } catch (error) {
      console.error('❌ Error processing document:', error);
      toast.error('Failed to process selected document');
    } finally {
      setIsProcessing(false);
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
              <span>Processing document with AI extraction...</span>
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
                  'Process Selected Document'
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
                <strong>Select one document</strong> to process with AI extraction for precise HMIS codes, pictograms, and hazard information.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Processed Document Display */}
      {processedDocument && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <FileText className="h-5 w-5 text-green-600 mt-1" />
                <div className="flex-1">
                  <h4 className="font-medium text-green-900">
                    ✅ Processed: {processedDocument.product_name}
                  </h4>
                  {processedDocument.manufacturer && (
                    <p className="text-sm text-green-700">
                      Manufacturer: {processedDocument.manufacturer}
                    </p>
                  )}
                  {processedDocument.hmis_codes && (
                    <div className="text-sm text-green-700 mt-2">
                      <strong>HMIS Codes:</strong> Health: {processedDocument.hmis_codes.health}, 
                      Flammability: {processedDocument.hmis_codes.flammability}, 
                      Physical: {processedDocument.hmis_codes.physical}
                    </div>
                  )}
                </div>
              </div>
              <Button 
                onClick={handlePrintLabel}
                size="sm"
                className="ml-4"
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
