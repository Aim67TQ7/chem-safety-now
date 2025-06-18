
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle, FileText, Download, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

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

  const getQualityColor = (score?: number) => {
    if (!score) return 'bg-gray-500';
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

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

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading SDS documents...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <span>Error loading documents: {error.message}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const highQualityDocs = documents?.filter((doc: SDSDocument) => (doc.extraction_quality_score || 0) >= 60) || [];
  const lowQualityDocs = documents?.filter((doc: SDSDocument) => (doc.extraction_quality_score || 0) < 60) || [];
  const readableDocs = documents?.filter((doc: SDSDocument) => doc.is_readable) || [];
  const unreadableDocs = documents?.filter((doc: SDSDocument) => !doc.is_readable) || [];

  const DocumentCard = ({ doc }: { doc: SDSDocument }) => (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-gray-900">
              {doc.product_name}
            </CardTitle>
            {doc.manufacturer && (
              <p className="text-sm text-gray-600 mt-1">
                Manufacturer: {doc.manufacturer}
              </p>
            )}
            {doc.cas_number && (
              <p className="text-sm text-gray-600">
                CAS: {doc.cas_number}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end space-y-2">
            <Badge 
              variant={doc.is_readable ? "default" : "destructive"}
              className="text-xs"
            >
              {doc.is_readable ? (
                <><CheckCircle className="h-3 w-3 mr-1" /> Readable</>
              ) : (
                <><AlertCircle className="h-3 w-3 mr-1" /> Unreadable</>
              )}
            </Badge>
            <div className="text-right">
              <div className="text-xs text-gray-500 mb-1">Quality Score</div>
              <div className="flex items-center space-x-2">
                <Progress 
                  value={doc.extraction_quality_score || 0} 
                  className="w-16 h-2"
                />
                <span className="text-sm font-medium">
                  {Math.round(doc.extraction_quality_score || 0)}%
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {getQualityLabel(doc.extraction_quality_score)}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {doc.signal_word && (
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                Signal: {doc.signal_word}
              </Badge>
            </div>
          )}
          
          {doc.h_codes && doc.h_codes.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">H-Codes:</p>
              <div className="flex flex-wrap gap-1">
                {doc.h_codes.slice(0, 3).map((hCode, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {hCode.code}
                  </Badge>
                ))}
                {doc.h_codes.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{doc.h_codes.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {doc.pictograms && doc.pictograms.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Pictograms:</p>
              <div className="flex flex-wrap gap-1">
                {doc.pictograms.slice(0, 3).map((pictogram, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {pictogram.ghs_code || pictogram.name}
                  </Badge>
                ))}
                {doc.pictograms.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{doc.pictograms.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t">
            <div className="text-xs text-gray-500">
              Added: {new Date(doc.created_at).toLocaleDateString()}
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(doc.source_url, '_blank')}
                className="text-xs"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                View Source
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownloadPDF(doc.source_url, doc.file_name)}
                className="text-xs"
              >
                <Download className="h-3 w-3 mr-1" />
                Download
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">SDS Document Library</h1>
        <p className="text-gray-600">
          Manage and browse your Safety Data Sheet documents with quality scores and readability analysis.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Documents</p>
                <p className="text-2xl font-bold text-gray-900">{documents?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">High Quality</p>
                <p className="text-2xl font-bold text-gray-900">{highQualityDocs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Readable</p>
                <p className="text-2xl font-bold text-gray-900">{readableDocs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Low Quality</p>
                <p className="text-2xl font-bold text-gray-900">{lowQualityDocs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Documents Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Documents ({documents?.length || 0})</TabsTrigger>
          <TabsTrigger value="high-quality">High Quality ({highQualityDocs.length})</TabsTrigger>
          <TabsTrigger value="readable">Readable ({readableDocs.length})</TabsTrigger>
          <TabsTrigger value="needs-review">Needs Review ({lowQualityDocs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="space-y-4">
            {documents && documents.length > 0 ? (
              documents.map((doc: SDSDocument) => (
                <DocumentCard key={doc.id} doc={doc} />
              ))
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No SDS documents found.</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Search for products to start building your document library.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="high-quality" className="mt-6">
          <div className="space-y-4">
            {highQualityDocs.length > 0 ? (
              highQualityDocs.map((doc: SDSDocument) => (
                <DocumentCard key={doc.id} doc={doc} />
              ))
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No high-quality documents found.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="readable" className="mt-6">
          <div className="space-y-4">
            {readableDocs.length > 0 ? (
              readableDocs.map((doc: SDSDocument) => (
                <DocumentCard key={doc.id} doc={doc} />
              ))
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No readable documents found.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="needs-review" className="mt-6">
          <div className="space-y-4">
            {lowQualityDocs.length > 0 ? (
              lowQualityDocs.map((doc: SDSDocument) => (
                <DocumentCard key={doc.id} doc={doc} />
              ))
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">All documents have good quality scores!</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SDSDocumentsPage;
