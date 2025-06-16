
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import AIAssistant from "@/components/AIAssistant";
import { Bot, X } from "lucide-react";

interface AIAssistantPopupProps {
  isOpen: boolean;
  onClose: () => void;
  facilityData: any;
}

const AIAssistantPopup = ({ isOpen, onClose, facilityData }: AIAssistantPopupProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            Chemical Safety Assistant
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
          <AIAssistant facilityData={facilityData} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AIAssistantPopup;
