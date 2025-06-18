
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import LabelPrinter from "@/components/LabelPrinter";
import { Printer, X } from "lucide-react";

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
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl w-[95vw] h-[90vh] max-h-[90vh] overflow-hidden flex flex-col p-0">
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
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <LabelPrinter 
            initialProductName={initialProductName}
            initialManufacturer={initialManufacturer}
            selectedDocument={selectedDocument}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LabelPrinterPopup;
