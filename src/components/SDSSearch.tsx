
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Bot, Printer, Download, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import AIAssistantPopup from "@/components/popups/AIAssistantPopup";
import LabelPrinterPopup from "@/components/popups/LabelPrinterPopup";
import { interactionLogger } from "@/services/interactionLogger";

interface SDSSearchProps {
  facilityData: any;
}

const SDSSearch = ({ facilityData }: SDSSearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showLabelPrinter, setShowLabelPrinter] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
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
      // Simulate search results
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockResults = [
        {
          id: '1',
          product_name: searchQuery,
          manufacturer: 'Sample Manufacturer',
          cas_number: '67-64-1',
          signal_word: 'Danger',
          h_codes: ['H225', 'H319', 'H336'],
          pictograms: ['flame', 'exclamation'],
          file_name: `${searchQuery}_SDS.pdf`,
          created_at: new Date().toISOString()
        }
      ];
      
      setSearchResults(mockResults);
      
      await interactionLogger.logFacilityUsage({
        eventType: 'sds_search_completed',
        eventDetail: {
          searchQuery: searchQuery.trim(),
          resultsCount: mockResults.length
        }
      });

    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Error",
        description: "Unable to search SDS documents. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDocument = async (document: any) => {
    await interactionLogger.logSDSInteraction({
      sdsDocumentId: document.id,
      actionType: 'view',
      searchQuery: searchQuery
    });

    toast({
      title: "SDS Document",
      description: `Viewing ${document.product_name} SDS document.`
    });
  };

  const handleDownloadDocument = async (document: any) => {
    await interactionLogger.logSDSInteraction({
      sdsDocumentId: document.id,
      actionType: 'download',
      searchQuery: searchQuery
    });

    toast({
      title: "Download Started",
      description: `Downloading ${document.product_name} SDS document.`
    });
  };

  const handleGenerateLabel = async (document: any) => {
    setSelectedDocument(document);
    setShowLabelPrinter(true);
    
    await interactionLogger.logSDSInteraction({
      sdsDocumentId: document.id,
      actionType: 'generate_label',
      searchQuery: searchQuery
    });
  };

  const handleAskAI = async (document: any) => {
    setShowAIAssistant(true);
    
    await interactionLogger.logSDSInteraction({
      sdsDocumentId: document.id,
      actionType: 'ask_ai',
      searchQuery: searchQuery
    });
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
                        variant={document.signal_word === 'Danger' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {document.signal_word}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <p><strong>Manufacturer:</strong> {document.manufacturer}</p>
                    {document.cas_number && (
                      <p><strong>CAS Number:</strong> {document.cas_number}</p>
                    )}
                    {document.h_codes?.length > 0 && (
                      <div>
                        <strong>Hazard Codes:</strong>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {document.h_codes.map((code: string) => (
                            <Badge key={code} variant="outline" className="text-xs">
                              {code}
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
