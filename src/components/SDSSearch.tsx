
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Bot, Printer, Download, FileText, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AIAssistantPopup from "@/components/popups/AIAssistantPopup";
import LabelPrinterPopup from "@/components/popups/LabelPrinterPopup";
import { interactionLogger } from "@/services/interactionLogger";

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

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-backend-url.com' 
  : 'http://localhost:5000';

const SDSSearch = ({ facilityData }: SDSSearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SDSDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showLabelPrinter, setShowLabelPrinter] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<SDSDocument | null>(null);
  const { toast } = useToast();

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
      const response = await fetch(`${API_BASE_URL}/api/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_name: searchQuery.trim(),
          max_results: 10
        })
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle immediate results or job-based results
      if (data.results) {
        // Immediate results
        setSearchResults(Array.isArray(data.results) ? data.results : [data.results]);
      } else if (data.job_id) {
        // Job-based processing - poll for results
        await pollJobResults(data.job_id);
      } else {
        // Fallback to documents list
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
      console.error('Search error:', error);
      
      // Fallback to searching existing documents
      try {
        await fetchAllDocuments();
        toast({
          title: "Search Notice",
          description: "Showing existing documents. New document processing may be unavailable.",
          variant: "default"
        });
      } catch (fallbackError) {
        console.error('Fallback search error:', fallbackError);
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
    const response = await fetch(`${API_BASE_URL}/api/documents`);
    if (!response.ok) {
      throw new Error(`Failed to fetch documents: ${response.status}`);
    }
    const documents = await response.json();
    
    // Filter documents by search query if provided
    const filteredDocuments = searchQuery.trim() 
      ? documents.filter((doc: SDSDocument) => 
          doc.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (doc.manufacturer && doc.manufacturer.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (doc.cas_number && doc.cas_number.includes(searchQuery))
        )
      : documents;
    
    setSearchResults(filteredDocuments);
  };

  const pollJobResults = async (jobId: string) => {
    const maxAttempts = 30; // 30 seconds max
    let attempts = 0;

    const poll = async (): Promise<void> => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/jobs/${jobId}/status`);
        if (!response.ok) throw new Error('Job status check failed');
        
        const jobStatus = await response.json();
        
        if (jobStatus.status === 'completed' && jobStatus.results) {
          setSearchResults(Array.isArray(jobStatus.results) ? jobStatus.results : [jobStatus.results]);
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
        console.error('Job polling error:', error);
        // Fallback to document list
        await fetchAllDocuments();
      }
    };

    await poll();
  };

  const handleViewDocument = async (document: SDSDocument) => {
    await interactionLogger.logSDSInteraction({
      sdsDocumentId: document.id,
      actionType: 'view',
      searchQuery: searchQuery
    });

    if (document.bucket_url) {
      window.open(document.bucket_url, '_blank');
    } else if (document.source_url) {
      window.open(document.source_url, '_blank');
    } else {
      toast({
        title: "Document Unavailable",
        description: "PDF document is not available for viewing.",
        variant: "destructive"
      });
    }
  };

  const handleDownloadDocument = async (document: SDSDocument) => {
    await interactionLogger.logSDSInteraction({
      sdsDocumentId: document.id,
      actionType: 'download',
      searchQuery: searchQuery
    });

    if (document.bucket_url) {
      try {
        const response = await fetch(document.bucket_url);
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = document.file_name || `${document.product_name}_SDS.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          
          toast({
            title: "Download Started",
            description: `Downloading ${document.product_name} SDS document.`
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

  const handleGenerateLabel = async (document: SDSDocument) => {
    setSelectedDocument(document);
    setShowLabelPrinter(true);
    
    await interactionLogger.logSDSInteraction({
      sdsDocumentId: document.id,
      actionType: 'generate_label',
      searchQuery: searchQuery
    });
  };

  const handleAskAI = async (document: SDSDocument) => {
    setShowAIAssistant(true);
    
    await interactionLogger.logSDSInteraction({
      sdsDocumentId: document.id,
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
              disabled={!searchQuery.trim() || isLoading}
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
          
          {searchResults.map((document) => (
            <Card key={document.id} className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="text-lg font-semibold text-gray-900">
                      {document.product_name}
                    </h4>
                    {document.signal_word && (
                      <Badge 
                        variant={getSignalWordVariant(document.signal_word)}
                        className="text-xs"
                      >
                        {document.signal_word}
                      </Badge>
                    )}
                    {document.document_type && document.document_type !== 'safety_data_sheet' && (
                      <Badge variant="outline" className="text-xs">
                        {document.document_type.replace(/_/g, ' ')}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    {document.manufacturer && (
                      <p><strong>Manufacturer:</strong> {document.manufacturer}</p>
                    )}
                    {document.cas_number && (
                      <p><strong>CAS Number:</strong> {document.cas_number}</p>
                    )}
                    {document.h_codes && document.h_codes.length > 0 && (
                      <div>
                        <strong>Hazard Codes:</strong>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {document.h_codes.slice(0, 5).map((hCode) => (
                            <Badge key={hCode.code} variant="outline" className="text-xs" title={hCode.description}>
                              {hCode.code}
                            </Badge>
                          ))}
                          {document.h_codes.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{document.h_codes.length - 5} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                    {document.pictograms && document.pictograms.length > 0 && (
                      <div>
                        <strong>Pictograms:</strong>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {document.pictograms.map((pictogram) => (
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
                    onClick={() => handleViewDocument(document)}
                    className="w-full"
                  >
                    <FileText className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownloadDocument(document)}
                    className="w-full"
                    disabled={!document.bucket_url}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleGenerateLabel(document)}
                    className="w-full"
                  >
                    <Printer className="w-4 h-4 mr-1" />
                    Label
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAskAI(document)}
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
