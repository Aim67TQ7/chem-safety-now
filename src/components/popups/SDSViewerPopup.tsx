import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Printer, Bot, ExternalLink, FileText, AlertCircle, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import PDFViewerPopup from "./PDFViewerPopup";

interface SDSViewerPopupProps {
  isOpen: boolean;
  onClose: () => void;
  sdsDocument: any;
  onGenerateLabel?: (document: any) => void;
  onAskAI?: (document: any) => void;
}

const SDSViewerPopup = ({ 
  isOpen, 
  onClose, 
  sdsDocument,
  onGenerateLabel,
  onAskAI
}: SDSViewerPopupProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const { toast } = useToast();

  if (!sdsDocument) return null;

  const handleViewPDF = () => {
    setShowPDFViewer(true);
  };

  const handleViewOriginal = () => {
    const pdfUrl = getPDFUrl();
    if (pdfUrl) {
      window.open(pdfUrl, '_blank');
    } else {
      toast({
        title: "Document Unavailable",
        description: "PDF document is not available for viewing.",
        variant: "destructive"
      });
    }
  };

  const getPDFUrl = () => {
    // If we have a bucket_url, generate the public URL from Supabase storage
    if (sdsDocument.bucket_url) {
      const { data } = supabase.storage
        .from('sds-documents')
        .getPublicUrl(sdsDocument.bucket_url.replace('sds-documents/', ''));
      return data.publicUrl;
    }
    // Fallback to source_url if no bucket_url
    return sdsDocument.source_url;
  };

  const getSignalWordVariant = (signalWord?: string) => {
    if (!signalWord) return 'secondary';
    return signalWord.toLowerCase() === 'danger' ? 'destructive' : 'secondary';
  };

  const getPictogramImage = (pictogramCode: string) => {
    const pictogramImages: Record<string, string> = {
      'skull_crossbones': '/lovable-uploads/908b3ab5-a4ce-4a8d-a700-8eba7f9f0533.png',
      'flame': '/lovable-uploads/906a5858-4278-496a-b72f-849e51561f57.png',
      'flame_over_circle': '/lovable-uploads/9ec62de0-3471-44e9-9981-e1ddff927939.png',
      'exclamation': '/lovable-uploads/833367f7-138f-4e1f-b4c6-2bfdfd6901b3.png',
      'health_hazard': '/lovable-uploads/7cbd0a20-15f0-43f7-9877-126cab0c631c.png',
      'gas_cylinder': '/lovable-uploads/56985d36-8ad8-4521-a737-19d7eb00ceab.png',
      'corrosion': '/lovable-uploads/54ad4b94-8ebd-4158-aaf2-03ef75373444.png',
      'exploding_bomb': '/lovable-uploads/5146a1d1-bc42-4a39-ae55-cf61a2dc012f.png',
      'environment': '/lovable-uploads/4c13f8f5-8a47-4c2d-a5ed-90cdf7a521c0.png'
    };
    return pictogramImages[pictogramCode];
  };

  const renderPictograms = () => {
    if (!sdsDocument.pictograms || sdsDocument.pictograms.length === 0) {
      return <p className="text-sm text-gray-500">No pictograms detected</p>;
    }

    return (
      <div className="flex flex-wrap gap-3">
        {sdsDocument.pictograms.map((pictogram: any, index: number) => {
          const pictogramCode = typeof pictogram === 'string' ? pictogram : pictogram.ghs_code;
          const pictogramName = typeof pictogram === 'string' ? pictogram : pictogram.name;
          const imageUrl = getPictogramImage(pictogramCode);
          
          return (
            <div key={index} className="flex flex-col items-center space-y-1">
              {imageUrl ? (
                <img 
                  src={imageUrl} 
                  alt={`GHS ${pictogramName || pictogramCode}`}
                  className="w-12 h-12 object-contain"
                />
              ) : (
                <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                  <span className="text-xs text-gray-500">GHS</span>
                </div>
              )}
              <Badge variant="secondary" className="text-xs">
                {pictogramName || pictogramCode}
              </Badge>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl w-[90vw] h-[85vh] overflow-hidden flex flex-col p-0">
          <DialogTitle className="sr-only">
            SDS Document Viewer - {sdsDocument.product_name}
          </DialogTitle>
          
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-2">{sdsDocument.product_name}</h2>
                <div className="flex items-center space-x-3 mb-3">
                  {sdsDocument.manufacturer && (
                    <Badge variant="secondary" className="bg-white/20 text-white">
                      {sdsDocument.manufacturer}
                    </Badge>
                  )}
                  {sdsDocument.signal_word && (
                    <Badge 
                      variant={getSignalWordVariant(sdsDocument.signal_word)}
                      className="bg-white/20 text-white"
                    >
                      {sdsDocument.signal_word}
                    </Badge>
                  )}
                  {sdsDocument.document_type && (
                    <Badge variant="outline" className="bg-white/20 text-white border-white/30">
                      {sdsDocument.document_type.replace(/_/g, ' ')}
                    </Badge>
                  )}
                </div>
                
                {/* Quick Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={handleViewPDF}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                    disabled={!getPDFUrl()}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View PDF
                  </Button>

                  {onGenerateLabel && (
                    <Button
                      size="sm"
                      onClick={() => onGenerateLabel(sdsDocument)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Printer className="w-4 h-4 mr-2" />
                      Generate Label
                    </Button>
                  )}
                  
                  {onAskAI && (
                    <Button
                      size="sm"
                      onClick={() => onAskAI(sdsDocument)}
                      className="bg-blue-700 hover:bg-blue-800 text-white"
                    >
                      <Bot className="w-4 h-4 mr-2" />
                      Ask Stanley
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleViewOriginal}
                    className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open Original
                  </Button>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/20 h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Product Information</h3>
                
                {sdsDocument.cas_number && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">CAS Number</label>
                    <p className="text-sm text-gray-900">{sdsDocument.cas_number}</p>
                  </div>
                )}
                
                {sdsDocument.preparation_date && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Preparation Date</label>
                    <p className="text-sm text-gray-900">{new Date(sdsDocument.preparation_date).toLocaleDateString()}</p>
                  </div>
                )}
                
                {sdsDocument.revision_date && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Revision Date</label>
                    <p className="text-sm text-gray-900">{new Date(sdsDocument.revision_date).toLocaleDateString()}</p>
                  </div>
                )}
                
                {sdsDocument.file_size && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">File Size</label>
                    <p className="text-sm text-gray-900">{Math.round(sdsDocument.file_size / 1024)} KB</p>
                  </div>
                )}
              </div>
              
              {/* HMIS/NFPA Ratings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Safety Ratings</h3>
                
                {sdsDocument.hmis_codes && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">HMIS Codes</label>
                    <div className="flex space-x-4 mt-1">
                      <span className="text-sm bg-blue-100 px-2 py-1 rounded">
                        Health: {sdsDocument.hmis_codes.health || 'N/A'}
                      </span>
                      <span className="text-sm bg-red-100 px-2 py-1 rounded">
                        Flammability: {sdsDocument.hmis_codes.flammability || 'N/A'}
                      </span>
                      <span className="text-sm bg-yellow-100 px-2 py-1 rounded">
                        Physical: {sdsDocument.hmis_codes.physical || 'N/A'}
                      </span>
                    </div>
                  </div>
                )}
                
                {sdsDocument.nfpa_codes && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">NFPA Codes</label>
                    <div className="flex space-x-4 mt-1">
                      <span className="text-sm bg-blue-100 px-2 py-1 rounded">
                        Health: {sdsDocument.nfpa_codes.health || 'N/A'}
                      </span>
                      <span className="text-sm bg-red-100 px-2 py-1 rounded">
                        Flammability: {sdsDocument.nfpa_codes.flammability || 'N/A'}
                      </span>
                      <span className="text-sm bg-yellow-100 px-2 py-1 rounded">
                        Instability: {sdsDocument.nfpa_codes.instability || 'N/A'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Hazard Information */}
            {(sdsDocument.h_codes?.length > 0 || sdsDocument.pictograms?.length > 0) && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Hazard Information</h3>
                
                {sdsDocument.h_codes?.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 mb-2 block">Hazard Codes</label>
                    <div className="flex flex-wrap gap-2">
                      {sdsDocument.h_codes.map((hCode: any, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs" title={hCode.description}>
                          {hCode.code}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {sdsDocument.pictograms?.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 mb-2 block">GHS Pictograms</label>
                    {renderPictograms()}
                  </div>
                )}
              </div>
            )}
            
            {/* Hazard Statements */}
            {(sdsDocument.hazard_statements?.length > 0 || sdsDocument.precautionary_statements?.length > 0) && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Safety Statements</h3>
                
                {sdsDocument.hazard_statements?.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 mb-2 block">Hazard Statements</label>
                    <ul className="list-disc list-inside space-y-1">
                      {sdsDocument.hazard_statements.slice(0, 5).map((statement: string, index: number) => (
                        <li key={index} className="text-sm text-gray-700">{statement}</li>
                      ))}
                      {sdsDocument.hazard_statements.length > 5 && (
                        <li className="text-sm text-gray-500 italic">
                          +{sdsDocument.hazard_statements.length - 5} more statements...
                        </li>
                      )}
                    </ul>
                  </div>
                )}
                
                {sdsDocument.precautionary_statements?.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-600 mb-2 block">Precautionary Statements</label>
                    <ul className="list-disc list-inside space-y-1">
                      {sdsDocument.precautionary_statements.slice(0, 5).map((statement: string, index: number) => (
                        <li key={index} className="text-sm text-gray-700">{statement}</li>
                      ))}
                      {sdsDocument.precautionary_statements.length > 5 && (
                        <li className="text-sm text-gray-500 italic">
                          +{sdsDocument.precautionary_statements.length - 5} more statements...
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            {/* First Aid Information */}
            {sdsDocument.first_aid && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2 text-red-600" />
                  First Aid Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(sdsDocument.first_aid).map(([key, value]) => (
                    value && (
                      <div key={key}>
                        <label className="text-sm font-medium text-gray-600 capitalize">
                          {key.replace(/_/g, ' ')}
                        </label>
                        <p className="text-sm text-gray-700 mt-1">{value as string}</p>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* PDF Viewer Popup */}
      <PDFViewerPopup
        isOpen={showPDFViewer}
        onClose={() => setShowPDFViewer(false)}
        pdfUrl={getPDFUrl() || ''}
        documentName={sdsDocument.product_name}
      />
    </>
  );
};

export default SDSViewerPopup;
