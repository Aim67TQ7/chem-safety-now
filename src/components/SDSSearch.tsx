import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Search, FileText, AlertCircle, ExternalLink, CheckCircle, Bot } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import SDSResultCard from './SDSResultCard';
import { Badge } from '@/components/ui/badge';
import PDFViewerPopup from './popups/PDFViewerPopup';
import { useLocation } from 'react-router-dom';

interface SDSSearchProps {
  facilityId?: string;
  facilitySlug?: string; // Add facilitySlug prop
  showOnlyResults?: boolean;
  onSearchComplete?: (hasResults: boolean) => void;
}

const SDSSearch: React.FC<SDSSearchProps> = ({ 
  facilityId, 
  facilitySlug, // Use facilitySlug
  showOnlyResults = false,
  onSearchComplete 
}) => {
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Auto-search if URL contains search parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const searchParam = urlParams.get('search');
    if (searchParam && !hasSearched) {
      setSearchTerm(searchParam);
      handleSearch(searchParam);
    }
  }, [location.search, hasSearched]);

  const handleSearch = async (customSearchTerm?: string) => {
    const termToSearch = customSearchTerm || searchTerm;
    if (!termToSearch.trim()) {
      toast.error('Please enter a product name to search');
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    
    try {
      console.log('🔍 Starting SDS search for:', termToSearch);
      
      const { data, error } = await supabase.functions.invoke('sds-search', {
        body: { 
          product_name: termToSearch,
          max_results: 10
        }
      });

      if (error) {
        console.error('❌ Search error:', error);
        throw error;
      }

      console.log('✅ Search results:', data);
      setSearchResults(data.results || []);
      
      if (onSearchComplete) {
        onSearchComplete((data.results || []).length > 0);
      }

      if (data.results && data.results.length > 0) {
        toast.success(`Found ${data.results.length} SDS documents`);
      } else {
        toast.info('No SDS documents found for this product');
      }

    } catch (error: any) {
      console.error('❌ Search failed:', error);
      toast.error(`Search failed: ${error.message}`);
      setSearchResults([]);
      
      if (onSearchComplete) {
        onSearchComplete(false);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleViewDocument = (document: any) => {
    setSelectedDocument(document);
    setShowPDFViewer(true);
  };

  const handleDownloadDocument = (document: any) => {
    const url = document.bucket_url || document.source_url;
    if (url) {
      window.open(url, '_blank');
    } else {
      toast.error('Document URL not available');
    }
  };

  if (showOnlyResults && searchResults.length === 0 && !hasSearched) {
    return null;
  }

  return (
    <div className="space-y-6">
      {!showOnlyResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Search SDS Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter product or chemical name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button 
                onClick={() => handleSearch()}
                disabled={isSearching}
                className="px-6"
              >
                {isSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Search Results ({searchResults.length})
            </h3>
            <Badge variant="secondary">
              Found {searchResults.length} documents
            </Badge>
          </div>
          
          <div className="grid gap-4">
            {searchResults.map((document, index) => (
              <SDSResultCard
                key={document.id || `${document.source_url}-${index}`}
                document={document}
                onView={handleViewDocument}
                onDownload={handleDownloadDocument}
                isSelected={false}
                onSelect={() => {}}
                showSelection={false}
                facilitySlug={facilitySlug} // Pass facilitySlug instead of facilityId
              />
            ))}
          </div>
        </div>
      )}

      {/* No Results State */}
      {hasSearched && searchResults.length === 0 && !isSearching && (
        <Card className="text-center py-8">
          <CardContent>
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No SDS Documents Found
            </h3>
            <p className="text-gray-600 mb-4">
              We couldn't find any Safety Data Sheets for "{searchTerm}".
            </p>
            <p className="text-sm text-gray-500">
              Try searching with different keywords or the exact product name.
            </p>
          </CardContent>
        </Card>
      )}

      {/* PDF Viewer Popup */}
      <PDFViewerPopup
        isOpen={showPDFViewer}
        onClose={() => setShowPDFViewer(false)}
        pdfUrl={selectedDocument?.bucket_url || selectedDocument?.source_url}
        title={selectedDocument?.product_name || 'SDS Document'}
      />
    </div>
  );
};

export default SDSSearch;
