
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Printer } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const facilityDisplayName = facilityData.facility_name || 'Facility';

  // Ensure we're using the correct domain
  const correctedFacilityUrl = facilityUrl.includes('qrsafetyapp.com') 
    ? facilityUrl 
    : `https://qrsafetyapp.com/facility/${facilityData.slug}`;

  useEffect(() => {
    if (isOpen) {
      // Generate QR code as data URL for reliable display in print
      QRCodeLib.toDataURL(correctedFacilityUrl, {
        width: 400,
        margin: 3,
        color: {
          dark: '#000000',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'M'
      }, (error, url) => {
        if (error) {
          console.error('QR Code generation failed:', error);
        } else {
          console.log('QR Code generated successfully for print');
          setQrCodeDataUrl(url);
        }
      });
    }
  }, [isOpen, correctedFacilityUrl]);

  const handlePrint = () => {
    window.print();
  };

  const downloadQRCode = () => {
    if (qrCodeDataUrl) {
      const link = document.createElement('a');
      link.download = `${facilityDisplayName}-QR-Code.png`;
      link.href = qrCodeDataUrl;
      link.click();
    }
  };

  const downloadFullPoster = () => {
    if (qrCodeDataUrl) {
      // Create a high-resolution poster for download
      const posterCanvas = document.createElement('canvas');
      const ctx = posterCanvas.getContext('2d');
      if (!ctx) return;

      // Set high resolution poster dimensions (8.5" x 11" at 300 DPI)
      const posterWidth = 2550;
      const posterHeight = 3300;
      posterCanvas.width = posterWidth;
      posterCanvas.height = posterHeight;

      // Fill background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, posterWidth, posterHeight);

      // Add border
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 8;
      ctx.strokeRect(40, 40, posterWidth - 80, posterHeight - 80);

      // Title
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 120px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Chemical Safety Portal', posterWidth / 2, 300);

      // Facility name
      ctx.font = 'bold 90px Arial';
      ctx.fillText(facilityDisplayName, posterWidth / 2, 450);

      // Load and draw QR code from data URL
      const qrImage = new Image();
      qrImage.onload = () => {
        const qrSize = 1000;
        const qrX = (posterWidth - qrSize) / 2;
        const qrY = 600;

        // Draw white background for QR code
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(qrX - 40, qrY - 40, qrSize + 80, qrSize + 80);
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 4;
        ctx.strokeRect(qrX - 40, qrY - 40, qrSize + 80, qrSize + 80);

        // Draw QR code
        ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

        // Instructions
        ctx.font = 'bold 70px Arial';
        ctx.fillStyle = '#000000';
        ctx.fillText('Scan for Instant Safety Access', posterWidth / 2, 1800);

        const instructions = [
          '1. Open your phone\'s camera app',
          '2. Point camera at QR code above',
          '3. Tap the notification to access safety data',
          '4. No app download required'
        ];

        ctx.font = '60px Arial';
        instructions.forEach((instruction, index) => {
          ctx.fillText(instruction, posterWidth / 2, 1950 + (index * 100));
        });

        // URL
        ctx.font = '45px Arial';
        ctx.fillStyle = '#666666';
        ctx.fillText('Direct URL:', posterWidth / 2, 2450);
        ctx.font = '40px monospace';
        ctx.fillText(correctedFacilityUrl, posterWidth / 2, 2520);

        // Footer
        ctx.font = '50px Arial';
        ctx.fillStyle = '#000000';
        ctx.fillText('Scan with Phone Camera for Instant Access', posterWidth / 2, 2750);

        // Download the poster
        const link = document.createElement('a');
        link.download = `${facilityDisplayName}-Safety-Poster.png`;
        link.href = posterCanvas.toDataURL('image/png', 1.0);
        link.click();
      };
      qrImage.src = qrCodeDataUrl;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto print:shadow-none print:border-none">
        <DialogHeader className="print:hidden">
          <DialogTitle className="text-xl font-bold">
            SDS Discovery Link
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
                  {qrCodeDataUrl ? (
                    <div className="relative">
                      <img 
                        src={qrCodeDataUrl} 
                        alt="Facility QR Code"
                        className="mx-auto border border-gray-200 rounded print:border-gray-800 w-80 h-80"
                        style={{ display: 'block' }}
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
                  ) : (
                    <div className="w-80 h-80 bg-gray-100 border border-gray-200 rounded flex items-center justify-center">
                      <span className="text-gray-500">Generating QR Code...</span>
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
                  {correctedFacilityUrl}
                </code>
              </div>
            </div>
          </Card>

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
