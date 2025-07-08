import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import FacilityNavbar from '@/components/FacilityNavbar';
import SDSViewerPopup from '@/components/popups/SDSViewerPopup';
import { useSDSDocuments } from '@/hooks/useSDSDocuments';
import { SDSDocumentCard } from '@/components/sds/SDSDocumentCard';
import { SDSSearchFilters } from '@/components/sds/SDSSearchFilters';

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

const SDSDocumentsPage = () => {
  const { facilitySlug } = useParams<{ facilitySlug: string }>();
  const [sdsViewerOpen, setSDSViewerOpen] = useState(false);
  const [selectedDocumentForViewer, setSelectedDocumentForViewer] = useState<SDSDocument | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
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
    pageSize: 20
  });

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

  const handleEvaluationComplete = () => {
    console.log('🔄 Refreshing document list after evaluation');
    refetch();
  };

  const handleDownloadPDF = async (doc: SDSDocument) => {
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
  };

  const handleViewDocument = (doc: SDSDocument) => {
    console.log('👁️ Viewing document:', doc.product_name);
    setSelectedDocumentForViewer(doc);
    setSDSViewerOpen(true);
  };

  const handlePrintLabel = (doc: SDSDocument) => {
    const labelPrinterUrl = `/facility/${facilitySlug}/label-printer?documentId=${doc.id}`;
    window.location.href = labelPrinterUrl;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <FacilityNavbar 
          facilityName={facilityData?.facility_name || undefined}
          facilityLogo={facilityData?.logo_url}
          facilityAddress={facilityData?.address}
          facilityId={facilityData?.id}
        />
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
        <FacilityNavbar 
          facilityName={facilityData?.facility_name || undefined}
          facilityLogo={facilityData?.logo_url}
          facilityAddress={facilityData?.address}
          facilityId={facilityData?.id}
        />
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
      <FacilityNavbar 
        facilityName={facilityData?.facility_name || undefined}
        facilityLogo={facilityData?.logo_url}
        facilityAddress={facilityData?.address}
        facilityId={facilityData?.id}
      />
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">SDS Document Library</h1>
          <p className="text-sm text-muted-foreground">
            Search and manage your Safety Data Sheet documents with real-time filtering.
          </p>
        </div>

        {/* Search and Filters */}
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

        {/* Documents Grid - Responsive */}
        <div className="space-y-3 md:space-y-4">
          {documents.length > 0 ? (
            <>
              {documents.map((doc) => (
                <SDSDocumentCard
                  key={doc.id}
                  document={doc}
                  onView={handleViewDocument}
                  onPrintLabel={handlePrintLabel}
                  onEvaluationComplete={handleEvaluationComplete}
                  searchTerm={searchTerm}
                />
              ))}
              
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
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No SDS documents found</h3>
                <p className="text-sm text-muted-foreground">
                  {searchTerm || filterStatus !== 'all' 
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Upload or search for SDS documents to get started.'
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* SDS Viewer Popup */}
      <SDSViewerPopup
        isOpen={sdsViewerOpen}
        onClose={() => {
          setSDSViewerOpen(false);
          setSelectedDocumentForViewer(null);
        }}
        sdsDocument={selectedDocumentForViewer}
      />
    </div>
  );
};

export default SDSDocumentsPage;
