
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, QrCode, Printer, Share } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useRef } from "react";
import QRCodeLib from 'qrcode';
import { interactionLogger } from "@/services/interactionLogger";

interface QRCodeGeneratorProps {
  facilityData: any;
  facilityUrl: string;
  isSetup?: boolean;
}

const QRCodeGenerator = ({ facilityData, facilityUrl, isSetup }: QRCodeGeneratorProps) => {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCodeLib.toCanvas(canvasRef.current, facilityUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      }, (error) => {
        if (error) console.error('QR Code generation failed:', error);
      });
    }
  }, [facilityUrl]);

  const downloadQRCode = async () => {
    if (canvasRef.current) {
      const link = document.createElement('a');
      link.download = `${facilityData.facilityName}-QR-Code.png`;
      link.href = canvasRef.current.toDataURL();
      link.click();

      // Log QR code download
      await interactionLogger.logQRCodeInteraction({
        actionType: 'download',
        metadata: {
          facilityName: facilityData.facilityName,
          fileName: `${facilityData.facilityName}-QR-Code.png`
        }
      });

      await interactionLogger.logFacilityUsage({
        eventType: 'qr_code_downloaded',
        eventDetail: {
          facilityName: facilityData.facilityName,
          fileName: `${facilityData.facilityName}-QR-Code.png`
        }
      });
      
      toast({
        title: "QR Code Downloaded",
        description: "Your facility QR code has been saved to downloads.",
      });
    }
  };

  const copyUrl = async () => {
    navigator.clipboard.writeText(facilityUrl);

    // Log URL copy
    await interactionLogger.logQRCodeInteraction({
      actionType: 'copy_url',
      metadata: {
        facilityUrl: facilityUrl,
        facilityName: facilityData.facilityName
      }
    });

    await interactionLogger.logFacilityUsage({
      eventType: 'facility_url_copied',
      eventDetail: {
        facilityUrl: facilityUrl
      }
    });

    toast({
      title: "URL Copied",
      description: "Facility URL copied to clipboard.",
    });
  };

  const printPoster = async () => {
    // Log print poster action
    await interactionLogger.logQRCodeInteraction({
      actionType: 'print',
      metadata: {
        action: 'print_poster',
        facilityName: facilityData.facilityName
      }
    });

    await interactionLogger.logFacilityUsage({
      eventType: 'qr_print_poster_requested',
      eventDetail: {
        facilityName: facilityData.facilityName
      }
    });

    // Open print page in new window
    const printUrl = `/facility/${facilityData.slug}/print`;
    window.open(printUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="text-center space-y-6">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {facilityData.facilityName} QR Code
            </h3>
            <p className="text-gray-600">
              Deploy QR codes throughout your facility for instant worker access to safety data
            </p>
          </div>

          {/* QR Code Display Area */}
          <div className="bg-white border-2 border-gray-200 rounded-lg p-8 inline-block">
            <div className="text-center space-y-4">
              <canvas 
                ref={canvasRef} 
                className="mx-auto border border-gray-200 rounded"
              />
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-900">{facilityData.facilityName}</p>
                <p className="text-xs text-gray-500">Chemical Safety Portal</p>
                <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">
                  Scan with Phone Camera
                </Badge>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={printPoster}
              className="bg-gray-800 hover:bg-gray-900 text-white"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print Professional Poster
            </Button>

            <Button 
              onClick={downloadQRCode}
              variant="outline"
            >
              <Download className="w-4 h-4 mr-2" />
              Download QR Code
            </Button>
            
            <Button variant="outline" onClick={copyUrl}>
              <Share className="w-4 h-4 mr-2" />
              Copy URL
            </Button>
          </div>

          {/* Facility URL */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-2">Facility URL:</p>
            <code className="text-sm bg-white border border-gray-200 rounded px-3 py-2 block break-all">
              {facilityUrl}
            </code>
          </div>
        </div>
      </Card>

      {/* Setup Instructions */}
      <Card className="p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">
          Setup Instructions
        </h4>
        
        <div className="space-y-4 text-sm text-gray-600">
          <div className="flex items-start space-x-3">
            <Badge className="bg-gray-100 text-gray-800 border-gray-300 mt-0.5">1</Badge>
            <div>
              <p className="font-medium text-gray-900">Print Professional Posters</p>
              <p>Generate branded QR code posters with your company logo for facility deployment.</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <Badge className="bg-gray-100 text-gray-800 border-gray-300 mt-0.5">2</Badge>
            <div>
              <p className="font-medium text-gray-900">Strategic Placement</p>
              <p>Position QR codes in high-traffic areas: break rooms, tool storage, chemical areas, and workstations.</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <Badge className="bg-gray-100 text-gray-800 border-gray-300 mt-0.5">3</Badge>
            <div>
              <p className="font-medium text-gray-900">Worker Training</p>
              <p>Train personnel to scan with standard camera apps - no additional software required.</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <Badge className="bg-gray-100 text-gray-800 border-gray-300 mt-0.5">4</Badge>
            <div>
              <p className="font-medium text-gray-900">Compliance Monitoring</p>
              <p>All interactions are logged automatically for OSHA compliance and audit documentation.</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Usage Guidelines */}
      <Card className="p-6 bg-orange-50 border-orange-200">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          Important Guidelines
        </h4>
        
        <ul className="space-y-2 text-sm text-gray-700">
          <li>• Protect QR codes from moisture and direct sunlight exposure</li>
          <li>• Replace damaged or faded QR codes immediately to maintain accessibility</li>
          <li>• Ensure codes are positioned at appropriate heights for easy scanning</li>
          <li>• Maintain backup printed copies in your EHS office</li>
          <li>• Conduct regular testing to verify QR code functionality</li>
        </ul>
      </Card>
    </div>
  );
};

export default QRCodeGenerator;
