
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { X, Minimize2, Move } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import AIAssistant from "@/components/AIAssistant";

interface SafetyStanChatProps {
  isOpen: boolean;
  onClose: () => void;
  facilityData?: any;
  selectedDocument?: any;
  onGenerateLabel?: (document: any) => void;
}

const SafetyStanChat = ({ 
  isOpen, 
  onClose, 
  facilityData, 
  selectedDocument, 
  onGenerateLabel 
}: SafetyStanChatProps) => {
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isThinking, setIsThinking] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart]);

  if (!isOpen) return null;

  return (
    <div
      ref={chatRef}
      className="fixed z-50 select-none"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
    >
      <Card className="w-80 bg-white shadow-xl border border-gray-200 overflow-hidden">
        {/* Header with Stan's Avatar */}
        <div 
          className="bg-gradient-to-r from-blue-600 to-green-600 p-4 text-white cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="w-12 h-12 border-2 border-white">
                <AvatarImage 
                  src={isThinking 
                    ? "/lovable-uploads/dc6f065c-1503-43fd-91fc-15ffc9fbf39e.png" 
                    : "/lovable-uploads/04752379-7d70-4aec-abaa-5495664cdc62.png"
                  } 
                  alt="Safety Stan"
                />
                <AvatarFallback className="bg-blue-600 text-white">SS</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">Safety Stan</h3>
                <p className="text-xs opacity-90">
                  {isThinking ? "Thinking..." : "Safety Expert"}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-white hover:bg-white/20 h-6 w-6 p-0"
              >
                <Minimize2 className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/20 h-6 w-6 p-0"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* Chat Content */}
        {!isMinimized && (
          <div className="h-96">
            <AIAssistant 
              facilityData={facilityData}
              selectedDocument={selectedDocument}
              onGenerateLabel={onGenerateLabel}
              onThinkingChange={setIsThinking}
            />
          </div>
        )}
      </Card>
    </div>
  );
};

export default SafetyStanChat;
