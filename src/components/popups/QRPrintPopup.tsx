
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
  const facilityDisplayName = facilityData.facility_name || 'Facility';

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      QRCodeLib.toCanvas(canvasRef.current, facilityUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      }, (error) => {
        if (error) console.error('QR Code generation failed:', error);
      });
    }
  }, [isOpen, facilityUrl]);

  const handlePrint = () => {
    window.print();
  };

  const downloadQRCode = () => {
    if (canvasRef.current) {
      const link = document.createElement('a');
      link.download = `${facilityDisplayName}-QR-Poster.png`;
      link.href = canvasRef.current.toDataURL();
      link.click();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto print:shadow-none print:border-none">
        <DialogHeader className="print:hidden">
          <DialogTitle className="text-xl font-bold">
            Print Professional Poster
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
              onClick={downloadQRCode}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download QR Code
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRPrintPopup;
