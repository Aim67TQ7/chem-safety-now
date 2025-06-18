
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import AIAssistant from "@/components/AIAssistant";
import { Bot, X } from "lucide-react";

interface AIAssistantPopupProps {
  isOpen: boolean;
  onClose: () => void;
  facilityData: any;
  selectedDocument?: any;
}

const AIAssistantPopup = ({ isOpen, onClose, facilityData, selectedDocument }: AIAssistantPopupProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="flex flex-row items-center justify-between p-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="w-8 h-8">
              <AvatarImage 
                src="/lovable-uploads/9ec62de0-3471-44e9-9981-e1ddff927939.png" 
                alt="Sarah - Chemical Safety Manager"
              />
              <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <Bot className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="text-lg font-semibold">Sarah - Chemical Safety Manager</div>
              {selectedDocument && (
                <div className="text-sm font-normal text-gray-600">
                  Currently discussing: {selectedDocument.product_name}
                </div>
              )}
            </div>
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
        
        <ResizablePanelGroup direction="vertical" className="flex-1 min-h-0">
          <ResizablePanel defaultSize={100} minSize={30} className="p-6">
            <AIAssistant 
              facilityData={facilityData} 
              selectedDocument={selectedDocument}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </DialogContent>
    </Dialog>
  );
};

export default AIAssistantPopup;
