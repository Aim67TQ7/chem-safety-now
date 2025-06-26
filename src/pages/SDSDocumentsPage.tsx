import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle, FileText, Download, ExternalLink, Printer } from 'lucide-react';
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
        .select('facility_name, logo_url')
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
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
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

  const highQualityDocs = documents?.filter((doc: SDSDocument) => (doc.extraction_quality_score || 0) >= 60) || [];
  const lowQualityDocs = documents?.filter((doc: SDSDocument) => (doc.extraction_quality_score || 0) < 60) || [];
  const readableDocs = documents?.filter((doc: SDSDocument) => doc.is_readable) || [];

  const DocumentCard = ({ doc }: { doc: SDSDocument }) => (
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
              variant={doc.is_readable ? "default" : "destructive"}
              className="text-xs px-2 py-0"
            >
              {doc.is_readable ? (
                <><CheckCircle className="h-2 w-2 mr-1" /> Readable</>
              ) : (
                <><AlertCircle className="h-2 w-2 mr-1" /> Unreadable</>
              )}
            </Badge>
            <div className="text-right">
              <div className="flex items-center space-x-1">
                <Progress 
                  value={doc.extraction_quality_score || 0} 
                  className="w-12 h-1"
                />
                <span className="text-xs font-medium">
                  {Math.round(doc.extraction_quality_score || 0)}%
                </span>
              </div>
              <div className="text-xs text-gray-500">
                {getQualityLabel(doc.extraction_quality_score)}
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
                className="text-xs h-6 px-2 bg-blue-600 hover:bg-blue-700 text-white"
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-red-50">
      <FacilityNavbar 
        facilityName={facilityData?.facility_name || undefined}
        facilityLogo={facilityData?.logo_url}
      />
      <div className="container mx-auto p-4">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">SDS Document Library</h1>
          <p className="text-sm text-gray-600">
            Manage and browse your Safety Data Sheet documents with quality scores and readability analysis.
          </p>
        </div>

        {/* Compact Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
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
                <CheckCircle className="h-4 w-4 text-green-600" />
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
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-xs font-medium text-gray-600">Readable</p>
                  <p className="text-lg font-bold text-gray-900">{readableDocs.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <div>
                  <p className="text-xs font-medium text-gray-600">Low Quality</p>
                  <p className="text-lg font-bold text-gray-900">{lowQualityDocs.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Compact Documents Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-8">
            <TabsTrigger value="all" className="text-xs">All ({documents?.length || 0})</TabsTrigger>
            <TabsTrigger value="high-quality" className="text-xs">High Quality ({highQualityDocs.length})</TabsTrigger>
            <TabsTrigger value="readable" className="text-xs">Readable ({readableDocs.length})</TabsTrigger>
            <TabsTrigger value="needs-review" className="text-xs">Review ({lowQualityDocs.length})</TabsTrigger>
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
                    <p className="text-xs text-gray-500 mt-1">
                      Search for products to start building your document library.
                    </p>
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

          <TabsContent value="needs-review" className="mt-3">
            <div className="space-y-2">
              {lowQualityDocs.length > 0 ? (
                lowQualityDocs.map((doc: SDSDocument) => (
                  <DocumentCard key={doc.id} doc={doc} />
                ))
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-600">All documents have good quality scores!</p>
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
