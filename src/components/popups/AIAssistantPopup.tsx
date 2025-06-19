
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import AIAssistant from "@/components/AIAssistant";
import { X } from "lucide-react";

interface AIAssistantPopupProps {
  isOpen: boolean;
  onClose: () => void;
  facilityData: any;
  selectedDocument?: any;
  onGenerateLabel?: (document: any) => void;
}

const AIAssistantPopup = ({ 
  isOpen, 
  onClose, 
  facilityData, 
  selectedDocument, 
  onGenerateLabel 
}: AIAssistantPopupProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[90vw] h-[85vh] overflow-hidden flex flex-col p-0">
        <div className="absolute top-4 right-4 z-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex-1 min-h-0 p-4">
          <AIAssistant 
            facilityData={facilityData} 
            selectedDocument={selectedDocument}
            onGenerateLabel={onGenerateLabel}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AIAssistantPopup;
