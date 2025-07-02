import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Printer, FileText, Loader2, Eye, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useParams } from 'react-router-dom';

interface SDSLabelSearchPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const SDSLabelSearchPopup = ({ isOpen, onClose }: SDSLabelSearchPopupProps) => {
  const { facilitySlug } = useParams<{ facilitySlug: string }>();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast.error('Please enter a product name to search');
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    
    try {
      const { data, error } = await supabase
        .from('sds_documents')
        .select('*')
        .ilike('product_name', `%${searchTerm}%`)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      setSearchResults(data || []);
      
      if (data && data.length > 0) {
        toast.success(`Found ${data.length} SDS documents`);
      } else {
        toast.info('No SDS documents found in database');
      }

    } catch (error: any) {
      console.error('Search failed:', error);
      toast.error(`Search failed: ${error.message}`);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handlePrintLabel = (document: any) => {
    // Navigate to label printer page with the selected document
    const url = `/facility/${facilitySlug}/label-printer?documentId=${document.id}`;
    window.location.href = url;
    onClose();
  };

  const handleViewDocument = (document: any) => {
    const pdfUrl = document.bucket_url 
      ? supabase.storage.from('sds-documents').getPublicUrl(document.bucket_url.replace('sds-documents/', '')).data.publicUrl
      : document.source_url;
    
    window.open(pdfUrl, '_blank');
  };

  const resetSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setHasSearched(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Print SDS Label from Database
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search Input */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search for product name in database..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              Search
            </Button>
            {hasSearched && (
              <Button variant="outline" onClick={resetSearch}>
                Clear
              </Button>
            )}
          </div>

          {/* Search Results */}
          <div className="max-h-96 overflow-y-auto space-y-3">
            {isSearching && (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                <p className="text-gray-600">Searching database...</p>
              </div>
            )}

            {hasSearched && !isSearching && searchResults.length === 0 && (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No SDS Documents Found
                </h3>
                <p className="text-gray-600 mb-4">
                  No documents found in the database for "{searchTerm}"
                </p>
                <p className="text-sm text-gray-500">
                  Try searching with different keywords or upload the SDS document first.
                </p>
              </div>
            )}

            {searchResults.map((document) => (
              <Card key={document.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg truncate">
                          {document.product_name}
                        </h3>
                        <Badge variant="outline" className="text-xs">
                          {document.extraction_status?.replace(/_/g, ' ') || 'Processed'}
                        </Badge>
                        {document.ai_extraction_confidence > 80 && (
                          <Badge variant="secondary" className="text-xs">
                            {document.ai_extraction_confidence}% confidence
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Manufacturer:</span> {document.manufacturer || 'Not specified'}
                        </div>
                        <div>
                          <span className="font-medium">CAS Number:</span> {document.cas_number || 'Not available'}
                        </div>
                        <div>
                          <span className="font-medium">Added:</span> {new Date(document.created_at).toLocaleDateString()}
                        </div>
                        <div>
                          <span className="font-medium">File:</span> {document.file_name}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDocument(document)}
                        className="flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        View PDF
                      </Button>
                      
                      <Button
                        onClick={() => handlePrintLabel(document)}
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Printer className="h-4 w-4" />
                        Print Label
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SDSLabelSearchPopup;