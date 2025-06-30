
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Printer } from "lucide-react";
import { useEffect, useState } from "react";
import QRCodeLib from 'qrcode';
import { useToast } from "@/hooks/use-toast";

interface QRCodePrintPreviewPopupProps {
  isOpen: boolean;
  onClose: () => void;
  facilityData: {
    id: string;
    slug: string;
    facility_name: string | null;
    logo_url?: string;
    contact_name?: string | null;
    email?: string | null;
    address?: string | null;
  };
}

const QRCodePrintPreviewPopup = ({ isOpen, onClose, facilityData }: QRCodePrintPreviewPopupProps) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [posterSize, setPosterSize] = useState<'letter' | 'a4'>('letter');
  const [layoutMode, setLayoutMode] = useState<'single' | 'dual'>('single');
  const { toast } = useToast();
  
  const facilityDisplayName = facilityData.facility_name || 'Facility';
  const facilityUrl = `https://chemlabel-gpt.com/facility/${facilityData.slug}`;

  useEffect(() => {
    if (isOpen) {
      QRCodeLib.toDataURL(facilityUrl, {
        width: 400,
        margin: 3,
        color: {
          dark: '#000000',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'M'
      }, (error, url) => {
        if (!error && url) {
          setQrCodeDataUrl(url);
        } else {
          console.error('QR Code generation error:', error);
        }
      });
    }
  }, [isOpen, facilityUrl]);

  const handlePrint = () => {
    // Fix the print URL to use the correct route structure with facilitySlug
    const printUrl = `/qr-print/${facilityData.slug}`;
    window.open(printUrl, '_blank');
    toast({
      title: "Print Page Opened",
      description: "A new tab with the print-ready poster has been opened.",
    });
  };

  const downloadPoster = async () => {
    if (!qrCodeDataUrl) return;

    try {
      const link = document.createElement('a');
      link.download = `${facilityDisplayName}-QR-Code-Preview.png`;
      link.href = qrCodeDataUrl;
      link.click();

      toast({
        title: "QR Code Downloaded",
        description: "Your QR code has been saved to downloads.",
      });
    } catch (err) {
      console.error('Download error:', err);
      toast({
        title: "Download Failed",
        description: "There was an error downloading the QR code.",
        variant: "destructive"
      });
    }
  };

  const PosterPreview = () => (
    <div className="bg-white border-2 border-gray-300 rounded-lg p-6 max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="text-xl font-bold text-gray-900 mb-1">
          Chemical Safety Portal
        </h1>
        <p className="text-xs text-gray-600">OSHA Compliant • Instant Access • Mobile Ready</p>
      </div>

      {/* Main Content Box */}
      <div className="bg-white border-2 border-gray-800 rounded-lg p-4">
        {/* Company name */}
        <div className="text-center mb-3">
          <h2 className="text-lg font-bold text-gray-900">
            {facilityDisplayName}
          </h2>
        </div>

        {/* QR Code with logo overlay */}
        <div className="text-center mb-4">
          <div className="relative inline-block">
            {qrCodeDataUrl && (
              <div className="relative">
                <img 
                  src={qrCodeDataUrl} 
                  alt="Facility QR Code"
                  className="w-32 h-32 mx-auto border-2 border-gray-800 rounded"
                />
                {/* Company logo overlay */}
                {facilityData.logo_url && (
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-1 rounded border border-gray-800">
                    <img 
                      src={facilityData.logo_url} 
                      alt={`${facilityDisplayName} Logo`}
                      className="w-6 h-6 object-contain"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="text-center mb-3">
          <h3 className="text-sm font-bold text-gray-900 mb-2">
            Scan for Instant Safety Access
          </h3>
          
          <div className="bg-gray-100 border border-gray-300 rounded p-3 text-xs">
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center">
                <div className="bg-gray-800 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mx-auto mb-1">1</div>
                <p className="font-medium text-gray-900">Open Camera</p>
                <p className="text-gray-700">Use phone's camera</p>
              </div>
              <div className="text-center">
                <div className="bg-gray-800 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mx-auto mb-1">2</div>
                <p className="font-medium text-gray-900">Point & Scan</p>
                <p className="text-gray-700">Aim at QR code</p>
              </div>
              <div className="text-center">
                <div className="bg-gray-800 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mx-auto mb-1">3</div>
                <p className="font-medium text-gray-900">Access Data</p>
                <p className="text-gray-700">Tap to view info</p>
              </div>
            </div>
          </div>
        </div>

        {/* Facility Info */}
        {(facilityData.address || facilityData.contact_name || facilityData.email) && (
          <div className="bg-blue-50 border border-blue-200 rounded p-2 mb-3">
            <h4 className="text-xs font-bold text-blue-900 mb-1">Facility Information</h4>
            <div className="space-y-1 text-xs text-blue-800">
              {facilityData.contact_name && (
                <p><span className="font-medium">Contact:</span> {facilityData.contact_name}</p>
              )}
              {facilityData.address && (
                <p><span className="font-medium">Address:</span> {facilityData.address}</p>
              )}
              {facilityData.email && (
                <p><span className="font-medium">Email:</span> {facilityData.email}</p>
              )}
            </div>
          </div>
        )}

        {/* ChemLabel-GPT branding */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <img 
              src="/lovable-uploads/7cbd0a20-15f0-43f7-9877-126cab0c631c.png" 
              alt="ChemLabel-GPT Logo" 
              className="w-3 h-3 object-contain"
            />
            <p className="text-xs text-gray-800 font-bold">ChemLabel-GPT</p>
          </div>
          <p className="text-xs text-gray-500">No app required • Works with any smartphone</p>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            QR Code Poster Preview
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-gray-50 p-4 rounded-lg">
            <div>
              <h3 className="font-semibold text-gray-900">Preview Options</h3>
              <p className="text-sm text-gray-600">Customize your poster before printing</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-700">Layout:</label>
                <select 
                  value={layoutMode} 
                  onChange={(e) => setLayoutMode(e.target.value as any)}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value="single">Single Poster</option>
                  <option value="dual">Two Posters</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-700">Size:</label>
                <select 
                  value={posterSize} 
                  onChange={(e) => setPosterSize(e.target.value as any)}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                >
                  <option value="letter">Letter (8.5x11)</option>
                  <option value="a4">A4</option>
                </select>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-100 p-6 rounded-lg">
            <div className="text-center mb-4">
              <Badge variant="outline" className="bg-white">
                Preview - {posterSize.toUpperCase()} {layoutMode === 'dual' ? 'Landscape (2 posters)' : 'Portrait'}
              </Badge>
            </div>
            
            <div className={`flex justify-center gap-4 ${layoutMode === 'dual' ? 'flex-row' : 'flex-col'}`}>
              <PosterPreview />
              {layoutMode === 'dual' && <PosterPreview />}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <Button 
              onClick={handlePrint}
              className="bg-gray-800 hover:bg-gray-900 text-white flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Open Full Print View
            </Button>
            
            <Button 
              onClick={downloadPoster}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download QR Code
            </Button>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Print Instructions</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Click "Open Full Print View" for the complete poster with proper sizing</li>
              <li>• The preview shows how your poster will look when printed</li>
              <li>• QR code will work with any smartphone camera</li>
              <li>• No special app required for scanning</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRCodePrintPreviewPopup;
