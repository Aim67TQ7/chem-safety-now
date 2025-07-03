
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Search, FileText, Download, Eye, Printer, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SDSEvaluationButton from "@/components/SDSEvaluationButton";
import { getSDSDocumentStatus } from "@/utils/sdsStatusUtils";
import SDSSearchInput from "@/components/SDSSearchInput";
import SDSResultCard from "@/components/SDSResultCard";


interface SDSDocument {
  id: string;
  product_name: string;
  file_name: string;
  manufacturer?: string;
  bucket_url?: string;
  source_url: string;
  extraction_status: string;
  ai_extraction_confidence: number;
  extraction_quality_score: number;
  created_at: string;
  file_size?: number;
}

const AdminSDSDocumentsPage = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<SDSDocument[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<SDSDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    filterDocuments();
  }, [documents, searchTerm]);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('sds_documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const filterDocuments = () => {
    if (!searchTerm.trim()) {
      setFilteredDocuments(documents);
      return;
    }

    const filtered = documents.filter(doc =>
      doc.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.manufacturer && doc.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredDocuments(filtered);
  };

  const handleViewPDF = (document: SDSDocument) => {
    const pdfUrl = document.bucket_url 
      ? supabase.storage.from('sds-documents').getPublicUrl(document.bucket_url.replace('sds-documents/', '')).data.publicUrl
      : document.source_url;
    
    window.open(pdfUrl, '_blank');
  };

  const handlePrintLabel = (document: SDSDocument) => {
    // Navigate to a general label printer page for admin use
    window.location.href = `/admin/label-printer?documentId=${document.id}`;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const handleSearchResults = (results: any[]) => {
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleSearchStart = () => {
    setIsSearching(true);
  };

  const handleViewSearchResult = (document: any) => {
    window.open(document.source_url, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
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
              <FileText className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold">All SDS Documents</h1>
              <Badge variant="outline" className="ml-2">
                {filteredDocuments.length} documents
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-80"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <Tabs defaultValue="documents" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="documents" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Existing Documents ({filteredDocuments.length})
              </TabsTrigger>
              <TabsTrigger value="search" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Find New SDS Documents
              </TabsTrigger>
            </TabsList>

            <TabsContent value="documents" className="mt-6">
              {filteredDocuments.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-xl font-semibold mb-2">
                      {searchTerm ? 'No documents found' : 'No SDS documents available'}
                    </h3>
                    <p className="text-gray-600">
                      {searchTerm 
                        ? `No documents match "${searchTerm}"`
                        : 'SDS documents will appear here once they are uploaded by facilities.'
                      }
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredDocuments.map((document) => {
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
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-600">
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
                                onClick={() => handleViewPDF(document)}
                                className="flex items-center gap-2"
                              >
                                <Eye className="h-4 w-4" />
                                View PDF
                              </Button>
                              
                              {document.ai_extraction_confidence > 0 && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handlePrintLabel(document)}
                                  className="flex items-center gap-2"
                                >
                                  <Printer className="h-4 w-4" />
                                  Print Label
                                </Button>
                              )}
                              
                              <SDSEvaluationButton
                                document={document}
                                onEvaluationComplete={fetchDocuments}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
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
                    <p className="text-sm text-gray-600">
                      Find and add new SDS documents to the system with Quick Print functionality.
                    </p>
                  </CardHeader>
                  <CardContent>
                    <SDSSearchInput
                      facilityId="admin"
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
                          isSelected={false}
                          onSelect={() => {}}
                          showSelection={false}
                          isAdminContext={true}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {isSearching && (
                  <Card>
                    <CardContent className="text-center py-8">
                      <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                      <p className="text-gray-600">Searching for SDS documents...</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

    </div>
  );
};

export default AdminSDSDocumentsPage;
