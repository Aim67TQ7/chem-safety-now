
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Search, FileText, AlertCircle, ExternalLink, CheckCircle, Bot, Library } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import SDSResultCard from './SDSResultCard';
import SDSSearchInput from './SDSSearchInput';
import { Badge } from '@/components/ui/badge';
import { useLocation } from 'react-router-dom';
import { AuditService } from '@/services/auditService';
import { interactionLogger } from '@/services/interactionLogger';
import { useNavigate } from 'react-router-dom';

interface SDSSearchProps {
  facilityId?: string;
  facilitySlug?: string;
  showOnlyResults?: boolean;
  onSearchComplete?: (hasResults: boolean) => void;
}

const SDSSearch: React.FC<SDSSearchProps> = ({ 
  facilityId, 
  facilitySlug,
  showOnlyResults = false,
  onSearchComplete 
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
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

  const handleSearchStart = () => {
    setIsSearching(true);
    setHasSearched(true);
  };

  const handleSearchResults = (results: any[]) => {
    console.log('📋 Received search results:', results);
    setSearchResults(results);
    
    if (onSearchComplete) {
      onSearchComplete(results.length > 0);
    }
  };

  const handleViewDocument = async (document: any) => {
    try {
      // First, save the document to database for OSHA compliance
      const documentData = {
        product_name: document.product_name,
        manufacturer: document.manufacturer || 'Unknown',
        source_url: document.source_url,
        bucket_url: document.bucket_url || document.source_url,
        file_name: `${document.product_name}_SDS.pdf`,
        file_type: 'application/pdf',
        document_type: 'sds',
        extraction_status: 'pending',
        is_readable: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Save to database first
      const { data: savedDoc, error: saveError } = await supabase
        .from('sds_documents')
        .insert([documentData])
        .select()
        .single();

      if (saveError) {
        console.log('Document may already exist, continuing with view...');
      } else {
        console.log('✅ Document saved to database:', savedDoc.id);
      }

      // Open the PDF in a new tab instead of popup (avoids CORS issues)
      const url = document.bucket_url || document.source_url;
      window.open(url, '_blank');
      
      // Log SDS document access for OSHA compliance
      if (facilityId) {
        AuditService.logSDSAccess(facilityId, document.product_name, document.id);
        
        interactionLogger.logSDSInteraction({
          sdsDocumentId: document.id,
          actionType: 'view_sds',
          metadata: {
            productName: document.product_name,
            manufacturer: document.manufacturer,
            accessMethod: 'search_results'
          }
        });
      }

      toast.success(`Opening ${document.product_name} SDS in new tab`);
      
    } catch (error: any) {
      console.error('❌ Error viewing document:', error);
      // Fallback: just open the URL
      const url = document.bucket_url || document.source_url;
      window.open(url, '_blank');
    }
  };

  const handleDownloadDocument = (document: any) => {
    const url = document.bucket_url || document.source_url;
    if (url) {
      window.open(url, '_blank');
      
      // Log SDS document download
      if (facilityId) {
        AuditService.logSDSAccess(facilityId, document.product_name, document.id);
        
        interactionLogger.logSDSInteraction({
          sdsDocumentId: document.id,
          actionType: 'download',
          metadata: {
            productName: document.product_name,
            downloadUrl: url
          }
        });
      }
    } else {
      toast.error('Document URL not available');
    }
  };

  const handleGoToSDSLibrary = () => {
    if (facilitySlug) {
      navigate(`/facility/${facilitySlug}/sds-documents`);
    } else {
      navigate('/admin/sds-documents');
    }
  };

  if (showOnlyResults && searchResults.length === 0 && !hasSearched) {
    return null;
  }

  return (
    <div className="space-y-6">
      {!showOnlyResults && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Search SDS Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SDSSearchInput
                facilityId={facilityId || ''}
                onSearchResults={handleSearchResults}
                onSearchStart={handleSearchStart}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Search Results ({searchResults.length})
            </h3>
            <div className="flex items-center gap-3">
              <Badge variant="secondary">
                Found {searchResults.length} documents
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGoToSDSLibrary}
                className="flex items-center space-x-1"
              >
                <Library className="h-4 w-4" />
                <span>Go to SDS Library</span>
              </Button>
            </div>
          </div>
          
          <div className="grid gap-4">
            {searchResults.map((document, index) => (
              <SDSResultCard
                key={document.id || `${document.source_url}-${index}`}
                document={document}
                onView={handleViewDocument}
                onDownload={handleViewDocument}
                onPrintLabel={(doc) => {
                  // Navigate to print label page with document data
                  window.open(`/facility/${facilitySlug}/print-label?productName=${encodeURIComponent(doc.product_name)}&manufacturer=${encodeURIComponent(doc.manufacturer || '')}`, '_blank');
                }}
                onAskAI={(doc) => {
                  // Handle Ask AI functionality - this would typically open an AI assistant
                  toast.info("AI Assistant feature coming soon!");
                }}
                onEvaluationComplete={() => {
                  // Refresh search or handle evaluation completion
                  toast.success("Document evaluation completed");
                }}
                isSelected={false}
                onSelect={() => {}}
                showSelection={false}
                facilitySlug={facilitySlug}
                isAdminContext={false}
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
              We couldn't find any Safety Data Sheets for your search.
            </p>
            <p className="text-sm text-gray-500">
              Try searching with different keywords or the exact product name.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SDSSearch;
