
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, RefreshCw, FileText, TestTube, Eye, Code, Zap, ExternalLink, Bot, GitCompare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Json } from "@/integrations/supabase/types";

interface SDSDocument {
  id: string;
  product_name: string;
  file_name: string;
  bucket_url: string | null;
  source_url: string;
  extraction_status: string | null;
  ai_extraction_confidence: number | null;
  extraction_quality_score: number | null;
  full_text?: string | null;
  h_codes?: Json;
  pictograms?: Json;
  hmis_codes?: Json;
  nfpa_codes?: Json;
  signal_word?: string | null;
  manufacturer?: string | null;
  cas_number?: string | null;
}

interface HMISBotResult {
  success: boolean;
  hmis_label: {
    health: string;
    flammability: number;
    physical_hazard: number;
    ppe: string;
  };
  ghs_info: {
    signal_word: string;
    pictograms: string[];
  };
  processing_time_ms: number;
  confidence_score: number;
  sections_found: string[];
  error?: string;
}

const PDFParserTestPage = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<SDSDocument[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<SDSDocument | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isHmisBotProcessing, setIsHmisBotProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [processingResults, setProcessingResults] = useState<any>(null);
  const [hmisBotResults, setHmisBotResults] = useState<HMISBotResult | null>(null);
  const [activeTab, setActiveTab] = useState<'current' | 'hmis-bot' | 'comparison'>('current');

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
        cas_number: doc.cas_number,
        extraction_status: doc.extraction_status,
        confidence: doc.ai_extraction_confidence,
        quality_score: doc.extraction_quality_score
      });
      // Reset HMIS-BOT results when selecting new document
      setHmisBotResults(null);
      setActiveTab('current');
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
          cas_number: updatedDoc.cas_number,
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

  const processWithHMISBot = async () => {
    if (!selectedDocument || !extractedText) {
      toast.error('No document text available for HMIS-BOT analysis');
      return;
    }

    setIsHmisBotProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('hmis-bot-analysis', {
        body: {
          sds_text: extractedText,
          document_id: selectedDocument.id
        }
      });

      if (error) throw error;

      setHmisBotResults(data);
      setActiveTab('hmis-bot');
      toast.success('HMIS-BOT analysis complete');
    } catch (error) {
      console.error('HMIS-BOT error:', error);
      toast.error('Failed to process with HMIS-BOT');
    } finally {
      setIsHmisBotProcessing(false);
    }
  };

  const openPDFInNewWindow = () => {
    if (selectedDocument?.source_url) {
      window.open(selectedDocument.source_url, '_blank');
    }
  };

  const renderCurrentSystemResults = () => (
    <div className="space-y-4">
      {/* Product Information */}
      <div className="p-3 bg-blue-50 rounded-lg">
        <h4 className="font-semibold mb-2">Product Information</h4>
        <div className="space-y-1 text-sm">
          <div>Product: <Badge variant="outline">{selectedDocument?.product_name}</Badge></div>
          <div>CAS Number: <Badge variant="outline">{processingResults?.cas_number || 'N/A'}</Badge></div>
          <div>Manufacturer: <Badge variant="outline">{processingResults?.manufacturer || 'N/A'}</Badge></div>
        </div>
      </div>

      {/* HMIS Codes & Rules */}
      <div className="p-3 bg-green-50 rounded-lg">
        <h4 className="font-semibold mb-2">HMIS Codes & Calculation Rules</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="font-medium mb-1">Health: <Badge variant="outline">{processingResults?.hmis_codes?.health || 'N/A'}</Badge></div>
            <div className="text-xs text-gray-600">
              • 0: No significant risk<br/>
              • 1: Slight hazard<br/>
              • 2: Moderate hazard<br/>
              • 3: Serious hazard<br/>
              • 4: Severe hazard
            </div>
          </div>
          <div>
            <div className="font-medium mb-1">Flammability: <Badge variant="outline">{processingResults?.hmis_codes?.flammability || 'N/A'}</Badge></div>
            <div className="text-xs text-gray-600">
              • 0: Will not burn<br/>
              • 1: Above 200°F<br/>
              • 2: Above 100°F to 200°F<br/>
              • 3: Below 100°F<br/>
              • 4: Below 73°F
            </div>
          </div>
          <div>
            <div className="font-medium mb-1">Physical: <Badge variant="outline">{processingResults?.hmis_codes?.physical || 'N/A'}</Badge></div>
            <div className="text-xs text-gray-600">
              • 0: Stable<br/>
              • 1: Unstable if heated<br/>
              • 2: Violent change<br/>
              • 3: Shock/heat may detonate<br/>
              • 4: May detonate
            </div>
          </div>
          <div>
            <div className="font-medium mb-1">PPE: <Badge variant="outline">{processingResults?.hmis_codes?.special || processingResults?.hmis_codes?.ppe || 'N/A'}</Badge></div>
            <div className="text-xs text-gray-600">
              • A-K: Specific PPE combinations<br/>
              • X: Special precautions<br/>
              • Based on Section 8 requirements
            </div>
          </div>
        </div>
      </div>

      {/* H-Codes */}
      <div className="p-3 bg-red-50 rounded-lg">
        <h4 className="font-semibold mb-2">Hazard Codes (H-Codes)</h4>
        <div className="flex flex-wrap gap-1 mb-2">
          {Array.isArray(processingResults?.h_codes) && processingResults.h_codes.length > 0 ? (
            processingResults.h_codes.map((code: any, idx: number) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {typeof code === 'string' ? code : code.code || code}
              </Badge>
            ))
          ) : (
            <span className="text-gray-500">None identified</span>
          )}
        </div>
      </div>

      {/* GHS Pictograms */}
      <div className="p-3 bg-orange-50 rounded-lg">
        <h4 className="font-semibold mb-2">GHS Pictograms</h4>
        <div className="flex flex-wrap gap-1">
          {Array.isArray(processingResults?.pictograms) && processingResults.pictograms.length > 0 ? (
            processingResults.pictograms.map((pic: any, idx: number) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {typeof pic === 'string' ? pic : pic.name || pic.ghs_code || pic}
              </Badge>
            ))
          ) : (
            <span className="text-gray-500">None identified</span>
          )}
        </div>
      </div>

      {/* Processing Metadata */}
      <div className="p-3 bg-gray-50 rounded-lg">
        <h4 className="font-semibold mb-2">Processing Metadata</h4>
        <div className="text-sm space-y-1">
          <div>Status: <Badge variant="outline">{processingResults?.extraction_status}</Badge></div>
          <div>Quality Score: <Badge variant="outline">{processingResults?.quality_score}/100</Badge></div>
          {processingResults?.signal_word && (
            <div>Signal Word: <Badge variant="outline">{processingResults.signal_word}</Badge></div>
          )}
        </div>
      </div>
    </div>
  );

  const renderHMISBotResults = () => (
    <div className="space-y-4">
      {hmisBotResults ? (
        <>
          {/* HMIS Label Output */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border-2 border-blue-200">
            <h4 className="font-bold mb-3 text-lg flex items-center gap-2">
              <Bot className="h-5 w-5" />
              HMIS-BOT Label Output
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm font-mono">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Health:</span>
                  <Badge variant="default" className="text-lg px-3 py-1">
                    {hmisBotResults.hmis_label.health}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Flammability:</span>
                  <Badge variant="destructive" className="text-lg px-3 py-1">
                    {hmisBotResults.hmis_label.flammability}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Physical Hazard:</span>
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    {hmisBotResults.hmis_label.physical_hazard}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">PPE:</span>
                  <Badge variant="outline" className="text-lg px-3 py-1">
                    {hmisBotResults.hmis_label.ppe}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* GHS Information */}
          <div className="p-3 bg-yellow-50 rounded-lg">
            <h4 className="font-semibold mb-2">GHS Information</h4>
            <div className="space-y-2 text-sm">
              <div>Signal Word: <Badge variant="outline">{hmisBotResults.ghs_info.signal_word}</Badge></div>
              <div>
                <span className="font-medium">Pictograms:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {hmisBotResults.ghs_info.pictograms.length > 0 ? (
                    hmisBotResults.ghs_info.pictograms.map((pic, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {pic}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-gray-500">None identified</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Processing Stats */}
          <div className="p-3 bg-purple-50 rounded-lg">
            <h4 className="font-semibold mb-2">HMIS-BOT Processing Stats</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div>Confidence: <Badge variant="outline">{hmisBotResults.confidence_score}%</Badge></div>
                <div>Processing Time: <Badge variant="outline">{hmisBotResults.processing_time_ms}ms</Badge></div>
              </div>
              <div>
                <div className="font-medium mb-1">Sections Found:</div>
                <div className="flex flex-wrap gap-1">
                  {hmisBotResults.sections_found.map((section, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {section}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {hmisBotResults.error && (
            <div className="p-3 bg-red-50 rounded-lg">
              <h4 className="font-semibold mb-2 text-red-700">Error</h4>
              <p className="text-sm text-red-600">{hmisBotResults.error}</p>
            </div>
          )}
        </>
      ) : (
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <Bot className="h-12 w-12 mx-auto mb-4" />
            <p>Run HMIS-BOT analysis to see results</p>
          </div>
        </div>
      )}
    </div>
  );

  const renderComparison = () => (
    <div className="space-y-4">
      {processingResults && hmisBotResults ? (
        <>
          {/* HMIS Codes Comparison */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
            <h4 className="font-bold mb-3 flex items-center gap-2">
              <GitCompare className="h-5 w-5" />
              HMIS Codes Comparison
            </h4>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h5 className="font-semibold mb-2 text-blue-700">Current System</h5>
                <div className="space-y-1 text-sm">
                  <div>Health: <Badge variant="outline">{processingResults.hmis_codes?.health || 'N/A'}</Badge></div>
                  <div>Flammability: <Badge variant="outline">{processingResults.hmis_codes?.flammability || 'N/A'}</Badge></div>
                  <div>Physical: <Badge variant="outline">{processingResults.hmis_codes?.physical || 'N/A'}</Badge></div>
                  <div>PPE: <Badge variant="outline">{processingResults.hmis_codes?.ppe || 'N/A'}</Badge></div>
                </div>
              </div>
              <div>
                <h5 className="font-semibold mb-2 text-purple-700">HMIS-BOT</h5>
                <div className="space-y-1 text-sm">
                  <div>Health: <Badge variant="default">{hmisBotResults.hmis_label.health}</Badge></div>
                  <div>Flammability: <Badge variant="destructive">{hmisBotResults.hmis_label.flammability}</Badge></div>
                  <div>Physical: <Badge variant="secondary">{hmisBotResults.hmis_label.physical_hazard}</Badge></div>
                  <div>PPE: <Badge variant="outline">{hmisBotResults.hmis_label.ppe}</Badge></div>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Comparison */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2">Performance Comparison</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium text-blue-700">Current System</div>
                <div>Confidence: {processingResults.confidence || 0}%</div>
                <div>Quality Score: {processingResults.quality_score || 0}/100</div>
              </div>
              <div>
                <div className="font-medium text-purple-700">HMIS-BOT</div>
                <div>Confidence: {hmisBotResults.confidence_score}%</div>
                <div>Processing Time: {hmisBotResults.processing_time_ms}ms</div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <GitCompare className="h-12 w-12 mx-auto mb-4" />
            <p>Process document with both systems to see comparison</p>
          </div>
        </div>
      )}
    </div>
  );

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
              <>
                <Button
                  onClick={processDocument}
                  disabled={isProcessing}
                  className="flex items-center gap-2"
                  variant="outline"
                >
                  {isProcessing ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4" />
                  )}
                  {isProcessing ? 'Processing...' : 'Re-Process'}
                </Button>
                
                <Button
                  onClick={processWithHMISBot}
                  disabled={isHmisBotProcessing || !extractedText}
                  className="flex items-center gap-2"
                >
                  {isHmisBotProcessing ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                  {isHmisBotProcessing ? 'Analyzing...' : 'HMIS-BOT'}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 h-[calc(100vh-88px)]">
        {selectedDocument ? (
          <ResizablePanelGroup direction="horizontal" className="h-full">
            {/* Left Panel - Extracted Text */}
            <ResizablePanel defaultSize={40} minSize={25}>
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-lg">
                    <div className="flex items-center gap-2">
                      <Code className="h-5 w-5" />
                      Extracted Text
                      <Badge variant="outline" className="ml-2">
                        {extractedText.length} characters
                      </Badge>
                    </div>
                    {selectedDocument.source_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={openPDFInNewWindow}
                        className="flex items-center gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Open PDF
                      </Button>
                    )}
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

            <ResizableHandle withHandle />

            {/* Right Panel - Analysis Results */}
            <ResizablePanel defaultSize={60} minSize={35}>
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Zap className="h-5 w-5" />
                      Analysis Results
                    </CardTitle>
                    
                    {/* Tab Navigation */}
                    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                      <Button
                        size="sm"
                        variant={activeTab === 'current' ? 'default' : 'ghost'}
                        onClick={() => setActiveTab('current')}
                        className="text-xs px-3 py-1"
                      >
                        Current
                      </Button>
                      <Button
                        size="sm"
                        variant={activeTab === 'hmis-bot' ? 'default' : 'ghost'}
                        onClick={() => setActiveTab('hmis-bot')}
                        className="text-xs px-3 py-1"
                      >
                        HMIS-BOT
                      </Button>
                      <Button
                        size="sm"
                        variant={activeTab === 'comparison' ? 'default' : 'ghost'}
                        onClick={() => setActiveTab('comparison')}
                        className="text-xs px-3 py-1"
                      >
                        Compare
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4 overflow-y-auto h-[calc(100%-5rem)]">
                  {activeTab === 'current' && renderCurrentSystemResults()}
                  {activeTab === 'hmis-bot' && renderHMISBotResults()}
                  {activeTab === 'comparison' && renderComparison()}
                </CardContent>
              </Card>
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
                and GHS pictogram identification. Now includes HMIS-BOT for algorithm comparison.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PDFParserTestPage;
