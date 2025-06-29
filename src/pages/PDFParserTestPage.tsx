
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, RefreshCw, FileText, TestTube, Eye, Code, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SDSDocument {
  id: string;
  product_name: string;
  file_name: string;
  bucket_url: string;
  source_url: string;
  extraction_status: string;
  ai_extraction_confidence: number;
  extraction_quality_score: number;
  full_text?: string;
  h_codes?: any[];
  pictograms?: any[];
  hmis_codes?: any;
  nfpa_codes?: any;
  signal_word?: string;
  manufacturer?: string;
}

const PDFParserTestPage = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<SDSDocument[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<SDSDocument | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [processingResults, setProcessingResults] = useState<any>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('sds_documents')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load documents');
    }
  };

  const handleDocumentSelect = (documentId: string) => {
    const doc = documents.find(d => d.id === documentId);
    if (doc) {
      setSelectedDocument(doc);
      setExtractedText(doc.full_text || 'No text extracted yet');
      setProcessingResults({
        h_codes: doc.h_codes || [],
        pictograms: doc.pictograms || [],
        hmis_codes: doc.hmis_codes || {},
        nfpa_codes: doc.nfpa_codes || {},
        signal_word: doc.signal_word,
        manufacturer: doc.manufacturer,
        extraction_status: doc.extraction_status,
        confidence: doc.ai_extraction_confidence,
        quality_score: doc.extraction_quality_score
      });
    }
  };

  const processDocument = async () => {
    if (!selectedDocument) return;

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('extract-sds-text', {
        body: {
          document_id: selectedDocument.id,
          bucket_url: selectedDocument.bucket_url || selectedDocument.source_url
        }
      });

      if (error) throw error;

      toast.success('Document processed successfully');
      
      // Refresh the document data
      const { data: updatedDoc, error: fetchError } = await supabase
        .from('sds_documents')
        .select('*')
        .eq('id', selectedDocument.id)
        .single();

      if (!fetchError && updatedDoc) {
        setSelectedDocument(updatedDoc);
        setExtractedText(updatedDoc.full_text || 'No text extracted');
        setProcessingResults({
          h_codes: updatedDoc.h_codes || [],
          pictograms: updatedDoc.pictograms || [],
          hmis_codes: updatedDoc.hmis_codes || {},
          nfpa_codes: updatedDoc.nfpa_codes || {},
          signal_word: updatedDoc.signal_word,
          manufacturer: updatedDoc.manufacturer,
          extraction_status: updatedDoc.extraction_status,
          confidence: updatedDoc.ai_extraction_confidence,
          quality_score: updatedDoc.extraction_quality_score
        });
      }
    } catch (error) {
      console.error('Processing error:', error);
      toast.error('Failed to process document');
    } finally {
      setIsProcessing(false);
    }
  };

  const getPDFUrl = () => {
    if (!selectedDocument) return null;
    
    if (selectedDocument.bucket_url) {
      const { data } = supabase.storage
        .from('sds-documents')
        .getPublicUrl(selectedDocument.bucket_url.replace('sds-documents/', ''));
      return data.publicUrl;
    }
    
    return selectedDocument.source_url;
  };

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
              <TestTube className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold">PDF Parser Test Environment</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Select onValueChange={handleDocumentSelect}>
              <SelectTrigger className="w-80">
                <SelectValue placeholder="Select a document to test..." />
              </SelectTrigger>
              <SelectContent>
                {documents.map((doc) => (
                  <SelectItem key={doc.id} value={doc.id}>
                    {doc.product_name} ({doc.file_name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedDocument && (
              <Button
                onClick={processDocument}
                disabled={isProcessing}
                className="flex items-center gap-2"
              >
                {isProcessing ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4" />
                )}
                {isProcessing ? 'Processing...' : 'Re-Process'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 h-[calc(100vh-88px)]">
        {selectedDocument ? (
          <ResizablePanelGroup direction="horizontal" className="h-full">
            {/* Left Panel - PDF Viewer */}
            <ResizablePanel defaultSize={40} minSize={25}>
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Eye className="h-5 w-5" />
                    PDF Document
                    <Badge variant="outline" className="ml-2">
                      {selectedDocument.file_name}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 h-[calc(100%-4rem)]">
                  {getPDFUrl() ? (
                    <iframe
                      src={getPDFUrl()}
                      className="w-full h-full border-none"
                      title={`PDF: ${selectedDocument.product_name}`}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <div className="text-center">
                        <FileText className="h-12 w-12 mx-auto mb-4" />
                        <p>PDF not available</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Right Panel Group */}
            <ResizablePanel defaultSize={60} minSize={35}>
              <ResizablePanelGroup direction="vertical">
                {/* Top Right Panel - Processing Logic */}
                <ResizablePanel defaultSize={60} minSize={30}>
                  <Card className="h-full">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Zap className="h-5 w-5" />
                        HMIS/PPE/Pictogram Logic
                        {processingResults && (
                          <Badge 
                            variant={processingResults.confidence >= 80 ? "default" : "secondary"}
                            className="ml-2"
                          >
                            {processingResults.confidence}% Confidence
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 overflow-y-auto h-[calc(100%-4rem)]">
                      {processingResults ? (
                        <div className="space-y-4">
                          {/* HMIS Codes */}
                          <div className="p-3 bg-blue-50 rounded-lg">
                            <h4 className="font-semibold mb-2">HMIS Codes</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>Health: <Badge variant="outline">{processingResults.hmis_codes?.health || 'N/A'}</Badge></div>
                              <div>Flammability: <Badge variant="outline">{processingResults.hmis_codes?.flammability || 'N/A'}</Badge></div>
                              <div>Physical: <Badge variant="outline">{processingResults.hmis_codes?.physical || 'N/A'}</Badge></div>
                              <div>PPE: <Badge variant="outline">{processingResults.hmis_codes?.ppe || 'N/A'}</Badge></div>
                            </div>
                          </div>

                          {/* Pictograms */}
                          <div className="p-3 bg-orange-50 rounded-lg">
                            <h4 className="font-semibold mb-2">GHS Pictograms</h4>
                            <div className="flex flex-wrap gap-1">
                              {processingResults.pictograms?.length > 0 ? (
                                processingResults.pictograms.map((pic: any, idx: number) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {typeof pic === 'string' ? pic : pic.name || pic.ghs_code}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-gray-500">None identified</span>
                              )}
                            </div>
                          </div>

                          {/* H-Codes */}
                          <div className="p-3 bg-red-50 rounded-lg">
                            <h4 className="font-semibold mb-2">Hazard Codes</h4>
                            <div className="flex flex-wrap gap-1">
                              {processingResults.h_codes?.length > 0 ? (
                                processingResults.h_codes.map((code: any, idx: number) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {typeof code === 'string' ? code : code.code}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-gray-500">None identified</span>
                              )}
                            </div>
                          </div>

                          {/* Metadata */}
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <h4 className="font-semibold mb-2">Processing Metadata</h4>
                            <div className="text-sm space-y-1">
                              <div>Status: <Badge variant="outline">{processingResults.extraction_status}</Badge></div>
                              <div>Quality Score: <Badge variant="outline">{processingResults.quality_score}/100</Badge></div>
                              {processingResults.signal_word && (
                                <div>Signal Word: <Badge variant="outline">{processingResults.signal_word}</Badge></div>
                              )}
                              {processingResults.manufacturer && (
                                <div>Manufacturer: <Badge variant="outline">{processingResults.manufacturer}</Badge></div>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                          <div className="text-center">
                            <Zap className="h-12 w-12 mx-auto mb-4" />
                            <p>Select a document to view processing results</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </ResizablePanel>

                <ResizableHandle withHandle />

                {/* Bottom Right Panel - Extracted Text */}
                <ResizablePanel defaultSize={40} minSize={20}>
                  <Card className="h-full">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Code className="h-5 w-5" />
                        Extracted Text
                        <Badge variant="outline" className="ml-2">
                          {extractedText.length} characters
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 h-[calc(100%-4rem)]">
                      <div className="h-full bg-gray-900 text-green-400 p-4 overflow-y-auto font-mono text-xs">
                        <pre className="whitespace-pre-wrap">
                          {extractedText || 'No text extracted yet...'}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>
          </ResizablePanelGroup>
        ) : (
          <Card className="h-full flex items-center justify-center">
            <CardContent className="text-center">
              <TestTube className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">PDF Parser Test Environment</h3>
              <p className="text-gray-600 mb-4">
                Select a document from the dropdown above to begin testing PDF parsing and HMIS logic.
              </p>
              <p className="text-sm text-gray-500">
                This environment allows you to test PDF text extraction, HMIS code calculation, 
                and GHS pictogram identification in real-time.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PDFParserTestPage;
