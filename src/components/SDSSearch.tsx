
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, Zap, ArrowDown } from "lucide-react";
import SDSSearchInput from './SDSSearchInput';
import SDSResultCard from './SDSResultCard';
import ExtractedDataPopup from './popups/ExtractedDataPopup';
import LabelPrinterPopup from './popups/LabelPrinterPopup';
import { extractEnhancedSDSData } from './utils/enhancedSdsDataExtractor';

interface SDSSearchProps {
  facilityId: string;
}

const SDSSearch = ({ facilityId }: SDSSearchProps) => {
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [showExtractedData, setShowExtractedData] = useState(false);
  const [showLabelPrinter, setShowLabelPrinter] = useState(false);
  const [currentSearchQuery, setCurrentSearchQuery] = useState('');

  const handleSearchStart = () => {
    setIsSearching(true);
    setSearchResults([]);
    setSelectedDocument(null);
  };

  // Fix: Properly handle the search results from the corrected search function
  const handleSearchResults = (results: any[]) => {
    console.log('🔍 Search results received:', results.length);
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleSearchQuery = (query: string) => {
    setCurrentSearchQuery(query);
    console.log('💾 Stored search query:', query);
  };

  const handleDocumentSelect = (document: any) => {
    console.log('🔍 Selected document for extraction:', {
      id: document.id,
      product_name: document.product_name,
      file_name: document.file_name,
      search_query: currentSearchQuery
    });
    
    // Enhance document with search context
    const enhancedDocument = {
      ...document,
      original_search_query: currentSearchQuery
    };
    
    setSelectedDocument(enhancedDocument);
    setShowExtractedData(true);
  };

  const handlePrintLabel = () => {
    setShowExtractedData(false);
    setShowLabelPrinter(true);
  };

  const extractedData = selectedDocument ? extractEnhancedSDSData(selectedDocument) : {};

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-full shadow-lg">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent shadow-lg">
            SDS Document Search
          </h1>
        </div>
        
        <p className="text-xl md:text-2xl text-gray-700 font-semibold max-w-4xl mx-auto leading-relaxed">
          Find and process Safety Data Sheets instantly with AI-powered extraction
        </p>
      </div>

      {/* Search Input */}
      <SDSSearchInput 
        facilityId={facilityId}
        onSearchResults={handleSearchResults}
        onSearchStart={handleSearchStart}
        onSearchQuery={handleSearchQuery}
      />

      {/* Loading State */}
      {isSearching && (
        <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-red-50">
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-2xl font-bold text-orange-700">Searching SDS Database...</span>
            </div>
            <p className="text-gray-600 text-lg">Finding the best safety data sheets for your search</p>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {!isSearching && searchResults.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <ArrowDown className="w-6 h-6 text-orange-600 animate-bounce" />
            <h2 className="text-2xl font-bold text-gray-800">
              Found {searchResults.length} SDS Document{searchResults.length > 1 ? 's' : ''}
            </h2>
          </div>
          
          <div className="grid gap-6">
            {searchResults.map((result, index) => (
              <SDSResultCard
                key={result.id || index}
                document={result}
                onSelect={() => handleDocumentSelect(result)}
                onView={() => {}}
                onDownload={() => {}}
                isSelected={false}
                showSelection={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* No Results State */}
      {!isSearching && searchResults.length === 0 && currentSearchQuery && (
        <Card className="border-gray-200 bg-gray-50">
          <CardContent className="p-8 text-center">
            <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No SDS Documents Found</h3>
            <p className="text-gray-600">
              Try searching with different terms like manufacturer name, product number, or chemical name.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Extracted Data Popup */}
      <ExtractedDataPopup
        isOpen={showExtractedData}
        onClose={() => setShowExtractedData(false)}
        extractedData={{
          product_name: extractedData.productName,
          manufacturer: extractedData.manufacturer,
          cas_number: extractedData.casNumber,
          signal_word: extractedData.signalWord,
          hmis_codes: extractedData.hmisRatings,
          h_codes: extractedData.hazardCodes?.map(code => ({ code, description: '' })),
          pictograms: extractedData.pictograms,
          confidence_score: extractedData.extractionConfidence,
          extraction_status: extractedData.dataSource === 'osha_compliant' ? 'osha_compliant' : 
                           extractedData.requiresManualReview ? 'manual_review_required' : 'completed',
          prioritized_pictograms: extractedData.dataSource === 'osha_compliant'
        }}
        onPrintLabel={handlePrintLabel}
        searchQuery={currentSearchQuery}
      />

      {/* Label Printer Popup */}
      <LabelPrinterPopup
        isOpen={showLabelPrinter}
        onClose={() => setShowLabelPrinter(false)}
        selectedDocument={selectedDocument}
        initialProductName={extractedData.productName}
        initialManufacturer={extractedData.manufacturer}
      />
    </div>
  );
};

export default SDSSearch;
