
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import LabelPrinter from "@/components/LabelPrinter";
import { Printer, X, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface LabelPrinterPopupProps {
  isOpen: boolean;
  onClose: () => void;
  initialProductName?: string;
  initialManufacturer?: string;
  selectedDocument?: any;
}

const LabelPrinterPopup = ({ 
  isOpen, 
  onClose, 
  initialProductName, 
  initialManufacturer, 
  selectedDocument 
}: LabelPrinterPopupProps) => {
  const [showPDF, setShowPDF] = useState(true);

  // Get the PDF URL - generate public URL for bucket files
  const getPDFUrl = () => {
    if (!selectedDocument) return null;
    
    // If we have a bucket_url, generate the public URL from Supabase storage
    if (selectedDocument.bucket_url) {
      const { data } = supabase.storage
        .from('sds-documents')
        .getPublicUrl(selectedDocument.bucket_url.replace('sds-documents/', ''));
      return data.publicUrl;
    }
    
    // Fallback to source_url if no bucket_url
    return selectedDocument.source_url;
  };

  const pdfUrl = getPDFUrl();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] w-full h-[90vh] max-h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="flex flex-row items-center justify-between p-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Printer className="w-5 h-5" />
            GHS Label Printer
            {selectedDocument && (
              <span className="text-sm font-normal text-gray-600">
                - {selectedDocument.product_name}
              </span>
            )}
          </DialogTitle>
          <div className="flex items-center gap-2">
            {pdfUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPDF(!showPDF)}
                className="flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                {showPDF ? 'Hide PDF' : 'Show PDF'}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex">
          {/* Label Printer Side */}
          <div className={`${showPDF && pdfUrl ? 'w-1/2' : 'w-full'} overflow-hidden border-r`}>
            <LabelPrinter 
              initialProductName={initialProductName}
              initialManufacturer={initialManufacturer}
              selectedDocument={selectedDocument}
            />
          </div>
          
          {/* PDF Viewer Side */}
          {showPDF && pdfUrl && (
            <div className="w-1/2 overflow-hidden bg-gray-100">
              <div className="h-full">
                <div className="bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 border-b">
                  SDS Document: {selectedDocument.product_name}
                </div>
                <div className="h-[calc(100%-2.5rem)]">
                  <iframe
                    src={pdfUrl}
                    className="w-full h-full border-none"
                    title={`SDS for ${selectedDocument.product_name}`}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LabelPrinterPopup;
