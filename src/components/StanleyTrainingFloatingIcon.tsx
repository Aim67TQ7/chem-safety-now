import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { GraduationCap } from "lucide-react";

interface StanleyTrainingFloatingIconProps {
  onOpenTraining: () => void;
}

const StanleyTrainingFloatingIcon = ({ onOpenTraining }: StanleyTrainingFloatingIconProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={() => {
              console.log('Stanley icon clicked!');
              onOpenTraining();
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`
              fixed bottom-6 left-6 z-[9999] 
              w-16 h-16 rounded-full p-0 
              bg-gradient-to-r from-blue-600 to-green-600 
              hover:from-blue-700 hover:to-green-700
              shadow-lg hover:shadow-xl
              transition-all duration-300 ease-in-out
              ${isHovered ? 'scale-110' : 'scale-100'}
              animate-pulse
              pointer-events-auto cursor-pointer
            `}
            style={{
              animationDuration: '3s'
            }}
          >
            <div className="relative">
              <Avatar className="w-12 h-12 border-2 border-white">
                <AvatarImage 
                  src="/lovable-uploads/04752379-7d70-4aec-abaa-5495664cdc62.png" 
                  alt="Stanley - Training Assistant"
                />
                <AvatarFallback className="bg-blue-600 text-white">
                  <GraduationCap className="w-6 h-6" />
                </AvatarFallback>
              </Avatar>
              
              {/* Small training indicator */}
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white flex items-center justify-center">
                <GraduationCap className="w-2 h-2 text-yellow-800" />
              </div>
            </div>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right" className="bg-white text-gray-900 border border-gray-200">
          <p className="font-medium">Training with Safety Stan</p>
          <p className="text-sm text-gray-600">Click for personalized safety guidance</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default StanleyTrainingFloatingIcon;