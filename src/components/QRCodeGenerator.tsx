
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QrCode, Printer, Download, Eye } from 'lucide-react';
import QRCodeLib from 'qrcode';
import { useToast } from '@/hooks/use-toast';
import QRCodePrintPreviewPopup from './popups/QRCodePrintPreviewPopup';

interface QRCodeGeneratorProps {
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

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ facilityData }) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreviewPopup, setShowPreviewPopup] = useState(false);
  const { toast } = useToast();

  const facilityDisplayName = facilityData.facility_name || 'Facility';
  const facilityUrl = `${window.location.origin}/facility/${facilityData.slug}`;

  useEffect(() => {
    generateQRCode();
  }, [facilityData.slug]);

  const generateQRCode = async () => {
    setIsGenerating(true);
    try {
      const dataUrl = await QRCodeLib.toDataURL(facilityUrl, {
        width: 300,
        margin: 3,
        color: {
          dark: '#000000',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'M'
      });
      setQrCodeDataUrl(dataUrl);
    } catch (error) {
      console.error('QR Code generation failed:', error);
      toast({
        title: "QR Code Generation Failed",
        description: "There was an error generating the QR code.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadQRCode = () => {
    if (qrCodeDataUrl) {
      const link = document.createElement('a');
      link.download = `${facilityDisplayName}-QR-Code.png`;
      link.href = qrCodeDataUrl;
      link.click();
      
      toast({
        title: "QR Code Downloaded",
        description: "Your QR code has been saved to downloads.",
      });
    }
  };

  const openPrintView = () => {
    const printUrl = `/qr-print/${facilityData.slug}`;
    window.open(printUrl, '_blank');
    
    toast({
      title: "Print View Opened",
      description: "A new tab with the print-ready poster has been opened.",
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            QR Code Access
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            {isGenerating ? (
              <div className="w-64 h-64 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center mx-auto">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                  <span className="text-gray-500">Generating QR Code...</span>
                </div>
              </div>
            ) : qrCodeDataUrl ? (
              <div className="relative inline-block">
                <img 
                  src={qrCodeDataUrl} 
                  alt="Facility QR Code"
                  className="w-64 h-64 mx-auto border border-gray-200 rounded-lg"
                />
                {/* Company logo overlay */}
                {facilityData.logo_url && (
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-3 rounded-lg shadow-lg border-2 border-gray-800">
                    <img 
                      src={facilityData.logo_url} 
                      alt={`${facilityDisplayName} Logo`}
                      className="w-12 h-12 object-contain"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="w-64 h-64 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center mx-auto">
                <span className="text-gray-500">QR Code will appear here</span>
              </div>
            )}
            
            <div className="mt-4 text-center">
              <h3 className="font-semibold text-gray-900">{facilityDisplayName}</h3>
              <p className="text-sm text-gray-600 break-all">{facilityUrl}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Button
                onClick={() => setShowPreviewPopup(true)}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                disabled={!qrCodeDataUrl}
              >
                <Eye className="w-4 h-4" />
                Preview
              </Button>
              
              <Button
                onClick={openPrintView}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                disabled={!qrCodeDataUrl}
              >
                <Printer className="w-4 h-4" />
                Print
              </Button>
              
              <Button
                onClick={downloadQRCode}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                disabled={!qrCodeDataUrl}
              >
                <Download className="w-4 h-4" />
                Download
              </Button>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Instructions:</strong> Workers can scan this QR code with their phone camera to instantly access safety information. No app download required.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <QRCodePrintPreviewPopup
        isOpen={showPreviewPopup}
        onClose={() => setShowPreviewPopup(false)}
        facilityData={facilityData}
      />
    </>
  );
};

export default QRCodeGenerator;
