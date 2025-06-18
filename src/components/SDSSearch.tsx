import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Bot, Printer, Download, FileText, ExternalLink, AlertCircle, CheckCircle, RefreshCw, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AIAssistantPopup from "@/components/popups/AIAssistantPopup";
import LabelPrinterPopup from "@/components/popups/LabelPrinterPopup";
import SDSSelectionDialog from "@/components/SDSSelectionDialog";
import { interactionLogger } from "@/services/interactionLogger";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

interface SDSSearchProps {
  facilityData: any;
  onSearchStart?: () => void;
}

interface MatchResult {
  score: number;
  reasons: string[];
  autoSelect: boolean;
}

interface SDSDocument {
  id: string;
  job_id?: string;
  document_type: 'safety_data_sheet' | 'regulatory_sheet' | 'regulatory_sheet_article' | 'unknown_document';
  product_name: string;
  manufacturer?: string;
  preparation_date?: string;
  revision_date?: string;
  source_url: string;
  bucket_url?: string;
  file_name: string;
  file_size?: number;
  file_type?: string;
  full_text?: string;
  hmis_codes?: {
    health?: number;
    flammability?: number;
    physical?: number;
    ppe?: string;
  };
  h_codes?: Array<{
    code: string;
    description: string;
  }>;
  pictograms?: Array<{
    ghs_code: string;
    name: string;
    description?: string;
  }>;
  nfpa_codes?: {
    health?: number;
    flammability?: number;
    instability?: number;
    special?: string;
  };
  signal_word?: string;
  hazard_statements?: string[];
  precautionary_statements?: string[];
  physical_hazards?: string[];
  health_hazards?: string[];
  environmental_hazards?: string[];
  first_aid?: {
    inhalation?: string;
    skin_contact?: string;
    eye_contact?: string;
    ingestion?: string;
  };
  cas_number?: string;
  regulatory_notes?: string[];
  created_at: string;
  confidence?: MatchResult;
  extraction_status?: 'pending' | 'processing' | 'complete';
  extraction_message?: string;
}

const API_BASE_URL = 'https://cheerful-fascination.railway.app';

const SDSSearch = ({ facilityData, onSearchStart }: SDSSearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SDSDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showLabelPrinter, setShowLabelPrinter] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<SDSDocument | null>(null);
  const [backendHealth, setBackendHealth] = useState<'checking' | 'healthy' | 'unhealthy'>('checking');
  const [connectionError, setConnectionError] = useState<string>('');
  const [showSelectionDialog, setShowSelectionDialog] = useState(false);
  const [multipleResults, setMultipleResults] = useState<SDSDocument[]>([]);
  const { toast } = useToast();

  // Health check on component mount
  useEffect(() => {
    checkBackendHealth();
  }, []);

  const checkBackendHealth = async () => {
    setBackendHealth('checking');
    setConnectionError('');
    
    try {
      console.log('🔍 Checking Supabase Edge Functions health');
      
      // Test the Supabase connection by calling the documents endpoint
      const { data, error } = await supabase.functions.invoke('sds-documents', {
        method: 'GET',
      });

      if (error) {
        console.error('❌ Supabase function error:', error);
        setBackendHealth('unhealthy');
        setConnectionError(`Supabase function error: ${error.message}`);
      } else {
        console.log('✅ Supabase Edge Functions connected successfully');
        setBackendHealth('healthy');
        setConnectionError('');
      }
    } catch (error) {
      console.error('❌ Health check error:', error);
      setBackendHealth('unhealthy');
      
      if (error instanceof Error) {
        setConnectionError(error.message);
      } else {
        setConnectionError('Unknown connection error');
      }
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    // Call onSearchStart callback if provided
    if (onSearchStart) {
      onSearchStart();
    }

    setIsLoading(true);
    
    await interactionLogger.logFacilityUsage({
      eventType: 'sds_search_initiated',
      eventDetail: {
        searchQuery: searchQuery.trim(),
        facilityName: facilityData.facilityName
      }
    });

    try {
      console.log('🔍 Starting search with query:', searchQuery.trim());
      
      const { data, error } = await supabase.functions.invoke('sds-search', {
        body: {
          product_name: searchQuery.trim(),
          max_results: 10
        }
      });

      if (error) {
        throw new Error(`Search failed: ${error.message}`);
      }

      console.log('📊 Search response data:', data);
      
      // Handle immediate results or job-based results
      if (data.results) {
        const results = Array.isArray(data.results) ? data.results : [data.results];
        console.log('✅ Setting search results:', results);
        
        // Handle auto-selected results
        if (data.auto_selected && results.length === 1) {
          const autoSelectedDoc = results[0];
          setSearchResults(results);
          
          let statusMessage = `Auto-selected "${autoSelectedDoc.product_name}" with ${(data.confidence_score * 100).toFixed(1)}% confidence. Matched on: ${data.match_reasons?.join(', ') || 'multiple criteria'}.`;
          
          if (autoSelectedDoc.extraction_status === 'processing') {
            statusMessage += ' Extracting hazard data in background...';
          }
          
          toast({
            title: "Perfect Match Found!",
            description: statusMessage,
            variant: "default"
          });
        } else if (results.length > 1) {
          // Multiple results found - show with confidence indicators
          setMultipleResults(results);
          setShowSelectionDialog(true);
          
          const topScore = results[0]?.confidence?.score || 0;
          toast({
            title: "Multiple Matches Found",
            description: `Found ${results.length} potential matches. Top match: ${(topScore * 100).toFixed(1)}% confidence. Please select the correct one.`,
            variant: "default"
          });
        } else {
          setSearchResults(results);
        }
      } else if (data.job_id) {
        // Job-based processing - poll for results
        console.log('⏳ Polling for job results:', data.job_id);
        await pollJobResults(data.job_id);
      } else {
        // Fallback to documents list
        console.log('📋 No direct results, falling back to document list');
        await fetchAllDocuments();
      }
      
      await interactionLogger.logFacilityUsage({
        eventType: 'sds_search_completed',
        eventDetail: {
          searchQuery: searchQuery.trim(),
          resultsCount: searchResults.length,
          autoSelected: data.auto_selected || false,
          confidenceScore: data.confidence_score || 0
        }
      });

    } catch (error) {
      console.error('❌ Search error:', error);
      
      // Fallback to searching existing documents
      try {
        console.log('🔄 Attempting fallback to document list');
        await fetchAllDocuments();
        toast({
          title: "Search Notice",
          description: "Showing existing documents. New document processing may be unavailable.",
          variant: "default"
        });
      } catch (fallbackError) {
        console.error('❌ Fallback search error:', fallbackError);
        toast({
          title: "Search Error",
          description: "Unable to search SDS documents. Please check your connection and try again.",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllDocuments = async () => {
    console.log('📋 Fetching all documents from Supabase');
    
    const { data, error } = await supabase.functions.invoke('sds-documents', {
      method: 'GET',
    });
    
    if (error) {
      throw new Error(`Failed to fetch documents: ${error.message}`);
    }
    
    console.log('📊 Documents response data:', data);
    
    // Handle the correct API response structure
    let documents: SDSDocument[] = [];
    if (data.documents && Array.isArray(data.documents)) {
      documents = data.documents;
    } else if (Array.isArray(data)) {
      documents = data;
    } else {
      console.warn('⚠️ Unexpected documents response structure:', data);
      documents = [];
    }
    
    // Filter documents by search query if provided
    const filteredDocuments = searchQuery.trim() 
      ? documents.filter((doc: SDSDocument) => 
          doc.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (doc.manufacturer && doc.manufacturer.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (doc.cas_number && doc.cas_number.includes(searchQuery))
        )
      : documents;
    
    console.log('✅ Setting filtered documents:', filteredDocuments);
    setSearchResults(filteredDocuments);
  };

  const pollJobResults = async (jobId: string) => {
    const maxAttempts = 30; // 30 seconds max
    let attempts = 0;

    const poll = async (): Promise<void> => {
      try {
        console.log(`⏳ Polling job ${jobId}, attempt ${attempts + 1}`);
        
        const { data: jobStatus, error } = await supabase.functions.invoke('sds-job-status', {
          method: 'GET',
        });
        
        if (error) throw new Error('Job status check failed');
        
        console.log('📊 Job status:', jobStatus);
        
        if (jobStatus.status === 'completed' && jobStatus.results) {
          const results = Array.isArray(jobStatus.results) ? jobStatus.results : [jobStatus.results];
          setSearchResults(results);
          return;
        }
        
        if (jobStatus.status === 'failed') {
          throw new Error(jobStatus.error || 'Job failed');
        }
        
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 1000); // Poll every second
        } else {
          throw new Error('Job timeout');
        }
      } catch (error) {
        console.error('❌ Job polling error:', error);
        // Fallback to document list
        await fetchAllDocuments();
      }
    };

    await poll();
  };

  const handleSaveSelectedSDS = async (selectedDoc: SDSDocument) => {
    console.log('💾 Saving selected SDS:', selectedDoc);
    
    // Add the selected document to the main results
    setSearchResults([selectedDoc]);
    setMultipleResults([]);
    
    await interactionLogger.logSDSInteraction({
      sdsDocumentId: selectedDoc.id,
      actionType: 'view',
      searchQuery: searchQuery,
      metadata: { 
        action: 'document_selected',
        confidenceScore: selectedDoc.confidence?.score || 0,
        matchReasons: selectedDoc.confidence?.reasons || []
      }
    });

    const confidenceText = selectedDoc.confidence?.score 
      ? ` (${(selectedDoc.confidence.score * 100).toFixed(1)}% confidence)` 
      : '';
    
    toast({
      title: "SDS Document Selected",
      description: `${selectedDoc.product_name}${confidenceText} has been selected.`,
      variant: "default"
    });
  };

  const handleViewDocument = async (sdsDocument: SDSDocument) => {
    await interactionLogger.logSDSInteraction({
      sdsDocumentId: sdsDocument.id,
      actionType: 'view',
      searchQuery: searchQuery
    });

    if (sdsDocument.bucket_url) {
      window.open(sdsDocument.bucket_url, '_blank');
    } else if (sdsDocument.source_url) {
      window.open(sdsDocument.source_url, '_blank');
    } else {
      toast({
        title: "Document Unavailable",
        description: "PDF document is not available for viewing.",
        variant: "destructive"
      });
    }
  };

  const handleDownloadDocument = async (sdsDocument: SDSDocument) => {
    await interactionLogger.logSDSInteraction({
      sdsDocumentId: sdsDocument.id,
      actionType: 'download',
      searchQuery: searchQuery
    });

    if (sdsDocument.bucket_url) {
      try {
        const response = await fetch(sdsDocument.bucket_url);
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = globalThis.document.createElement('a');
          a.href = url;
          a.download = sdsDocument.file_name || `${sdsDocument.product_name}_SDS.pdf`;
          globalThis.document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          globalThis.document.body.removeChild(a);
          
          toast({
            title: "Download Started",
            description: `Downloading ${sdsDocument.product_name} SDS document.`
          });
        } else {
          throw new Error('Download failed');
        }
      } catch (error) {
        console.error('Download error:', error);
        toast({
          title: "Download Error",
          description: "Unable to download the document. Please try again.",
          variant: "destructive"
        });
      }
    } else {
      toast({
        title: "Download Unavailable",
        description: "PDF download is not available for this document.",
        variant: "destructive"
      });
    }
  };

  const handleGenerateLabel = async (sdsDocument: SDSDocument) => {
    setSelectedDocument(sdsDocument);
    setShowLabelPrinter(true);
    
    await interactionLogger.logSDSInteraction({
      sdsDocumentId: sdsDocument.id,
      actionType: 'generate_label',
      searchQuery: searchQuery
    });
  };

  const handleAskAI = async (sdsDocument: SDSDocument) => {
    setSelectedDocument(sdsDocument);
    setShowAIAssistant(true);
    
    await interactionLogger.logSDSInteraction({
      sdsDocumentId: sdsDocument.id,
      actionType: 'ask_ai',
      searchQuery: searchQuery
    });
  };

  const getSignalWordVariant = (signalWord?: string) => {
    if (!signalWord) return 'secondary';
    return signalWord.toLowerCase() === 'danger' ? 'destructive' : 'secondary';
  };

  const getConfidenceBadgeVariant = (score?: number) => {
    if (!score) return 'secondary';
    if (score >= 0.9) return 'default'; // Green
    if (score >= 0.7) return 'secondary'; // Yellow
    return 'destructive'; // Red
  };

  const getConfidenceColor = (score?: number) => {
    if (!score) return 'text-gray-500';
    if (score >= 0.9) return 'text-green-600';
    if (score >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getExtractionStatusBadge = (status?: string) => {
    switch (status) {
      case 'processing':
        return <Badge variant="secondary" className="text-xs animate-pulse">Extracting...</Badge>;
      case 'complete':
        return <Badge variant="default" className="text-xs">Data Complete</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-xs">Pending Extract</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Backend Health Status - Only show errors */}
      {backendHealth === 'unhealthy' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between w-full">
            <div>
              Supabase connection failed: {connectionError || 'Unknown error'}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={checkBackendHealth}
              className="ml-4 flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Retry</span>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {backendHealth === 'checking' && (
        <Alert>
          <Search className="h-4 w-4 animate-spin" />
          <AlertDescription>
            Checking Supabase connection...
          </AlertDescription>
        </Alert>
      )}

      {/* Search Header - Simplified to focus on search only */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Safety Data Sheet Search
            </h2>
            <p className="text-sm text-gray-600">
              Search for chemical safety information. Use the buttons in each result for AI assistance and label generation.
            </p>
          </div>

          <div className="flex space-x-3">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Enter chemical name, CAS number, or product name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="text-sm"
              />
            </div>
            <Button 
              onClick={handleSearch}
              disabled={!searchQuery.trim() || isLoading || backendHealth === 'unhealthy'}
              className="bg-gray-800 hover:bg-gray-900 text-white px-6"
            >
              <Search className="w-4 h-4 mr-2" />
              {isLoading ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Search Results - Enhanced with document-specific actions */}
      {searchResults.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Search Results ({searchResults.length})
            </h3>
            {searchResults.length === 1 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setMultipleResults([searchResults[0]]);
                  setShowSelectionDialog(true);
                }}
                className="flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Add Identifiers</span>
              </Button>
            )}
          </div>
          
          {searchResults.map((sdsDocument) => (
            <Card key={sdsDocument.id} className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="text-lg font-semibold text-gray-900">
                      {sdsDocument.product_name}
                    </h4>
                    
                    {/* Confidence Score Badge */}
                    {sdsDocument.confidence?.score && (
                      <Badge 
                        variant={getConfidenceBadgeVariant(sdsDocument.confidence.score)}
                        className="text-xs"
                      >
                        {(sdsDocument.confidence.score * 100).toFixed(1)}% match
                      </Badge>
                    )}
                    
                    {/* Extraction Status Badge */}
                    {getExtractionStatusBadge(sdsDocument.extraction_status)}
                    
                    {sdsDocument.signal_word && (
                      <Badge 
                        variant={getSignalWordVariant(sdsDocument.signal_word)}
                        className="text-xs"
                      >
                        {sdsDocument.signal_word}
                      </Badge>
                    )}
                    {sdsDocument.document_type && sdsDocument.document_type !== 'safety_data_sheet' && (
                      <Badge variant="outline" className="text-xs">
                        {sdsDocument.document_type.replace(/_/g, ' ')}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Match Reasons */}
                  {sdsDocument.confidence?.reasons && sdsDocument.confidence.reasons.length > 0 && (
                    <div className="mb-2">
                      <span className={`text-xs font-medium ${getConfidenceColor(sdsDocument.confidence.score)}`}>
                        Matched on: {sdsDocument.confidence.reasons.join(', ')}
                      </span>
                    </div>
                  )}
                  
                  {/* Extraction Message */}
                  {sdsDocument.extraction_message && (
                    <div className="mb-2">
                      <span className="text-xs text-blue-600 italic">
                        {sdsDocument.extraction_message}
                      </span>
                    </div>
                  )}
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    {sdsDocument.manufacturer && (
                      <p><strong>Manufacturer:</strong> {sdsDocument.manufacturer}</p>
                    )}
                    {sdsDocument.cas_number && (
                      <p><strong>CAS Number:</strong> {sdsDocument.cas_number}</p>
                    )}
                    {sdsDocument.h_codes && sdsDocument.h_codes.length > 0 && (
                      <div>
                        <strong>Hazard Codes:</strong>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {sdsDocument.h_codes.slice(0, 5).map((hCode) => (
                            <Badge key={hCode.code} variant="outline" className="text-xs" title={hCode.description}>
                              {hCode.code}
                            </Badge>
                          ))}
                          {sdsDocument.h_codes.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{sdsDocument.h_codes.length - 5} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                    {sdsDocument.pictograms && sdsDocument.pictograms.length > 0 && (
                      <div>
                        <strong>Pictograms:</strong>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {sdsDocument.pictograms.map((pictogram) => (
                            <Badge key={pictogram.ghs_code} variant="secondary" className="text-xs">
                              {pictogram.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col space-y-2 ml-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewDocument(sdsDocument)}
                    className="w-full"
                  >
                    <FileText className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownloadDocument(sdsDocument)}
                    className="w-full"
                    disabled={!sdsDocument.bucket_url}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleGenerateLabel(sdsDocument)}
                    className="w-full"
                    title={`Create label for ${sdsDocument.product_name}`}
                  >
                    <Printer className="w-4 h-4 mr-1" />
                    Label
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleAskAI(sdsDocument)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    title={`Chat with Sarah, your AI Safety Manager about ${sdsDocument.product_name}`}
                  >
                    <Bot className="w-4 h-4 mr-1" />
                    Ask Sarah
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* No Results Message */}
      {searchResults.length === 0 && searchQuery && !isLoading && (
        <Card className="p-6 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Found</h3>
          <p className="text-gray-600 mb-4">
            No SDS documents found for "{searchQuery}". Try a different product name or CAS number.
          </p>
          <Button 
            variant="outline" 
            onClick={() => {
              setSearchQuery("");
              setSearchResults([]);
            }}
          >
            Clear Search
          </Button>
        </Card>
      )}

      {/* Popups */}
      <AIAssistantPopup
        isOpen={showAIAssistant}
        onClose={() => {
          setShowAIAssistant(false);
          setSelectedDocument(null);
        }}
        facilityData={facilityData}
        selectedDocument={selectedDocument}
      />

      <LabelPrinterPopup
        isOpen={showLabelPrinter}
        onClose={() => {
          setShowLabelPrinter(false);
          setSelectedDocument(null);
        }}
        initialProductName={selectedDocument?.product_name}
        initialManufacturer={selectedDocument?.manufacturer}
        selectedDocument={selectedDocument}
      />

      <SDSSelectionDialog
        isOpen={showSelectionDialog}
        onClose={() => {
          setShowSelectionDialog(false);
          setMultipleResults([]);
        }}
        sdsDocuments={multipleResults}
        onSaveSelected={handleSaveSelectedSDS}
      />
    </div>
  );
};

export default SDSSearch;
