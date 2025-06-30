
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, FileText, Printer, Eye, AlertCircle } from "lucide-react";
import LabelPrinterPopup from './popups/LabelPrinterPopup';
import SDSViewerPopup from './popups/SDSViewerPopup';
import { extractEnhancedSDSData } from './utils/enhancedSdsDataExtractor';

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
  hmis_codes?: any;
  h_codes?: any[];
  pictograms?: string[];
  signal_word?: string;
  cas_number?: string;
}

interface SDSDocumentSelectorProps {
  facilityId: string;
}

const SDSDocumentSelector = ({ facilityId }: SDSDocumentSelectorProps) => {
  const [documents, setDocuments] = useState<SDSDocument[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<SDSDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDocument, setSelectedDocument] = useState<SDSDocument | null>(null);
  const [showLabelPrinter, setShowLabelPrinter] = useState(false);
  const [showViewer, setShowViewer] = useState(false);

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
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load SDS documents');
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

  const handlePrintLabel = (document: SDSDocument) => {
    setSelectedDocument(document);
    setShowLabelPrinter(true);
  };

  const handleViewDocument = (document: SDSDocument) => {
    setSelectedDocument(document);
    setShowViewer(true);
  };

  const getExtractionStatusBadge = (status: string, confidence: number) => {
    if (status === 'osha_compliant') {
      return <Badge className="bg-green-100 text-green-800">OSHA Compliant</Badge>;
    } else if (status === 'manual_review_required') {
      return <Badge className="bg-yellow-100 text-yellow-800">Review Required</Badge>;
    } else if (confidence >= 80) {
      return <Badge className="bg-blue-100 text-blue-800">High Confidence</Badge>;
    } else if (confidence >= 50) {
      return <Badge className="bg-orange-100 text-orange-800">Medium Confidence</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800">Low Confidence</Badge>;
    }
  };

  const extractedData = selectedDocument ? extractEnhancedSDSData(selectedDocument) : {};

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Printer className="w-5 h-5" />
            SDS Label Printer
          </CardTitle>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search SDS documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Badge variant="outline">
              {filteredDocuments.length} documents
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm ? 'No documents found' : 'No SDS documents available'}
              </h3>
              <p className="text-gray-600">
                {searchTerm 
                  ? `No documents match "${searchTerm}"`
                  : 'SDS documents will appear here once they are found via search.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredDocuments.map((document) => (
                <div key={document.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium truncate">{document.product_name}</h4>
                      {getExtractionStatusBadge(document.extraction_status, document.ai_extraction_confidence)}
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>Manufacturer: {document.manufacturer || 'Not specified'}</div>
                      <div>Quality: {document.extraction_quality_score || 0}/100 | Confidence: {document.ai_extraction_confidence || 0}%</div>
                      <div>Added: {new Date(document.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDocument(document)}
                      className="flex items-center gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handlePrintLabel(document)}
                      className="flex items-center gap-1 bg-green-600 hover:bg-green-700"
                    >
                      <Printer className="h-4 w-4" />
                      Print Label
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Label Printer Popup */}
      <LabelPrinterPopup
        isOpen={showLabelPrinter}
        onClose={() => setShowLabelPrinter(false)}
        selectedDocument={selectedDocument}
        initialProductName={extractedData.productName}
        initialManufacturer={extractedData.manufacturer}
      />

      {/* SDS Viewer Popup */}
      <SDSViewerPopup
        isOpen={showViewer}
        onClose={() => setShowViewer(false)}
        sdsDocument={selectedDocument}
      />
    </>
  );
};

export default SDSDocumentSelector;
