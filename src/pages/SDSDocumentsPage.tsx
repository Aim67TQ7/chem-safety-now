import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, CheckCircle, FileText, ExternalLink, Printer, Shield, AlertTriangle, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import FacilityNavbar from '@/components/FacilityNavbar';

import SDSViewerPopup from '@/components/popups/SDSViewerPopup';
import SDSEvaluationButton from '@/components/SDSEvaluationButton';
import { getSDSDocumentStatus, getComplianceStatusBadge } from '@/utils/sdsStatusUtils';

interface SDSDocument {
  id: string;
  product_name: string;
  manufacturer?: string;
  cas_number?: string;
  source_url: string;
  bucket_url?: string;
  file_name: string;
  extraction_quality_score?: number;
  is_readable?: boolean;
  created_at: string;
  h_codes?: Array<{ code: string; description: string }>;
  signal_word?: string;
  pictograms?: Array<{ ghs_code: string; name: string }>;
  ai_extraction_confidence?: number;
  extraction_status?: string;
  ai_extracted_data?: any;
}

const SDSDocumentsPage = () => {
  const { facilitySlug } = useParams<{ facilitySlug: string }>();
  const [sdsViewerOpen, setSDSViewerOpen] = useState(false);
  const [selectedDocumentForViewer, setSelectedDocumentForViewer] = useState<SDSDocument | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const pageSize = 20;
  
  const { data: documentsData, isLoading, error, refetch } = useQuery({
    queryKey: ['sds-documents', currentPage, searchTerm, filterType, filterStatus],
    queryFn: async () => {
      console.log('🔍 Fetching SDS documents...');
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString()
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (filterType !== 'all') params.append('document_type', filterType);
      if (filterStatus !== 'all') params.append('extraction_status', filterStatus);
      
      const response = await supabase.functions.invoke('sds-documents', {
        body: Object.fromEntries(params)
      });
      
      if (response.error) {
        console.error('❌ Error fetching documents:', response.error);
        throw new Error(response.error.message);
      }
      
      console.log('✅ Fetched documents:', response.data);
      return response.data;
    }
  });

  // Fetch facility data for navbar
  const { data: facilityData } = useQuery({
    queryKey: ['facility', facilitySlug],
    queryFn: async () => {
      if (!facilitySlug) return null;
      
      const { data: facility, error } = await supabase
        .from('facilities')
        .select('facility_name, logo_url, address')
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

  const documents = documentsData?.documents || [];
  const totalCount = documentsData?.count || 0;
  const totalPages = documentsData?.totalPages || 1;
  const hasMore = documentsData?.hasMore || false;

  const getQualityLabel = (score?: number) => {
    if (!score) return 'Unknown';
    if (score >= 98) return 'OSHA Compliant';
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  const handleEvaluationComplete = () => {
    console.log('🔄 Refreshing document list after evaluation');
    refetch();
  };

  const handleSearch = () => {
    setCurrentPage(1);
    refetch();
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleDownloadPDF = async (doc: SDSDocument) => {
    try {
      console.log('📥 Downloading PDF for:', doc.product_name);
      
      // If we have a bucket_url, open it directly
      if (doc.bucket_url) {
        window.open(doc.bucket_url, '_blank');
        toast.success(`Opening PDF for ${doc.product_name}`);
        return;
      }
      
      // If we only have source_url, try to download via edge function
      if (doc.source_url) {
        const response = await supabase.functions.invoke('download-sds-pdf', {
          body: { 
            document_id: doc.id,
            source_url: doc.source_url, 
            file_name: doc.file_name 
          }
        });
        
        if (response.error) {
          throw new Error(response.error.message);
        }
        
        if (response.data?.download_url) {
          window.open(response.data.download_url, '_blank');
          toast.success('PDF download started');
        } else {
          // Fallback to source URL
          window.open(doc.source_url, '_blank');
          toast.success(`Opening source document for ${doc.product_name}`);
        }
      } else {
        throw new Error('No PDF URL available');
      }
    } catch (error) {
      console.error('❌ Download error:', error);
      toast.error(`Failed to download PDF: ${error.message}`);
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-red-50">
        <FacilityNavbar 
          facilityName={facilityData?.facility_name || undefined}
          facilityLogo={facilityData?.logo_url}
          facilityAddress={facilityData?.address}
        />
        <div className="container mx-auto p-4">
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Loading SDS documents...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-red-50">
        <FacilityNavbar 
          facilityName={facilityData?.facility_name || undefined}
          facilityLogo={facilityData?.logo_url}
          facilityAddress={facilityData?.address}
        />
        <div className="container mx-auto p-4">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 text-red-700">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">Error loading documents: {error.message}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const oshaCompliantDocs = documents?.filter((doc: SDSDocument) => doc.extraction_status === 'osha_compliant') || [];
  const manualReviewDocs = documents?.filter((doc: SDSDocument) => doc.extraction_status === 'manual_review_required') || [];
  const highQualityDocs = documents?.filter((doc: SDSDocument) => (doc.ai_extraction_confidence || 0) >= 80 && doc.extraction_status !== 'osha_compliant') || [];
  const readableDocs = documents?.filter((doc: SDSDocument) => doc.is_readable) || [];

  const DocumentCard = ({ doc }: { doc: SDSDocument }) => {
    const statusInfo = getSDSDocumentStatus(doc);
    const badgeInfo = getComplianceStatusBadge(doc);
    
    // Get icon component dynamically
    const getIconComponent = (iconName: string) => {
      const icons = {
        Shield,
        AlertTriangle,
        CheckCircle,
        AlertCircle,
        FileText
      };
      return icons[iconName as keyof typeof icons] || FileText;
    };
    
    const BadgeIcon = getIconComponent(badgeInfo.icon);
    
    return (
      <Card className={`mb-3 ${statusInfo.backgroundColor} ${statusInfo.borderColor} border-2`}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className={`text-base font-semibold truncate ${statusInfo.textColor}`}>
                {doc.product_name}
              </CardTitle>
              {doc.manufacturer && (
                <p className="text-xs text-gray-600 mt-1 truncate">
                  {doc.manufacturer}
                </p>
              )}
              {doc.cas_number && (
                <p className="text-xs text-gray-500">CAS: {doc.cas_number}</p>
              )}
            </div>
            <div className="flex flex-col items-end space-y-1 ml-2">
              <Badge 
                variant={badgeInfo.variant}
                className={`text-xs px-2 py-0 ${badgeInfo.className}`}
              >
                <BadgeIcon className="h-2 w-2 mr-1" />
                {badgeInfo.label}
              </Badge>
              {statusInfo.isEvaluated && (
                <div className="text-right">
                  <div className="flex items-center space-x-1">
                    <Progress 
                      value={statusInfo.confidence} 
                      className="w-12 h-1"
                    />
                    <span className="text-xs font-medium">
                      {Math.round(statusInfo.confidence)}%
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {getQualityLabel(statusInfo.confidence)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            {doc.signal_word && (
              <Badge variant="outline" className="text-xs mr-1">
                Signal: {doc.signal_word}
              </Badge>
            )}
            
            {doc.h_codes && doc.h_codes.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {doc.h_codes.slice(0, 4).map((hCode, index) => (
                  <Badge key={index} variant="secondary" className="text-xs px-1 py-0">
                    {hCode.code}
                  </Badge>
                ))}
                {doc.h_codes.length > 4 && (
                  <Badge variant="secondary" className="text-xs px-1 py-0">
                    +{doc.h_codes.length - 4}
                  </Badge>
                )}
              </div>
            )}

            {doc.extraction_status === 'manual_review_required' && (
              <div className="text-xs text-orange-700 bg-orange-100 p-2 rounded border border-orange-200">
                <AlertTriangle className="h-3 w-3 inline mr-1" />
                This document requires manual review by an EHS specialist before use for labeling.
              </div>
            )}

            <div className="flex items-center justify-between pt-1 border-t border-gray-100">
              <div className="text-xs text-gray-400">
                {new Date(doc.created_at).toLocaleDateString()}
              </div>
              <div className="flex flex-col space-y-1">
                <div className="flex space-x-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDocument(doc)}
                    className="text-xs h-6 px-2"
                  >
                    <ExternalLink className="h-2 w-2 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handlePrintLabel(doc)}
                    className={`text-xs h-6 px-2 text-white ${
                      doc.extraction_status === 'osha_compliant' 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : doc.extraction_status === 'manual_review_required'
                        ? 'bg-orange-600 hover:bg-orange-700'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    <Printer className="h-2 w-2 mr-1" />
                    Print Label
                  </Button>
                </div>
                <SDSEvaluationButton 
                  document={doc} 
                  onEvaluationComplete={handleEvaluationComplete}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-red-50">
      <FacilityNavbar 
        facilityName={facilityData?.facility_name || undefined}
        facilityLogo={facilityData?.logo_url}
        facilityAddress={facilityData?.address}
      />
      <div className="container mx-auto p-4">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">SDS Document Library</h1>
          <p className="text-sm text-gray-600">
            Manage and browse your Safety Data Sheet documents with OSHA-compliant extraction and quality analysis.
          </p>
        </div>

        {/* Search and Filter Controls */}
        <div className="mb-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Input
                  placeholder="Search by product name, manufacturer, or CAS number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pr-10"
                />
                <Button
                  onClick={handleSearch}
                  size="sm"
                  className="absolute right-1 top-1 h-6 w-6 p-0"
                >
                  <Search className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="safety_data_sheet">Safety Data Sheets</SelectItem>
                  <SelectItem value="regulatory_sheet">Regulatory Sheets</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="osha_compliant">OSHA Compliant</SelectItem>
                  <SelectItem value="manual_review_required">Manual Review</SelectItem>
                  <SelectItem value="ai_enhanced">AI Enhanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Documents Display */}
        <div className="space-y-2">
          {documents && documents.length > 0 ? (
            <>
              {documents.map((doc: SDSDocument) => (
                <DocumentCard key={doc.id} doc={doc} />
              ))}
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-600">
                    Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} documents
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <span className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <FileText className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600">No SDS documents found.</p>
                {(searchTerm || filterType !== 'all' || filterStatus !== 'all') && (
                  <p className="text-xs text-gray-500 mt-1">
                    Try adjusting your search or filter criteria.
                  </p>
                )}
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
