import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Save, X } from "lucide-react";
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
  h_codes?: Array<{ code: string; description: string }>;
  pictograms?: Array<{ ghs_code: string; name: string; description?: string }>;
  signal_word?: string;
  hazard_statements?: string[];
  precautionary_statements?: string[];
  regulatory_notes?: string[]; // Added missing property
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
  const { toast } = useToast();

  const selectedDoc = sdsDocuments.find(doc => doc.id === selectedDocId);

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
              ...(selectedDoc.regulatory_notes || []),
              `User-provided identifiers: ${identifiers}`
            ]
          })
          .eq('id', selectedDoc.id);

        if (error) {
          throw error;
        }
      }

      onSaveSelected(selectedDoc, additionalInfo);
      
      toast({
        title: "SDS Saved Successfully",
        description: `${selectedDoc.product_name} has been saved${identifiers ? ' with your additional identifiers' : ''}.`,
        variant: "default"
      });

      // Reset form
      setSelectedDocId("");
      setBrand("");
      setProductId("");
      setLotNumber("");
      setAdditionalNotes("");
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
                      </div>
                      
                      <div className="space-y-1 text-sm text-gray-600">
                        {doc.manufacturer && (
                          <p><strong>Manufacturer:</strong> {doc.manufacturer}</p>
                        )}
                        {doc.cas_number && (
                          <p><strong>CAS Number:</strong> {doc.cas_number}</p>
                        )}
                        <p><strong>Source:</strong> {new URL(doc.source_url).hostname}</p>
                      </div>

                      {doc.h_codes && doc.h_codes.length > 0 && (
                        <div className="mt-2">
                          <div className="flex flex-wrap gap-1">
                            {doc.h_codes.slice(0, 3).map((hCode) => (
                              <Badge key={hCode.code} variant="outline" className="text-xs">
                                {hCode.code}
                              </Badge>
                            ))}
                            {doc.h_codes.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{doc.h_codes.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
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
              disabled={!selectedDocId || isSaving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Selected SDS'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SDSSelectionDialog;
