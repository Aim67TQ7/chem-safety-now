import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Save, X, Download, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SDSDocument {
  id: string;
  product_name: string;
  manufacturer?: string;
  cas_number?: string;
  source_url: string;
  file_name: string;
  document_type: string;
  bucket_url?: string; // Added this property to fix TypeScript errors
  file_size?: number;  // Added this property for completeness
  h_codes?: Array<{ code: string; description: string }>;
  pictograms?: Array<{ ghs_code: string; name: string; description?: string }>;
  signal_word?: string;
  hazard_statements?: string[];
  precautionary_statements?: string[];
  regulatory_notes?: string[];
}

interface SDSSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sdsDocuments: SDSDocument[];
  onSaveSelected: (selectedDoc: SDSDocument, additionalInfo: any) => void;
}

const SDSSelectionDialog = ({ 
  isOpen, 
  onClose, 
  sdsDocuments, 
  onSaveSelected 
}: SDSSelectionDialogProps) => {
  const [selectedDocId, setSelectedDocId] = useState<string>("");
  const [brand, setBrand] = useState("");
  const [productId, setProductId] = useState("");
  const [lotNumber, setLotNumber] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<{[key: string]: 'downloading' | 'completed' | 'error'}>({});
  const { toast } = useToast();

  const selectedDoc = sdsDocuments.find(doc => doc.id === selectedDocId);

  const checkForDuplicateDocument = async (sourceUrl: string, productName: string) => {
    console.log('🔍 Checking for duplicate documents...');
    
    const { data: existingDocs, error } = await supabase
      .from('sds_documents')
      .select('id, product_name, source_url, bucket_url')
      .or(`source_url.eq.${sourceUrl},and(product_name.ilike.%${productName}%,source_url.neq.${sourceUrl})`);
    
    if (error) {
      console.error('Error checking for duplicates:', error);
      return null;
    }
    
    // Check for exact URL match
    const exactMatch = existingDocs?.find(doc => doc.source_url === sourceUrl);
    if (exactMatch) {
      console.log('📋 Found exact duplicate by URL:', exactMatch.id);
      return exactMatch;
    }
    
    // Check for similar product name
    const similarMatch = existingDocs?.find(doc => 
      doc.product_name.toLowerCase().includes(productName.toLowerCase()) ||
      productName.toLowerCase().includes(doc.product_name.toLowerCase())
    );
    
    if (similarMatch) {
      console.log('⚠️ Found potential duplicate by product name:', similarMatch.id);
      return similarMatch;
    }
    
    return null;
  };

  const downloadPDF = async (document: SDSDocument) => {
    if (!document.source_url || downloadStatus[document.id] === 'downloading') {
      return;
    }

    // Check for duplicates before downloading
    const existingDoc = await checkForDuplicateDocument(document.source_url, document.product_name);
    if (existingDoc) {
      toast({
        title: "Duplicate Document Found",
        description: `This document appears to already exist in the system. Using existing version.`,
        variant: "default"
      });
      
      // Return the existing document instead of downloading
      return { ...document, bucket_url: existingDoc.bucket_url, id: existingDoc.id };
    }

    setIsDownloading(true);
    setDownloadStatus(prev => ({ ...prev, [document.id]: 'downloading' }));

    try {
      console.log('🔄 Starting PDF download for:', document.product_name);
      
      const { data, error } = await supabase.functions.invoke('download-sds-pdf', {
        body: {
          document_id: document.id,
          source_url: document.source_url,
          file_name: document.file_name
        }
      });

      if (error) {
        throw new Error(`Download failed: ${error.message}`);
      }

      if (!data.success) {
        throw new Error(data.error || 'Download failed');
      }

      console.log('✅ PDF downloaded successfully:', data.bucket_url);
      
      setDownloadStatus(prev => ({ ...prev, [document.id]: 'completed' }));
      
      // Update the document in our local state with the new bucket URL
      const updatedDoc = { ...document, bucket_url: data.bucket_url, file_size: data.file_size };
      
      toast({
        title: "PDF Downloaded & Processed",
        description: `${document.product_name} PDF has been downloaded and SDS data extraction is in progress.`,
        variant: "default"
      });

      return updatedDoc;

    } catch (error) {
      console.error('❌ PDF download error:', error);
      setDownloadStatus(prev => ({ ...prev, [document.id]: 'error' }));
      
      toast({
        title: "Download Error",
        description: `Failed to download PDF for ${document.product_name}. You can still save the document without the PDF.`,
        variant: "destructive"
      });
      
      return document; // Return original document if download fails
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedDoc) {
      toast({
        title: "Selection Required",
        description: "Please select an SDS document to save.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);

    try {
      // First, try to download the PDF if it doesn't have a bucket_url yet
      let documentToSave = selectedDoc;
      
      if (!selectedDoc.bucket_url && selectedDoc.source_url) {
        toast({
          title: "Downloading PDF",
          description: "Downloading and storing the PDF document...",
          variant: "default"
        });
        
        documentToSave = await downloadPDF(selectedDoc) || selectedDoc;
      }

      const additionalInfo = {
        brand: brand.trim() || null,
        product_id: productId.trim() || null,
        lot_number: lotNumber.trim() || null,
        additional_notes: additionalNotes.trim() || null,
        selected_from_multiple: true,
        total_options: sdsDocuments.length
      };

      // Update the SDS document with additional identification info (if any provided)
      const identifiers = Object.entries(additionalInfo)
        .filter(([_, value]) => value && value !== true && typeof value === 'string')
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');

      if (identifiers) {
        const { error } = await supabase
          .from('sds_documents')
          .update({
            regulatory_notes: [
              ...(documentToSave.regulatory_notes || []),
              `User-provided identifiers: ${identifiers}`
            ]
          })
          .eq('id', documentToSave.id);

        if (error) {
          throw error;
        }
      }

      onSaveSelected(documentToSave, additionalInfo);
      
      toast({
        title: "SDS Saved Successfully",
        description: `${documentToSave.product_name} has been saved${identifiers ? ' with your additional identifiers' : ''}.`,
        variant: "default"
      });

      // Reset form
      setSelectedDocId("");
      setBrand("");
      setProductId("");
      setLotNumber("");
      setAdditionalNotes("");
      setDownloadStatus({});
      onClose();

    } catch (error) {
      console.error('Error saving SDS with identifiers:', error);
      toast({
        title: "Save Error",
        description: "Failed to save the SDS document. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getSignalWordVariant = (signalWord?: string) => {
    if (!signalWord) return 'secondary';
    return signalWord.toLowerCase() === 'danger' ? 'destructive' : 'secondary';
  };

  const getDownloadStatusIcon = (docId: string, hasUrl: boolean) => {
    if (hasUrl) return <CheckCircle className="w-4 h-4 text-green-600" />;
    
    const status = downloadStatus[docId];
    if (status === 'downloading') return <Download className="w-4 h-4 text-blue-600 animate-pulse" />;
    if (status === 'completed') return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (status === 'error') return <X className="w-4 h-4 text-red-600" />;
    
    return null;
  };

  const getPictogramBadges = (pictograms?: Array<{ ghs_code: string; name: string; description?: string }>) => {
    if (!pictograms || pictograms.length === 0) return null;
    
    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {pictograms.slice(0, 4).map((pictogram) => (
          <Badge key={pictogram.ghs_code} variant="outline" className="text-xs bg-yellow-50 border-yellow-200">
            {pictogram.name}
          </Badge>
        ))}
        {pictograms.length > 4 && (
          <Badge variant="outline" className="text-xs">
            +{pictograms.length - 4} more
          </Badge>
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Select and Identify SDS Document</span>
          </DialogTitle>
          <DialogDescription>
            Multiple SDS documents were found. Please select the correct one and provide additional identifiers to ensure accuracy.
            {isDownloading && " PDF is being downloaded and processed..."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* SDS Selection */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Available SDS Documents ({sdsDocuments.length})</Label>
            <div className="grid gap-3 max-h-60 overflow-y-auto">
              {sdsDocuments.map((doc) => (
                <Card 
                  key={doc.id} 
                  className={`p-4 cursor-pointer transition-colors ${
                    selectedDocId === doc.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedDocId(doc.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-medium text-gray-900">{doc.product_name}</h4>
                        {doc.signal_word && (
                          <Badge variant={getSignalWordVariant(doc.signal_word)} className="text-xs">
                            {doc.signal_word}
                          </Badge>
                        )}
                        {doc.document_type && doc.document_type !== 'safety_data_sheet' && (
                          <Badge variant="outline" className="text-xs">
                            {doc.document_type.replace(/_/g, ' ')}
                          </Badge>
                        )}
                        {getDownloadStatusIcon(doc.id, !!doc.bucket_url)}
                      </div>
                      
                      <div className="space-y-1 text-sm text-gray-600">
                        {doc.manufacturer && (
                          <p><strong>Manufacturer:</strong> {doc.manufacturer}</p>
                        )}
                        {doc.cas_number && (
                          <p><strong>CAS Number:</strong> {doc.cas_number}</p>
                        )}
                        <p><strong>Source:</strong> {new URL(doc.source_url).hostname}</p>
                        {doc.bucket_url && (
                          <p className="text-green-600"><strong>Status:</strong> PDF stored locally</p>
                        )}
                      </div>

                      {/* Enhanced Hazard Information Display */}
                      {doc.h_codes && doc.h_codes.length > 0 && (
                        <div className="mt-2">
                          <div className="flex flex-wrap gap-1">
                            {doc.h_codes.slice(0, 3).map((hCode) => (
                              <Badge key={hCode.code} variant="outline" className="text-xs bg-red-50 border-red-200" title={hCode.description}>
                                {hCode.code}
                              </Badge>
                            ))}
                            {doc.h_codes.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{doc.h_codes.length - 3} more H-codes
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Pictogram Display */}
                      {getPictogramBadges(doc.pictograms)}
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="selectedSDS"
                        checked={selectedDocId === doc.id}
                        onChange={() => setSelectedDocId(doc.id)}
                        className="w-4 h-4 text-blue-600"
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Additional Identifiers Form */}
          <div className="space-y-4 border-t pt-6">
            <Label className="text-base font-semibold">Additional Identifiers</Label>
            <p className="text-sm text-gray-600">
              Provide additional information to help identify the correct SDS document for your specific product.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand">Brand/Trade Name</Label>
                <Input
                  id="brand"
                  placeholder="e.g., 3M, DuPont, BASF"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="productId">Product/Part Number</Label>
                <Input
                  id="productId"
                  placeholder="e.g., ABC-123, SKU-456"
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lotNumber">Lot/Batch Number</Label>
                <Input
                  id="lotNumber"
                  placeholder="e.g., LOT2024001"
                  value={lotNumber}
                  onChange={(e) => setLotNumber(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="additionalNotes">Additional Notes (Optional)</Label>
              <Textarea
                id="additionalNotes"
                placeholder="Any other identifying information or notes about this product..."
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 border-t pt-6">
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!selectedDocId || isSaving || isDownloading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : isDownloading ? 'Processing...' : 'Save Selected SDS'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SDSSelectionDialog;
