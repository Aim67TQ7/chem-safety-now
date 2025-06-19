
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { VideoOverlayModal } from "./VideoOverlayModal";

const SarahSafetyAvatar = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        onClick={() => setIsModalOpen(true)}
        className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-100 transition-colors"
      >
        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-blue-500">
          <img
            src="/lovable-uploads/7cbd0a20-15f0-43f7-9877-126cab0c631c.png"
            alt="Sarah Safety Avatar"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex flex-col items-start">
          <span className="text-sm font-semibold text-gray-900">Sarah Safety</span>
          <span className="text-xs text-gray-600">Click to watch</span>
        </div>
      </Button>

      <VideoOverlayModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

export default SarahSafetyAvatar;
