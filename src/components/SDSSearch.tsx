
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Eye, Download, MessageSquare, Tag } from "lucide-react";
import { interactionLogger } from "@/services/interactionLogger";
import AIAssistantPopup from "./popups/AIAssistantPopup";
import LabelPrinterPopup from "./popups/LabelPrinterPopup";
import { useParams } from "react-router-dom";

// Mock data - replace with actual API calls
interface SDSDocument {
  id: string;
  productName: string;
  manufacturer: string;
  lastUpdated: string;
  hazardCodes: string[];
  fileType: string;
  fileName: string;
}

const mockSDSDocuments: SDSDocument[] = [
  {
    id: "sds-1",
    productName: "Acetone",
    manufacturer: "Sigma-Aldrich",
    lastUpdated: "2023-01-01",
    hazardCodes: ["H225", "H319", "H336"],
    fileType: "pdf",
    fileName: "acetone_sds.pdf"
  },
  {
    id: "sds-2",
    productName: "Ethanol",
    manufacturer: "Fisher Scientific",
    lastUpdated: "2023-02-15",
    hazardCodes: ["H225", "H319"],
    fileType: "pdf",
    fileName: "ethanol_sds.pdf"
  },
  {
    id: "sds-3",
    productName: "Methanol",
    manufacturer: "Honeywell",
    lastUpdated: "2023-03-20",
    hazardCodes: ["H225", "H301", "H311", "H331", "H370"],
    fileType: "pdf",
    fileName: "methanol_sds.pdf"
  }
];

export const SDSSearch = () => {
  const { facilitySlug } = useParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SDSDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<SDSDocument | null>(null);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showLabelPrinter, setShowLabelPrinter] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    
    // Log search initiation
    await interactionLogger.logFacilityUsage({
      eventType: 'sds_search_initiated',
      eventDetail: { 
        searchQuery,
        facilityName: "Bunting Magnetics" // This could be dynamic
      },
      facilitySlug
    });

    // Simulate API call
    setTimeout(async () => {
      const results = mockSDSDocuments.filter(doc => 
        doc.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.manufacturer.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      setSearchResults(results);
      setIsLoading(false);
      
      // Log search completion
      await interactionLogger.logFacilityUsage({
        eventType: 'sds_search_completed',
        eventDetail: { 
          searchQuery,
          resultsCount: results.length 
        },
        facilitySlug
      });
    }, 1000);
  };

  const handleViewDocument = async (document: SDSDocument) => {
    setSelectedDocument(document);
    
    // Log SDS interaction
    await interactionLogger.logSDSInteraction({
      sdsDocumentId: document.id,
      actionType: 'view',
      searchQuery,
      facilitySlug
    });
  };

  const handleDownload = async (document: SDSDocument) => {
    // Log download interaction
    await interactionLogger.logSDSInteraction({
      sdsDocumentId: document.id,
      actionType: 'download',
      searchQuery,
      facilitySlug
    });
    
    // Simulate download
    console.log('Downloading document:', document.fileName);
  };

  const handleAskAI = (document: SDSDocument) => {
    setSelectedDocument(document);
    setShowAIAssistant(true);
  };

  const handleGenerateLabel = (document: SDSDocument) => {
    setSelectedDocument(document);
    setShowLabelPrinter(true);
  };

  return (
    <>
      {selectedDocument && showAIAssistant && (
        <AIAssistantPopup
          isOpen={showAIAssistant}
          onClose={() => setShowAIAssistant(false)}
          document={selectedDocument}
        />
      )}

      {selectedDocument && showLabelPrinter && (
        <LabelPrinterPopup
          isOpen={showLabelPrinter}
          onClose={() => setShowLabelPrinter(false)}
          document={selectedDocument}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>SDS Document Search</CardTitle>
          <CardDescription>Search for Safety Data Sheets</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              type="text"
              placeholder="Search by product name or manufacturer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button onClick={handleSearch} disabled={isLoading}>
              {isLoading ? "Searching..." : <><Search className="mr-2 h-4 w-4" /> Search</>}
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {searchResults.map((document) => (
                <Card key={document.id}>
                  <CardHeader>
                    <CardTitle>{document.productName}</CardTitle>
                    <CardDescription>{document.manufacturer}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      Last Updated: {document.lastUpdated}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {document.hazardCodes.map((code, index) => (
                        <Badge key={index}>{code}</Badge>
                      ))}
                    </div>
                    <div className="flex justify-end space-x-2 mt-4">
                      <Button variant="outline" size="sm" onClick={() => handleViewDocument(document)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDownload(document)}>
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleAskAI(document)}>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Ask AI
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleGenerateLabel(document)}>
                        <Tag className="mr-2 h-4 w-4" />
                        Label
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {searchQuery.trim() !== '' && searchResults.length === 0 && !isLoading && (
            <div className="text-center text-muted-foreground">
              No results found for "{searchQuery}".
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};
