import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import SDSSearchInput from './SDSSearchInput';
import SDSResultCard from './SDSResultCard';
import SDSSelectionDialog from './SDSSelectionDialog';
import SDSViewerPopup from './popups/SDSViewerPopup';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface SDSSearchProps {
  facilityId: string;
  onDocumentSelect?: (document: any) => void;
}

const SDSSearch: React.FC<SDSSearchProps> = ({ facilityId, onDocumentSelect }) => {
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSelectionDialog, setShowSelectionDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showViewerPopup, setShowViewerPopup] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<any>(null);

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
  };

  const handleSearchStart = () => {
    setIsSearching(true);
    setSearchResults([]);
    setShowSelectionDialog(false);
    setSelectedDocument(null);
  };

  const handleDocumentSelect = (document: any) => {
    console.log('📋 Document selected:', document.product_name);
    setSelectedDocument(document);
    
    if (onDocumentSelect) {
      onDocumentSelect(document);
    }
  };

  const handleView = (document: any) => {
    console.log('👁️ Viewing document:', document.product_name);
    setViewingDocument(document);
    setShowViewerPopup(true);
    toast.success(`Opening SDS viewer for ${document.product_name}`);
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

  const handleParse = (document: any) => {
    console.log('🔍 Parsing document:', document.product_name);
    // Trigger text extraction/parsing
    handleDocumentSelect(document);
    toast.success(`Parsing SDS data for ${document.product_name}`);
  };

  const handleAskAI = (document: any) => {
    console.log('🤖 Ask AI about document:', document.product_name);
    handleDocumentSelect(document);
    toast.success(`AI assistant ready for questions about ${document.product_name}`);
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

      {/* Search Results as Cards */}
      {!isSearching && searchResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Found {searchResults.length} SDS Document{searchResults.length > 1 ? 's' : ''}
          </h3>
          <div className="grid gap-4">
            {searchResults.map((document, index) => (
              <SDSResultCard
                key={document.id || index}
                document={document}
                onView={handleView}
                onDownload={handleDownload}
                onParse={handleParse}
                onAskAI={handleAskAI}
              />
            ))}
          </div>
          
          {/* Show confidence scores if available */}
          {searchResults.length > 1 && (
            <div className="mt-2 p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-600">
                <strong>Tip:</strong> Results are sorted by relevance. The top result is likely the best match.
              </p>
            </div>
          )}
        </div>
      )}

      {/* No Results Message */}
      {!isSearching && searchResults.length === 0 && searchResults !== null && (
        <Card className="border-gray-200">
          <CardContent className="p-6 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              Enter a product name, material, or manufacturer above to search for Safety Data Sheets.
            </p>
            {existingDocuments && existingDocuments.length > 0 && (
              <p className="text-sm text-gray-500 mt-2">
                {existingDocuments.length} documents available in library
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Selection Dialog for Multiple Results - if needed for other flows */}
      <SDSSelectionDialog
        isOpen={showSelectionDialog}
        onClose={() => setShowSelectionDialog(false)}
        sdsDocuments={searchResults}
        onSaveSelected={handleDocumentSelect}
      />

      {/* Selected Document Display */}
      {selectedDocument && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <FileText className="h-5 w-5 text-green-600 mt-1" />
              <div className="flex-1">
                <h4 className="font-medium text-green-900">
                  Selected: {selectedDocument.product_name}
                </h4>
                {selectedDocument.manufacturer && (
                  <p className="text-sm text-green-700">
                    Manufacturer: {selectedDocument.manufacturer}
                  </p>
                )}
                {selectedDocument.extraction_status === 'processing' && (
                  <p className="text-xs text-blue-600 mt-1">
                    ⏳ Extracting additional hazard data from PDF...
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* PDF Viewer Popup */}
      <SDSViewerPopup
        isOpen={showViewerPopup}
        onClose={() => {
          setShowViewerPopup(false);
          setViewingDocument(null);
        }}
        sdsDocument={viewingDocument}
        onDownload={handleDownload}
      />
    </div>
  );
};

export default SDSSearch;
