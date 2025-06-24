
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Download, ExternalLink } from "lucide-react";

interface PDFViewerPopupProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string;
  documentName: string;
  onDownload?: () => void;
}

const PDFViewerPopup = ({ 
  isOpen, 
  onClose, 
  pdfUrl,
  documentName,
  onDownload
}: PDFViewerPopupProps) => {
  const handleOpenInNewTab = () => {
    window.open(pdfUrl, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[95vw] h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogTitle className="sr-only">
          PDF Viewer - {documentName}
        </DialogTitle>
        
        {/* Header */}
        <div className="bg-gray-100 border-b px-4 py-3 flex items-center justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 truncate">{documentName}</h3>
            <p className="text-sm text-gray-600 truncate">{pdfUrl}</p>
          </div>
          
          <div className="flex items-center space-x-2">
            {onDownload && (
              <Button
                size="sm"
                variant="outline"
                onClick={onDownload}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            )}
            
            <Button
              size="sm"
              variant="outline"
              onClick={handleOpenInNewTab}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open in New Tab
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* PDF Content */}
        <div className="flex-1 bg-gray-50">
          <iframe
            src={pdfUrl}
            className="w-full h-full border-0"
            title={`PDF Viewer - ${documentName}`}
            style={{ minHeight: '600px' }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PDFViewerPopup;
