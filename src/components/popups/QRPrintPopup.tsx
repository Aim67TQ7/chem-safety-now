
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Printer } from "lucide-react";
import { useEffect, useRef } from "react";
import QRCodeLib from 'qrcode';

interface QRPrintPopupProps {
  isOpen: boolean;
  onClose: () => void;
  facilityData: {
    id: string;
    slug: string;
    facility_name: string | null;
    logo_url?: string;
  };
  facilityUrl: string;
}

const QRPrintPopup = ({ isOpen, onClose, facilityData, facilityUrl }: QRPrintPopupProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const posterCanvasRef = useRef<HTMLCanvasElement>(null);
  const facilityDisplayName = facilityData.facility_name || 'Facility';

  useEffect(() => {
    if (isOpen && canvasRef.current && posterCanvasRef.current) {
      // Generate QR code
      QRCodeLib.toCanvas(canvasRef.current, facilityUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      }, (error) => {
        if (error) {
          console.error('QR Code generation failed:', error);
          return;
        }
        
        // Generate full poster canvas
        generatePosterCanvas();
      });
    }
  }, [isOpen, facilityUrl, facilityDisplayName]);

  const generatePosterCanvas = () => {
    const posterCanvas = posterCanvasRef.current;
    const qrCanvas = canvasRef.current;
    
    if (!posterCanvas || !qrCanvas) return;
    
    const ctx = posterCanvas.getContext('2d');
    if (!ctx) return;
    
    // Set poster dimensions (8.5" x 11" at 300 DPI = 2550 x 3300 pixels)
    const posterWidth = 850;
    const posterHeight = 1100;
    posterCanvas.width = posterWidth;
    posterCanvas.height = posterHeight;
    
    // Fill background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, posterWidth, posterHeight);
    
    // Add border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, posterWidth - 40, posterHeight - 40);
    
    // Title
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Chemical Safety Portal', posterWidth / 2, 100);
    
    // Facility name
    ctx.font = 'bold 36px Arial';
    ctx.fillText(facilityDisplayName, posterWidth / 2, 160);
    
    // QR Code (center it)
    const qrSize = 400;
    const qrX = (posterWidth - qrSize) / 2;
    const qrY = 220;
    
    // Draw white background for QR code
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(qrX - 20, qrY - 20, qrSize + 40, qrSize + 40);
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 2;
    ctx.strokeRect(qrX - 20, qrY - 20, qrSize + 40, qrSize + 40);
    
    // Draw QR code
    ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);
    
    // Logo overlay (if available)
    if (facilityData.logo_url) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const logoSize = 80;
        const logoX = (posterWidth - logoSize) / 2;
        const logoY = qrY + (qrSize - logoSize) / 2;
        
        // White circle background
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(logoX + logoSize/2, logoY + logoSize/2, logoSize/2 + 5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw logo
        ctx.drawImage(img, logoX, logoY, logoSize, logoSize);
      };
      img.src = facilityData.logo_url;
    }
    
    // Instructions
    ctx.font = 'bold 28px Arial';
    ctx.fillStyle = '#000000';
    ctx.fillText('How to Access Safety Data:', posterWidth / 2, 720);
    
    const instructions = [
      '1. Open your phone\'s camera app',
      '2. Point camera at QR code above',
      '3. Tap the notification to access safety data',
      '4. No app download required'
    ];
    
    ctx.font = '24px Arial';
    instructions.forEach((instruction, index) => {
      ctx.fillText(instruction, posterWidth / 2, 770 + (index * 40));
    });
    
    // URL
    ctx.font = '18px Arial';
    ctx.fillStyle = '#666666';
    ctx.fillText('Direct URL:', posterWidth / 2, 950);
    ctx.font = '16px monospace';
    ctx.fillText(facilityUrl, posterWidth / 2, 980);
    
    // Footer
    ctx.font = '20px Arial';
    ctx.fillStyle = '#000000';
    ctx.fillText('Scan with Phone Camera for Instant Access', posterWidth / 2, 1050);
  };

  const handlePrint = () => {
    window.print();
  };

  const downloadQRCode = () => {
    if (canvasRef.current) {
      const link = document.createElement('a');
      link.download = `${facilityDisplayName}-QR-Code.png`;
      link.href = canvasRef.current.toDataURL();
      link.click();
    }
  };

  const downloadFullPoster = () => {
    if (posterCanvasRef.current) {
      const link = document.createElement('a');
      link.download = `${facilityDisplayName}-Safety-Poster.png`;
      link.href = posterCanvasRef.current.toDataURL('image/png', 1.0);
      link.click();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto print:shadow-none print:border-none">
        <DialogHeader className="print:hidden">
          <DialogTitle className="text-xl font-bold">
            Print Professional Safety Poster
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Print Header - Only visible when printing */}
          <div className="hidden print:block text-center">
            <h1 className="text-3xl font-bold mb-2">Chemical Safety Portal</h1>
            <h2 className="text-xl text-gray-600">{facilityDisplayName}</h2>
          </div>

          {/* Main QR Code Display */}
          <Card className="p-8 print:shadow-none print:border-2 print:border-gray-800">
            <div className="text-center space-y-6">
              <div className="bg-white border-2 border-gray-200 rounded-lg p-8 inline-block print:border-gray-800">
                <div className="relative inline-block">
                  <canvas 
                    ref={canvasRef} 
                    className="mx-auto border border-gray-200 rounded print:border-gray-800"
                  />
                  {/* Company logo overlay */}
                  {facilityData.logo_url && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-2 rounded-lg shadow-lg border-2 border-gray-800">
                      <img 
                        src={facilityData.logo_url} 
                        alt={`${facilityDisplayName} Logo`}
                        className="w-16 h-16 object-contain"
                      />
                    </div>
                  )}
                </div>
                
                <div className="mt-4 space-y-2">
                  <h3 className="text-xl font-bold text-gray-900">{facilityDisplayName}</h3>
                  <p className="text-gray-600">Chemical Safety Portal</p>
                  <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300 text-sm">
                    Scan with Phone Camera
                  </Badge>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-left print:bg-white print:border-gray-800">
                <h4 className="font-semibold text-gray-900 mb-3">Instructions:</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Open your phone's camera app</li>
                  <li>• Point camera at QR code</li>
                  <li>• Tap the notification to access safety data</li>
                  <li>• No app download required</li>
                </ul>
              </div>

              {/* URL */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 print:bg-white print:border-gray-800">
                <p className="text-xs text-gray-600 mb-1">Direct URL:</p>
                <code className="text-xs bg-white border border-gray-200 rounded px-2 py-1 block break-all print:border-gray-800">
                  {facilityUrl}
                </code>
              </div>
            </div>
          </Card>

          {/* Hidden poster canvas for full poster generation */}
          <canvas 
            ref={posterCanvasRef} 
            className="hidden"
          />

          {/* Action Buttons - Hidden when printing */}
          <div className="flex gap-4 justify-center print:hidden">
            <Button 
              onClick={handlePrint}
              className="bg-gray-800 hover:bg-gray-900 text-white flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print Poster
            </Button>
            <Button 
              onClick={downloadFullPoster}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download Full Poster
            </Button>
            <Button 
              onClick={downloadQRCode}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download QR Code Only
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRPrintPopup;
