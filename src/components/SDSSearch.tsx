import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Bot, Printer, Download, FileText, ExternalLink, AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AIAssistantPopup from "@/components/popups/AIAssistantPopup";
import LabelPrinterPopup from "@/components/popups/LabelPrinterPopup";
import { interactionLogger } from "@/services/interactionLogger";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

interface SDSSearchProps {
  facilityData: any;
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
}

const API_BASE_URL = 'https://cheerful-fascination.railway.app';

const SDSSearch = ({ facilityData }: SDSSearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SDSDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showLabelPrinter, setShowLabelPrinter] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<SDSDocument | null>(null);
  const [backendHealth, setBackendHealth] = useState<'checking' | 'healthy' | 'unhealthy'>('checking');
  const [connectionError, setConnectionError] = useState<string>('');
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
        
        toast({
          title: "Backend Connected",
          description: "Successfully connected to Supabase Edge Functions.",
          variant: "default"
        });
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
        // Immediate results
        const results = Array.isArray(data.results) ? data.results : [data.results];
        console.log('✅ Setting immediate search results:', results);
        setSearchResults(results);
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
          resultsCount: searchResults.length
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

  return (
    <div className="space-y-6">
      {/* Backend Health Status */}
      {backendHealth !== 'healthy' && (
        <Alert variant={backendHealth === 'unhealthy' ? 'destructive' : 'default'}>
          {backendHealth === 'checking' ? (
            <Search className="h-4 w-4 animate-spin" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription className="flex items-center justify-between w-full">
            <div>
              {backendHealth === 'checking' 
                ? 'Checking Supabase connection...' 
                : `Supabase connection failed: ${connectionError || 'Unknown error'}`}
            </div>
            {backendHealth === 'unhealthy' && (
              <Button
                size="sm"
                variant="outline"
                onClick={checkBackendHealth}
                className="ml-4 flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Retry</span>
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {backendHealth === 'healthy' && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Supabase connected successfully. Search functionality is available.
          </AlertDescription>
        </Alert>
      )}

      {/* Search Header */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Safety Data Sheet Search
            </h2>
            <p className="text-sm text-gray-600">
              Search for chemical safety information and generate compliance labels
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

          <div className="flex space-x-3">
            <Button 
              variant="outline"
              onClick={() => setShowAIAssistant(true)}
              className="flex items-center space-x-2"
            >
              <Bot className="w-4 h-4" />
              <span>Ask AI Assistant</span>
            </Button>
            <Button 
              variant="outline"
              onClick={() => setShowLabelPrinter(true)}
              className="flex items-center space-x-2"
            >
              <Printer className="w-4 h-4" />
              <span>Create Label</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Search Results ({searchResults.length})
          </h3>
          
          {searchResults.map((sdsDocument) => (
            <Card key={sdsDocument.id} className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="text-lg font-semibold text-gray-900">
                      {sdsDocument.product_name}
                    </h4>
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
                  >
                    <Printer className="w-4 h-4 mr-1" />
                    Label
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAskAI(sdsDocument)}
                    className="w-full"
                  >
                    <Bot className="w-4 h-4 mr-1" />
                    Ask AI
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
        onClose={() => setShowAIAssistant(false)}
        facilityData={facilityData}
      />

      <LabelPrinterPopup
        isOpen={showLabelPrinter}
        onClose={() => setShowLabelPrinter(false)}
        initialProductName={selectedDocument?.product_name}
        initialManufacturer={selectedDocument?.manufacturer}
      />
    </div>
  );
};

export default SDSSearch;
