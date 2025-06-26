
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Download, ExternalLink, MessageSquare } from "lucide-react";

interface DocumentViewerPopupProps {
  isOpen: boolean;
  onClose: () => void;
  document: any;
  onDownload?: (document: any) => void;
  onAskAI?: (document: any) => void;
}

const DocumentViewerPopup = ({ 
  isOpen, 
  onClose, 
  document,
  onDownload,
  onAskAI
}: DocumentViewerPopupProps) => {
  if (!document) return null;

  const documentUrl = document.source_url || document.bucket_url;
  const documentName = document.product_name || document.file_name || 'Document';

  const handleOpenInNewTab = () => {
    if (documentUrl) {
      window.open(documentUrl, '_blank');
    }
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload(document);
    }
  };

  const handleAskAI = () => {
    if (onAskAI) {
      onAskAI(document);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[95vw] h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogTitle className="sr-only">
          Document Viewer - {documentName}
        </DialogTitle>
        
        {/* Header */}
        <div className="bg-gray-100 border-b px-4 py-3 flex items-center justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 truncate">{documentName}</h3>
            {document.manufacturer && (
              <p className="text-sm text-gray-600">Manufacturer: {document.manufacturer}</p>
            )}
            <p className="text-xs text-gray-500 truncate">{documentUrl}</p>
          </div>
          
          <div className="flex items-center space-x-2">
            {onAskAI && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleAskAI}
                className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Ask Stanley
              </Button>
            )}
            
            {onDownload && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownload}
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
              New Tab
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
        
        {/* Document Content */}
        <div className="flex-1 bg-gray-50">
          {documentUrl ? (
            <iframe
              src={documentUrl}
              className="w-full h-full border-0"
              title={`Document Viewer - ${documentName}`}
              style={{ minHeight: '600px' }}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <p>No document URL available</p>
                <p className="text-sm mt-2">Unable to display document preview</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentViewerPopup;
