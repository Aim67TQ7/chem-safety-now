import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, FileText, ChevronLeft, ChevronRight, ArrowLeft, Search, Plus, Eye, Printer, Bot } from 'lucide-react';
import { toast } from 'sonner';
import FacilityNavbar from '@/components/FacilityNavbar';
import SDSViewerPopup from '@/components/popups/SDSViewerPopup';
import AIAssistantPopup from '@/components/popups/AIAssistantPopup';
import { useSDSDocuments } from '@/hooks/useSDSDocuments';
import { SDSDocumentCard } from '@/components/sds/SDSDocumentCard';
import { SDSSearchFilters } from '@/components/sds/SDSSearchFilters';
import SDSSearchInput from '@/components/SDSSearchInput';
import SDSResultCard from '@/components/SDSResultCard';
import SDSEvaluationButton from '@/components/SDSEvaluationButton';
import { getSDSDocumentStatus } from '@/utils/sdsStatusUtils';
import { DemoProvider } from '@/contexts/DemoContext';
import DemoIndicator from '@/components/DemoIndicator';
import { useDemoPrintActions } from '@/hooks/useDemoPrintActions';

interface SDSDocument {
  id: string;
  product_name: string;
  manufacturer?: string | null;
  cas_number?: string | null;
  source_url: string;
  bucket_url?: string | null;
  file_name: string;
  extraction_quality_score?: number | null;
  is_readable?: boolean | null;
  created_at: string;
  h_codes?: any; // JSON field from Supabase
  signal_word?: string | null;
  pictograms?: any; // JSON field from Supabase
  ai_extraction_confidence?: number | null;
  extraction_status?: string | null;
  ai_extracted_data?: any;
}

const SDSDocumentsPageContent = () => {
  const { facilitySlug } = useParams<{ facilitySlug: string }>();
  const navigate = useNavigate();
  const [sdsViewerOpen, setSDSViewerOpen] = useState(false);
  const [selectedDocumentForViewer, setSelectedDocumentForViewer] = useState<SDSDocument | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchingNewDocs, setIsSearchingNewDocs] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [selectedDocumentForAI, setSelectedDocumentForAI] = useState<SDSDocument | null>(null);
  
  const { handlePrintAction, handleDownloadAction } = useDemoPrintActions();
  
  // Determine if this is admin context
  const isAdminContext = !facilitySlug;
  
  // Fetch facility data for navbar
  const { data: facilityData } = useQuery({
    queryKey: ['facility', facilitySlug],
    queryFn: async () => {
      if (!facilitySlug) return null;
      
      const { data: facility, error } = await supabase
        .from('facilities')
        .select('id, facility_name, logo_url, address')
        .eq('slug', facilitySlug)
        .single();

      if (error) {
        console.error('Error fetching facility:', error);
        return null;
      }

      return facility;
    },
    enabled: !!facilitySlug
  });
  
  const {
    documents,
    totalCount,
    totalPages,
    currentPage,
    setCurrentPage,
    isLoading,
    error,
    refetch,
    filterCounts,
    isSearching
  } = useSDSDocuments({
    searchTerm,
    filterType: 'all', // Simplified for now
    filterStatus,
    pageSize: 20,
    facilityId: facilityData?.id // Pass facility ID for filtering
  });

  const handleEvaluationComplete = () => {
    console.log('🔄 Refreshing document list after evaluation');
    refetch();
  };

  const handleDownloadPDF = async (doc: SDSDocument) => {
    const canDownload = handleDownloadAction('PDF Download');
    if (canDownload) {
      try {
        console.log('📥 Opening PDF for:', doc.product_name);
        
        // Open PDF in new tab
        const url = doc.bucket_url || doc.source_url;
        window.open(url, '_blank');
        toast.success(`Opening PDF for ${doc.product_name}`);
      } catch (error) {
        console.error('❌ Error opening document:', error);
        toast.error(`Failed to open PDF: ${error.message}`);
      }
    }
  };

  const handleViewDocument = (doc: SDSDocument) => {
    try {
      console.log('📥 Opening PDF for:', doc.product_name);
      
      // Open PDF directly in new tab
      const url = doc.bucket_url || doc.source_url;
      window.open(url, '_blank');
      toast.success(`Opening PDF for ${doc.product_name}`);
    } catch (error) {
      console.error('❌ Error opening document:', error);
      toast.error(`Failed to open PDF: ${error.message}`);
    }
  };

  const handlePrintLabel = (doc: SDSDocument) => {
    const canPrint = handlePrintAction('Label Print');
    if (canPrint) {
      const labelPrinterUrl = isAdminContext 
        ? `/admin/label-printer?documentId=${doc.id}`
        : `/facility/${facilitySlug}/label-printer?documentId=${doc.id}`;
      window.location.href = labelPrinterUrl;
    }
  };

  const handleSearchResults = (results: any[]) => {
    setSearchResults(results);
    setIsSearchingNewDocs(false);
  };

  const handleSearchStart = () => {
    setIsSearchingNewDocs(true);
  };

  const handleViewSearchResult = (document: any) => {
    window.open(document.source_url, '_blank');
  };

  const handleAskAI = (document: SDSDocument) => {
    setSelectedDocumentForAI(document);
    setAiChatOpen(true);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        {!isAdminContext && (
          <FacilityNavbar 
            facilityName={facilityData?.facility_name || undefined}
            facilityLogo={facilityData?.logo_url}
            facilityAddress={facilityData?.address}
            facilityId={facilityData?.id}
          />
        )}
        <div className="container mx-auto p-4">
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Loading SDS documents...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        {!isAdminContext && (
          <FacilityNavbar 
            facilityName={facilityData?.facility_name || undefined}
            facilityLogo={facilityData?.logo_url}
            facilityAddress={facilityData?.address}
            facilityId={facilityData?.id}
          />
        )}
        <div className="container mx-auto p-4">
          <Card className="border-destructive bg-destructive/10">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">Error loading documents: {error.message}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Admin style for admin context */}
      {isAdminContext ? (
        <div className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/admin")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Admin
              </Button>
              <div className="flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold">All SDS Documents</h1>
                <Badge variant="outline" className="ml-2">
                  {totalCount} documents
                </Badge>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <FacilityNavbar 
          facilityName={facilityData?.facility_name || undefined}
          facilityLogo={facilityData?.logo_url}
          facilityAddress={facilityData?.address}
          facilityId={facilityData?.id}
        />
      )}

      <div className="container mx-auto p-4 max-w-7xl">
        {/* Facility header for non-admin context */}
        {!isAdminContext && (
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">SDS Document Library</h1>
              <p className="text-sm text-muted-foreground">
                Search and manage your Safety Data Sheet documents with real-time filtering.
              </p>
            </div>
            <DemoIndicator action="Interactive Demo" />
          </div>
        )}

        <Tabs defaultValue="documents" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Existing Documents ({totalCount})
            </TabsTrigger>
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Find New SDS Documents
            </TabsTrigger>
          </TabsList>

          <TabsContent value="documents" className="mt-6">
            {/* Search and Filters for existing documents */}
            <div className="mb-6">
              <SDSSearchFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                filterStatus={filterStatus}
                onFilterStatusChange={setFilterStatus}
                filterCounts={filterCounts}
                isSearching={isSearching}
              />
            </div>

            {/* Results Summary */}
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {totalCount > 0 ? (
                  <>Showing {documents.length} of {totalCount} documents</>
                ) : (
                  'No documents found'
                )}
              </p>
              {totalPages > 1 && (
                <p className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </p>
              )}
            </div>

            {/* Documents Display */}
            {documents.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">
                    {searchTerm || filterStatus !== 'all' ? 'No documents found' : 'No SDS documents available'}
                  </h3>
                  <p className="text-muted-foreground">
                    {searchTerm || filterStatus !== 'all'
                      ? 'Try adjusting your search or filter criteria.'
                      : isAdminContext 
                        ? 'SDS documents will appear here once they are uploaded by facilities.'
                        : 'Upload or search for SDS documents to get started.'
                    }
                  </p>
                </CardContent>
              </Card>
            ) : isAdminContext ? (
              // Admin-style detailed cards
              <div className="space-y-4">
                {documents.map((document) => {
                  const statusInfo = getSDSDocumentStatus(document);
                  
                  return (
                    <Card key={document.id} className={`${statusInfo.backgroundColor} ${statusInfo.borderColor} border`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-lg truncate">
                                {document.product_name}
                              </h3>
                              <Badge 
                                variant="outline" 
                                className={`${statusInfo.textColor} border-current`}
                              >
                                {statusInfo.statusLabel}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-muted-foreground">
                              <div>
                                <span className="font-medium">File:</span> {document.file_name}
                              </div>
                              <div>
                                <span className="font-medium">Manufacturer:</span> {document.manufacturer || 'Not specified'}
                              </div>
                              <div>
                                <span className="font-medium">Size:</span> {formatFileSize(document.file_size)}
                              </div>
                              <div>
                                <span className="font-medium">Quality Score:</span> {document.extraction_quality_score || 0}/100
                              </div>
                              <div>
                                <span className="font-medium">Confidence:</span> {document.ai_extraction_confidence || 0}%
                              </div>
                              <div>
                                <span className="font-medium">Added:</span> {new Date(document.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDocument(document)}
                              className="h-8 px-3 text-xs"
                            >
                              <Eye className="h-3 w-3 mr-1.5" />
                              View PDF
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAskAI(document)}
                              className="h-8 px-3 text-xs"
                            >
                              <Bot className="h-3 w-3 mr-1.5" />
                              Use AI
                            </Button>
                            
                            {(document.ai_extraction_confidence || 0) > 0 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePrintLabel(document)}
                                className="h-8 px-3 text-xs"
                              >
                                <Printer className="h-3 w-3 mr-1.5" />
                                Print Label
                              </Button>
                            )}
                            
                            <SDSEvaluationButton
                              document={document}
                              onEvaluationComplete={handleEvaluationComplete}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              // Facility-style mobile-optimized cards
              <div className="space-y-3 md:space-y-4">
                {documents.map((doc) => (
                  <SDSDocumentCard
                    key={doc.id}
                    document={doc}
                    onView={handleViewDocument}
                    onPrintLabel={handlePrintLabel}
                    onEvaluationComplete={handleEvaluationComplete}
                    onAskAI={handleAskAI}
                    searchTerm={searchTerm}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground px-3">
                  {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="search" className="mt-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Search for New SDS Documents
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Find and add new SDS documents to the system with Quick Print functionality.
                  </p>
                </CardHeader>
                <CardContent>
                  <SDSSearchInput
                    facilityId={isAdminContext ? "admin" : (facilityData?.id || "")}
                    onSearchResults={handleSearchResults}
                    onSearchStart={handleSearchStart}
                  />
                </CardContent>
              </Card>

              {searchResults.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Search Results ({searchResults.length})</h3>
                  <div className="grid gap-4">
                    {searchResults.map((result, index) => (
                      <SDSResultCard
                        key={result.id || result.source_url || index}
                        document={result}
                        onView={handleViewSearchResult}
                        onDownload={handleViewSearchResult}
                        onPrintLabel={handlePrintLabel}
                        onAskAI={handleAskAI}
                        onEvaluationComplete={refetch}
                        isSelected={false}
                        onSelect={() => {}}
                        showSelection={false}
                        facilitySlug={facilitySlug}
                        isAdminContext={isAdminContext}
                      />
                    ))}
                  </div>
                </div>
              )}

              {isSearchingNewDocs && (
                <Card>
                  <CardContent className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Searching for SDS documents...</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* SDS Viewer Popup */}
      <SDSViewerPopup
        isOpen={sdsViewerOpen}
        onClose={() => {
          setSDSViewerOpen(false);
          setSelectedDocumentForViewer(null);
        }}
        sdsDocument={selectedDocumentForViewer}
        onAskAI={handleAskAI}
      />

      {/* AI Assistant Popup */}
      <AIAssistantPopup
        isOpen={aiChatOpen}
        onClose={() => {
          setAiChatOpen(false);
          setSelectedDocumentForAI(null);
        }}
        facilityData={facilityData}
        selectedDocument={selectedDocumentForAI}
      />
    </div>
  );
};

const SDSDocumentsPage = () => {
  return (
    <DemoProvider>
      <SDSDocumentsPageContent />
    </DemoProvider>
  );
};

export default SDSDocumentsPage;
