
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import SDSSearchInput from './SDSSearchInput';
import SDSSelectionDialog from './SDSSelectionDialog';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, AlertCircle } from 'lucide-react';

interface SDSSearchProps {
  facilityId: string;
  onDocumentSelect?: (document: any) => void;
}

const SDSSearch: React.FC<SDSSearchProps> = ({ facilityId, onDocumentSelect }) => {
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSelectionDialog, setShowSelectionDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

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

    if (results.length === 1) {
      // Auto-select if only one result
      handleDocumentSelect(results[0]);
    } else if (results.length > 1) {
      // Show selection dialog for multiple results
      setShowSelectionDialog(true);
    }
  };

  const handleSearchStart = () => {
    setIsSearching(true);
    setSearchResults([]);
    setShowSelectionDialog(false);
  };

  const handleDocumentSelect = (document: any) => {
    console.log('📋 Document selected:', document.product_name);
    setSelectedDocument(document);
    setShowSelectionDialog(false);
    
    if (onDocumentSelect) {
      onDocumentSelect(document);
    }
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

      {/* Selection Dialog for Multiple Results - Fixed prop name */}
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
    </div>
  );
};

export default SDSSearch;
