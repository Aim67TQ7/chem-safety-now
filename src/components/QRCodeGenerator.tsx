
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QrCode, Download } from 'lucide-react';
import QRCodeLib from 'qrcode';
import { useToast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';


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
  
  const { toast } = useToast();

  const facilityDisplayName = facilityData.facility_name || 'Facility';
  const facilityUrl = `https://qrsafetyapp.com/facility/${facilityData.slug}`;

  useEffect(() => {
    generateQRCode();
  }, [facilityData.slug]);

  const generateQRCode = async () => {
    setIsGenerating(true);
    try {
      const dataUrl = await QRCodeLib.toDataURL(facilityUrl, {
        width: 400,
        margin: 4,
        color: {
          dark: '#000000',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'H'
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

  const downloadPDFPoster = async () => {
    if (!qrCodeDataUrl) return;

    try {
      // Create a temporary container for the poster
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'fixed';
      tempContainer.style.top = '-9999px';
      tempContainer.style.left = '-9999px';
      tempContainer.style.width = '8.5in';
      tempContainer.style.height = '11in';
      tempContainer.style.backgroundColor = 'white';
      tempContainer.style.padding = '0.5in';
      tempContainer.style.fontFamily = 'Arial, sans-serif';
      
      // Create poster content
      tempContainer.innerHTML = `
        <div style="text-align: center; height: 100%; display: flex; flex-direction: column; justify-content: center;">
          <div style="margin-bottom: 2rem;">
            <h1 style="font-size: 2.5rem; font-weight: bold; color: #1f2937; margin: 0 0 1rem 0;">
              Safety Information Access
            </h1>
            <p style="font-size: 1.25rem; color: #6b7280; margin: 0;">
              Scan the QR code below for instant access
            </p>
          </div>
          
          <div style="margin-bottom: 2rem;">
            <img src="${qrCodeDataUrl}" alt="QR Code" style="width: 300px; height: 300px; margin: 0 auto; display: block; border: 2px solid #e5e7eb; border-radius: 8px;" />
          </div>
          
          <div style="margin-bottom: 2rem;">
            <p style="font-size: 1.125rem; color: #374151; margin: 0 0 0.5rem 0;">
              <strong>How to scan:</strong>
            </p>
            <p style="font-size: 1rem; color: #6b7280; margin: 0 0 0.25rem 0;">
              1. Open your phone's camera app
            </p>
            <p style="font-size: 1rem; color: #6b7280; margin: 0 0 0.25rem 0;">
              2. Point the camera at the QR code
            </p>
            <p style="font-size: 1rem; color: #6b7280; margin: 0;">
              3. Tap the notification to access safety information
            </p>
          </div>
          
          <div style="border-top: 2px solid #e5e7eb; padding-top: 1.5rem;">
            ${facilityData.logo_url ? `
              <div style="margin-bottom: 1rem;">
                <img src="${facilityData.logo_url}" alt="Logo" style="height: 60px; margin: 0 auto; display: block;" />
              </div>
            ` : ''}
            
            <h2 style="font-size: 1.5rem; font-weight: bold; color: #1f2937; margin: 0 0 1rem 0;">
              ${facilityDisplayName}
            </h2>
            
            ${facilityData.contact_name ? `
              <p style="font-size: 1rem; color: #374151; margin: 0 0 0.5rem 0;">
                <strong>Contact:</strong> ${facilityData.contact_name}
              </p>
            ` : ''}
            
            ${facilityData.address ? `
              <p style="font-size: 1rem; color: #374151; margin: 0 0 0.5rem 0;">
                <strong>Address:</strong> ${facilityData.address}
              </p>
            ` : ''}
            
            ${facilityData.email ? `
              <p style="font-size: 1rem; color: #374151; margin: 0;">
                <strong>Email:</strong> ${facilityData.email}
              </p>
            ` : ''}
          </div>
        </div>
      `;
      
      document.body.appendChild(tempContainer);
      
      // Capture the content as canvas
      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      
      // Remove temporary container
      document.body.removeChild(tempContainer);
      
      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'in',
        format: 'letter'
      });
      
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, 8.5, 11);
      
      // Download PDF
      const fileName = `${facilityDisplayName.replace(/[^a-zA-Z0-9]/g, '_')}-Safety-QR-Poster.pdf`;
      pdf.save(fileName);
      
      toast({
        title: "PDF Downloaded",
        description: "Your safety QR poster has been saved as a PDF.",
      });
    } catch (error) {
      console.error('PDF generation failed:', error);
      toast({
        title: "Download Failed",
        description: "There was an error generating the PDF poster.",
        variant: "destructive"
      });
    }
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
              <div className="space-y-4">
                <img 
                  src={qrCodeDataUrl} 
                  alt="Facility QR Code"
                  className="w-64 h-64 mx-auto border border-gray-200 rounded-lg"
                />
                {/* Company logo below QR code */}
                {facilityData.logo_url && (
                  <div className="flex justify-center">
                    <div className="bg-white p-2 rounded-lg shadow-md border border-gray-300">
                      <img 
                        src={facilityData.logo_url} 
                        alt={`${facilityDisplayName} Logo`}
                        className="w-8 h-8 object-contain"
                      />
                    </div>
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
            <Button
              onClick={downloadPDFPoster}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 w-full"
              disabled={!qrCodeDataUrl}
            >
              <Download className="w-4 h-4" />
              Download PDF Poster
            </Button>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Instructions:</strong> Workers can scan this QR code with their phone camera to instantly access safety information. No app download required.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

    </>
  );
};

export default QRCodeGenerator;
