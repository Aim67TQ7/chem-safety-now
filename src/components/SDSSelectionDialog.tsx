
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SDSSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sdsDocuments: any[];
  onSaveSelected: (selectedDoc: any) => void;
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
}

const SDSSelectionDialog = ({ isOpen, onClose, sdsDocuments, onSaveSelected }: SDSSelectionDialogProps) => {
  const [selectedDocument, setSelectedDocument] = useState<SDSDocument | null>(null);

  const handleSave = () => {
    if (selectedDocument) {
      onSaveSelected(selectedDocument);
      onClose();
      setSelectedDocument(null);
    }
  };

  const getConfidenceBadgeVariant = (score?: number) => {
    if (!score) return 'secondary';
    if (score >= 0.9) return 'default';
    if (score >= 0.7) return 'secondary';
    return 'destructive';
  };

  const getConfidenceColor = (score?: number) => {
    if (!score) return 'text-gray-500';
    if (score >= 0.9) return 'text-green-600';
    if (score >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select the Correct SDS Document</DialogTitle>
          <DialogDescription>
            Multiple safety data sheets were found. Please select the correct one.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-gray-600 mb-4">
            Found {sdsDocuments.length} potential matches. Documents are ranked by confidence score.
          </div>
          
          {sdsDocuments.map((doc) => (
            <Card 
              key={doc.id} 
              className={`p-4 cursor-pointer transition-all ${
                selectedDocument?.id === doc.id 
                  ? 'ring-2 ring-blue-500 bg-blue-50' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => setSelectedDocument(doc)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <input
                      type="radio"
                      checked={selectedDocument?.id === doc.id}
                      onChange={() => setSelectedDocument(doc)}
                      className="mt-1"
                    />
                    <h4 className="text-lg font-semibold text-gray-900">
                      {doc.product_name}
                    </h4>
                    
                    {/* Confidence Score Badge */}
                    {doc.confidence?.score && (
                      <Badge 
                        variant={getConfidenceBadgeVariant(doc.confidence.score)}
                        className="text-xs font-medium"
                      >
                        {(doc.confidence.score * 100).toFixed(1)}% match
                      </Badge>
                    )}
                    
                    {doc.signal_word && (
                      <Badge 
                        variant={doc.signal_word.toLowerCase() === 'danger' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {doc.signal_word}
                      </Badge>
                    )}
                  </div>

                  {/* Match Reasons */}
                  {doc.confidence?.reasons && doc.confidence.reasons.length > 0 && (
                    <div className="mb-2">
                      <span className={`text-xs font-medium ${getConfidenceColor(doc.confidence.score)}`}>
                        Matched on: {doc.confidence.reasons.join(', ')}
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      {doc.manufacturer && (
                        <p><strong>Manufacturer:</strong> {doc.manufacturer}</p>
                      )}
                      {doc.cas_number && (
                        <p><strong>CAS Number:</strong> {doc.cas_number}</p>
                      )}
                      {doc.source_url && (
                        <p><strong>Source:</strong> {new URL(doc.source_url).hostname}</p>
                      )}
                    </div>
                    <div>
                      {doc.h_codes && doc.h_codes.length > 0 && (
                        <div>
                          <strong>Hazard Codes ({doc.h_codes.length}):</strong>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {doc.h_codes.slice(0, 3).map((hCode) => (
                              <Badge key={hCode.code} variant="outline" className="text-xs">
                                {hCode.code}
                              </Badge>
                            ))}
                            {doc.h_codes.length > 3 && (
                              <span className="text-xs text-gray-500">+{doc.h_codes.length - 3} more</span>
                            )}
                          </div>
                        </div>
                      )}
                      {doc.pictograms && doc.pictograms.length > 0 && (
                        <div className="mt-2">
                          <strong>Pictograms:</strong>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {doc.pictograms.slice(0, 3).map((pictogram) => (
                              <Badge key={pictogram.ghs_code} variant="secondary" className="text-xs">
                                {pictogram.name}
                              </Badge>
                            ))}
                            {doc.pictograms.length > 3 && (
                              <span className="text-xs text-gray-500">+{doc.pictograms.length - 3} more</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={!selectedDocument}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SDSSelectionDialog;
