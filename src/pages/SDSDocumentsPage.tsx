
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle, FileText, Download, ExternalLink, Printer, Shield, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import FacilityNavbar from '@/components/FacilityNavbar';
import LabelPrinterPopup from '@/components/popups/LabelPrinterPopup';

interface SDSDocument {
  id: string;
  product_name: string;
  manufacturer?: string;
  cas_number?: string;
  source_url: string;
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
  const [labelPrinterOpen, setLabelPrinterOpen] = useState(false);
  const [selectedDocumentForLabel, setSelectedDocumentForLabel] = useState<SDSDocument | null>(null);
  
  const { data: documents, isLoading, error } = useQuery({
    queryKey: ['sds-documents'],
    queryFn: async () => {
      console.log('🔍 Fetching SDS documents...');
      const response = await supabase.functions.invoke('sds-documents');
      
      if (response.error) {
        console.error('❌ Error fetching documents:', response.error);
        throw new Error(response.error.message);
      }
      
      console.log('✅ Fetched documents:', response.data?.documents?.length || 0);
      return response.data?.documents || [];
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

  const getQualityLabel = (score?: number) => {
    if (!score) return 'Unknown';
    if (score >= 98) return 'OSHA Compliant';
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  const getComplianceStatus = (doc: SDSDocument) => {
    if (doc.extraction_status === 'osha_compliant' && doc.ai_extraction_confidence >= 98) {
      return { status: 'osha_compliant', label: 'OSHA Compliant', icon: Shield, color: 'bg-green-600' };
    }
    if (doc.extraction_status === 'manual_review_required') {
      return { status: 'manual_review', label: 'Manual Review Required', icon: AlertTriangle, color: 'bg-orange-600' };
    }
    if (doc.ai_extraction_confidence >= 80) {
      return { status: 'high_quality', label: 'High Quality', icon: CheckCircle, color: 'bg-blue-600' };
    }
    return { status: 'basic', label: 'Basic Extraction', icon: AlertCircle, color: 'bg-gray-600' };
  };

  const handleDownloadPDF = async (sourceUrl: string, fileName: string) => {
    try {
      console.log('📥 Downloading PDF:', sourceUrl);
      const response = await supabase.functions.invoke('download-sds-pdf', {
        body: { source_url: sourceUrl, file_name: fileName }
      });
      
      if (response.error) {
        throw new Error(response.error.message);
      }
      
      if (response.data?.download_url) {
        window.open(response.data.download_url, '_blank');
        toast.success('PDF download started');
      }
    } catch (error) {
      console.error('❌ Download error:', error);
      toast.error('Failed to download PDF');
    }
  };

  const handlePrintLabel = (doc: SDSDocument) => {
    setSelectedDocumentForLabel(doc);
    setLabelPrinterOpen(true);
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
    const compliance = getComplianceStatus(doc);
    const ComplianceIcon = compliance.icon;
    
    return (
      <Card className="mb-3">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base font-semibold text-gray-900 truncate">
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
                variant="outline"
                className={`text-xs px-2 py-0 text-white ${compliance.color}`}
              >
                <ComplianceIcon className="h-2 w-2 mr-1" />
                {compliance.label}
              </Badge>
              <div className="text-right">
                <div className="flex items-center space-x-1">
                  <Progress 
                    value={doc.ai_extraction_confidence || doc.extraction_quality_score || 0} 
                    className="w-12 h-1"
                  />
                  <span className="text-xs font-medium">
                    {Math.round(doc.ai_extraction_confidence || doc.extraction_quality_score || 0)}%
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {getQualityLabel(doc.ai_extraction_confidence || doc.extraction_quality_score)}
                </div>
              </div>
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

            {compliance.status === 'manual_review' && (
              <div className="text-xs text-orange-700 bg-orange-50 p-2 rounded border border-orange-200">
                <AlertTriangle className="h-3 w-3 inline mr-1" />
                This document requires manual review by an EHS specialist before use for labeling.
              </div>
            )}

            <div className="flex items-center justify-between pt-1 border-t border-gray-100">
              <div className="text-xs text-gray-400">
                {new Date(doc.created_at).toLocaleDateString()}
              </div>
              <div className="flex space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(doc.source_url, '_blank')}
                  className="text-xs h-6 px-2"
                >
                  <ExternalLink className="h-2 w-2 mr-1" />
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadPDF(doc.source_url, doc.file_name)}
                  className="text-xs h-6 px-2"
                >
                  <Download className="h-2 w-2 mr-1" />
                  Download
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handlePrintLabel(doc)}
                  className={`text-xs h-6 px-2 text-white ${
                    compliance.status === 'osha_compliant' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : compliance.status === 'manual_review'
                      ? 'bg-orange-600 hover:bg-orange-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  <Printer className="h-2 w-2 mr-1" />
                  Print Label
                </Button>
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

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-xs font-medium text-gray-600">Total</p>
                  <p className="text-lg font-bold text-gray-900">{documents?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-xs font-medium text-gray-600">OSHA Compliant</p>
                  <p className="text-lg font-bold text-gray-900">{oshaCompliantDocs.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <div>
                  <p className="text-xs font-medium text-gray-600">Manual Review</p>
                  <p className="text-lg font-bold text-gray-900">{manualReviewDocs.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-xs font-medium text-gray-600">High Quality</p>
                  <p className="text-lg font-bold text-gray-900">{highQualityDocs.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-gray-600" />
                <div>
                  <p className="text-xs font-medium text-gray-600">Readable</p>
                  <p className="text-lg font-bold text-gray-900">{readableDocs.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Documents Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-5 h-8">
            <TabsTrigger value="all" className="text-xs">All ({documents?.length || 0})</TabsTrigger>
            <TabsTrigger value="osha-compliant" className="text-xs">OSHA ({oshaCompliantDocs.length})</TabsTrigger>
            <TabsTrigger value="manual-review" className="text-xs">Review ({manualReviewDocs.length})</TabsTrigger>
            <TabsTrigger value="high-quality" className="text-xs">Quality ({highQualityDocs.length})</TabsTrigger>
            <TabsTrigger value="readable" className="text-xs">Readable ({readableDocs.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-3">
            <div className="space-y-2">
              {documents && documents.length > 0 ? (
                documents.map((doc: SDSDocument) => (
                  <DocumentCard key={doc.id} doc={doc} />
                ))
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <FileText className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-600">No SDS documents found.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="osha-compliant" className="mt-3">
            <div className="space-y-2">
              {oshaCompliantDocs.length > 0 ? (
                oshaCompliantDocs.map((doc: SDSDocument) => (
                  <DocumentCard key={doc.id} doc={doc} />
                ))
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <Shield className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-600">No OSHA-compliant documents found.</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Documents need ≥98% confidence to be OSHA compliant.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="manual-review" className="mt-3">
            <div className="space-y-2">
              {manualReviewDocs.length > 0 ? (
                manualReviewDocs.map((doc: SDSDocument) => (
                  <DocumentCard key={doc.id} doc={doc} />
                ))
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <AlertTriangle className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-600">No documents requiring manual review.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="high-quality" className="mt-3">
            <div className="space-y-2">
              {highQualityDocs.length > 0 ? (
                highQualityDocs.map((doc: SDSDocument) => (
                  <DocumentCard key={doc.id} doc={doc} />
                ))
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <CheckCircle className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-600">No high-quality documents found.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="readable" className="mt-3">
            <div className="space-y-2">
              {readableDocs.length > 0 ? (
                readableDocs.map((doc: SDSDocument) => (
                  <DocumentCard key={doc.id} doc={doc} />
                ))
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <CheckCircle className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-600">No readable documents found.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Label Printer Popup */}
      <LabelPrinterPopup
        isOpen={labelPrinterOpen}
        onClose={() => {
          setLabelPrinterOpen(false);
          setSelectedDocumentForLabel(null);
        }}
        initialProductName={selectedDocumentForLabel?.product_name}
        initialManufacturer={selectedDocumentForLabel?.manufacturer}
        selectedDocument={selectedDocumentForLabel}
      />
    </div>
  );
};

export default SDSDocumentsPage;
