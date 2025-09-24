
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Search, FileText, AlertCircle, ExternalLink, CheckCircle, Bot, Library } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import SDSResultCard from './SDSResultCard';
import SDSSearchInput from './SDSSearchInput';
import SDSUploadForm from './SDSUploadForm';
import SDSDocumentsTable from './sds/SDSDocumentsTable';
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
  const [lastSearchTerm, setLastSearchTerm] = useState('');

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
          max_results: 5
        }
      });

      if (error) {
        console.error('❌ Search error:', error);
        throw error;
      }

      console.log('✅ Search results:', data);
      setSearchResults(data.results || []);
      setLastSearchTerm(termToSearch);
      
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
      // Don't clear existing results on error, just show the error
      
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

      let documentId = document.id;
      if (saveError) {
        console.log('Document may already exist, continuing with view...');
      } else {
        console.log('✅ Document saved to database:', savedDoc.id);
        documentId = savedDoc.id;
      }

      // Open the PDF in a new tab instead of popup (avoids CORS issues)
      const url = document.bucket_url || document.source_url;
      window.open(url, '_blank');
      
      // Log SDS document access for OSHA compliance and facility association
      if (facilityId) {
        AuditService.logSDSAccess(facilityId, document.product_name, documentId);
        
        // This interaction associates the document with the facility
        interactionLogger.logSDSInteraction({
          sdsDocumentId: documentId,
          actionType: 'view_sds',
          facilityId: facilityId,
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

  const handleResetSearch = () => {
    setSearchResults([]);
    setHasSearched(false);
    setSearchTerm('');
    setLastSearchTerm('');
    if (onSearchComplete) {
      onSearchComplete(false);
    }
  };

  const handleNewSearch = () => {
    setSearchTerm('');
    // Keep existing results but allow new search
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
            <div>
              <h3 className="text-lg font-semibold">
                Search Results ({searchResults.length})
              </h3>
              {lastSearchTerm && (
                <p className="text-sm text-gray-600">
                  Results for: "{lastSearchTerm}"
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                Found {searchResults.length} documents
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleNewSearch}
                className="text-blue-600 hover:text-blue-700"
              >
                New Search
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetSearch}
                className="text-red-600 hover:text-red-700"
              >
                Reset Search
              </Button>
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
                onPrintLabel={async (doc) => {
                  try {
                    toast.loading('Preparing document for label printing...');
                    
                    // Save the document to database first (same as handleViewDocument)
                    const documentData = {
                      product_name: doc.product_name,
                      manufacturer: doc.manufacturer || 'Unknown',
                      source_url: doc.source_url,
                      bucket_url: doc.bucket_url || doc.source_url,
                      file_name: `${doc.product_name}_SDS.pdf`,
                      file_type: 'application/pdf',
                      document_type: 'sds',
                      extraction_status: 'pending',
                      is_readable: true,
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString()
                    };

                    let documentId = doc.id;
                    let needsEvaluation = true;
                    
                    // Save to database if not already saved
                    if (!documentId) {
                      const { data: savedDoc, error: saveError } = await supabase
                        .from('sds_documents')
                        .insert([documentData])
                        .select()
                        .single();

                      if (saveError && !saveError.message.includes('duplicate')) {
                        throw saveError;
                      }
                      
                      if (savedDoc) {
                        documentId = savedDoc.id;
                      }
                    } else {
                      // Check if document already has AI extraction data
                      needsEvaluation = !doc.ai_extracted_data || !doc.pictograms || doc.pictograms.length === 0;
                    }

                    // Run AI evaluation if needed to extract pictograms and detailed data
                    if (needsEvaluation && documentId) {
                      console.log('🤖 Running AI evaluation for complete label data...');
                      
                      let pdfUrl = doc.bucket_url || doc.source_url;
                      if (doc.bucket_url && doc.bucket_url.startsWith('sds-documents/')) {
                        pdfUrl = `https://fwzgsiysdwsmmkgqmbsd.supabase.co/storage/v1/object/public/${doc.bucket_url}`;
                      }

                      // Call OpenAI analysis for complete data extraction
                      const { data: analysisResult, error: analysisError } = await supabase.functions.invoke('openai-sds-analysis', {
                        body: { 
                          document_id: documentId,
                          pdf_url: pdfUrl
                        }
                      });

                      if (!analysisError && analysisResult?.success) {
                        const extractedData = analysisResult.data;
                        await supabase
                          .from('sds_documents')
                          .update({
                            ai_extracted_data: extractedData,
                            ai_extraction_confidence: extractedData.confidence_score || 0,
                            ai_extraction_date: new Date().toISOString(),
                            extraction_status: 'completed',
                            hmis_codes: extractedData.hmis_codes || {},
                            signal_word: extractedData.signal_word,
                            pictograms: extractedData.ghs_pictograms || [],
                            h_codes: extractedData.h_codes || []
                          })
                          .eq('id', documentId);
                        
                        toast.success('Document analyzed for complete label data');
                      } else {
                        console.warn('AI evaluation failed, proceeding with basic data');
                      }
                    }

                    // Open label printer in new tab
                    if (documentId) {
                      window.open(`/facility/${facilitySlug}/label-printer?documentId=${documentId}`, '_blank');
                    } else {
                      // Fallback: open with basic parameters
                      window.open(`/facility/${facilitySlug}/label-printer?productName=${encodeURIComponent(doc.product_name)}&manufacturer=${encodeURIComponent(doc.manufacturer || '')}`, '_blank');
                    }
                    
                    // Log the action
                    if (facilityId) {
                      interactionLogger.logSDSInteraction({
                        sdsDocumentId: documentId,
                        actionType: 'generate_label',
                        metadata: {
                          productName: doc.product_name,
                          manufacturer: doc.manufacturer,
                          accessMethod: 'search_results',
                          aiEvaluated: needsEvaluation
                        }
                      });
                    }
                    
                    toast.dismiss();
                    toast.success('Label printer opened in new tab');
                    
                  } catch (error: any) {
                    console.error('❌ Error preparing document for printing:', error);
                    toast.dismiss();
                    toast.error('Failed to prepare document for printing');
                  }
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

      {/* Facility SDS Documents Table */}
      {facilityId && (
        <SDSDocumentsTable
          facilityId={facilityId}
          facilitySlug={facilitySlug}
          onViewDocument={handleViewDocument}
          onPrintLabel={async (document) => {
            try {
              toast.loading('Preparing document for label printing...');
              
              let needsEvaluation = !document.ai_extracted_data || !document.pictograms || document.pictograms.length === 0;
              
              // Run AI evaluation if needed to extract pictograms and detailed data
              if (needsEvaluation && document.id) {
                console.log('🤖 Running AI evaluation for complete label data...');
                
                let pdfUrl = document.bucket_url || document.source_url;
                if (document.bucket_url && document.bucket_url.startsWith('sds-documents/')) {
                  pdfUrl = `https://fwzgsiysdwsmmkgqmbsd.supabase.co/storage/v1/object/public/${document.bucket_url}`;
                }

                // Call OpenAI analysis for complete data extraction
                const { data: analysisResult, error: analysisError } = await supabase.functions.invoke('openai-sds-analysis', {
                  body: { 
                    document_id: document.id,
                    pdf_url: pdfUrl
                  }
                });

                if (!analysisError && analysisResult?.success) {
                  const extractedData = analysisResult.data;
                  await supabase
                    .from('sds_documents')
                    .update({
                      ai_extracted_data: extractedData,
                      ai_extraction_confidence: extractedData.confidence_score || 0,
                      ai_extraction_date: new Date().toISOString(),
                      extraction_status: 'completed',
                      hmis_codes: extractedData.hmis_codes || {},
                      signal_word: extractedData.signal_word,
                      pictograms: extractedData.ghs_pictograms || [],
                      h_codes: extractedData.h_codes || []
                    })
                    .eq('id', document.id);
                  
                  toast.success('Document analyzed for complete label data');
                } else {
                  console.warn('AI evaluation failed, proceeding with basic data');
                }
              }

              // Open label printer in new tab
              window.open(`/facility/${facilitySlug}/label-printer?documentId=${document.id}`, '_blank');
              
              // Log the action
              if (facilityId) {
                interactionLogger.logSDSInteraction({
                  sdsDocumentId: document.id,
                  actionType: 'generate_label',
                  metadata: {
                    productName: document.product_name,
                    manufacturer: document.manufacturer,
                    accessMethod: 'facility_table',
                    aiEvaluated: needsEvaluation
                  }
                });
              }
              
              toast.dismiss();
              toast.success('Label printer opened in new tab');
              
            } catch (error: any) {
              console.error('❌ Error preparing document for printing:', error);
              toast.dismiss();
              toast.error('Failed to prepare document for printing');
            }
          }}
        />
      )}

      {/* No Results State with Upload Option */}
      {hasSearched && searchResults.length === 0 && !isSearching && (
        <div className="space-y-6">
          <Card className="text-center py-8">
            <CardContent>
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No SDS Documents Found
              </h3>
              <p className="text-gray-600 mb-4">
                We couldn't find any Safety Data Sheets for your search.
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Try searching with different keywords or the exact product name.
              </p>
              <p className="text-sm font-medium text-gray-700">
                Can't find your SDS? Upload it below!
              </p>
            </CardContent>
          </Card>
          
          <SDSUploadForm 
            facilityId={facilityId}
            onUploadSuccess={(document) => {
              toast.success('SDS uploaded successfully! You can now create labels for this product.');
              // Add the uploaded document to search results
              setSearchResults([document]);
              setHasSearched(true);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default SDSSearch;
