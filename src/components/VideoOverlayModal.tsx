
import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Play, Pause, SkipForward, RotateCcw } from "lucide-react";

interface VideoOverlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const videos = [
  "/lovable-uploads/Sarah Safety - Part 1.mp4",
  "/lovable-uploads/Sarah Safety - Part 2.mp4",
  "/lovable-uploads/Sarah Safety - Part 3.mp4"
];

export const VideoOverlayModal = ({ isOpen, onClose }: VideoOverlayModalProps) => {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (isOpen && videoRef.current) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  }, [isOpen, currentVideoIndex]);

  useEffect(() => {
    if (showControls) {
      clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
    return () => clearTimeout(controlsTimeoutRef.current);
  }, [showControls]);

  const handleVideoEnd = () => {
    if (currentVideoIndex < videos.length - 1) {
      setCurrentVideoIndex(currentVideoIndex + 1);
    } else {
      setIsPlaying(false);
    }
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleNext = () => {
    if (currentVideoIndex < videos.length - 1) {
      setCurrentVideoIndex(currentVideoIndex + 1);
    }
  };

  const handleReplay = () => {
    setCurrentVideoIndex(0);
    setIsPlaying(true);
  };

  const handleMouseMove = () => {
    setShowControls(true);
  };

  const handleClose = () => {
    setCurrentVideoIndex(0);
    setIsPlaying(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-none w-full h-full p-0 bg-black border-none">
        <div 
          className="relative w-full h-full flex items-center justify-center"
          onMouseMove={handleMouseMove}
        >
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className={`absolute top-4 right-4 z-10 text-white hover:bg-white/20 transition-opacity duration-300 ${
              showControls ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <X className="w-6 h-6" />
          </Button>

          {/* Video */}
          <video
            ref={videoRef}
            src={videos[currentVideoIndex]}
            className="max-w-full max-h-full"
            onEnded={handleVideoEnd}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />

          {/* Controls */}
          <div
            className={`absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 bg-black/50 backdrop-blur-sm rounded-lg px-6 py-3 transition-opacity duration-300 ${
              showControls ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePlayPause}
              className="text-white hover:bg-white/20"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </Button>

            {currentVideoIndex < videos.length - 1 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNext}
                className="text-white hover:bg-white/20"
              >
                <SkipForward className="w-5 h-5" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={handleReplay}
              className="text-white hover:bg-white/20"
            >
              <RotateCcw className="w-5 h-5" />
            </Button>

            <span className="text-white text-sm">
              {currentVideoIndex + 1} / {videos.length}
            </span>
          </div>

          {/* Video titles */}
          <div
            className={`absolute top-8 left-1/2 transform -translate-x-1/2 text-white text-center transition-opacity duration-300 ${
              showControls ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <h3 className="text-2xl font-bold mb-2">Sarah Safety</h3>
            <p className="text-lg">Part {currentVideoIndex + 1}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
