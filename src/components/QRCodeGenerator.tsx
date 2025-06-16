
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

  const printInstructions = async () => {
    // Log print instructions
    await interactionLogger.logQRCodeInteraction({
      actionType: 'print',
      metadata: {
        action: 'print_instructions',
        facilityName: facilityData.facilityName
      }
    });

    await interactionLogger.logFacilityUsage({
      eventType: 'qr_print_instructions_requested',
      eventDetail: {
        facilityName: facilityData.facilityName
      }
    });

    // Trigger print dialog
    window.print();
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
              Post these QR codes throughout your facility for instant worker access
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
                <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                  Scan with Phone Camera
                </Badge>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={downloadQRCode}
              className="bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-700 hover:to-blue-700 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Download QR Code
            </Button>
            
            <Button variant="outline" onClick={copyUrl}>
              <Share className="w-4 h-4 mr-2" />
              Copy URL
            </Button>
            
            <Button variant="outline" onClick={printInstructions}>
              <Printer className="w-4 h-4 mr-2" />
              Print Instructions
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
          📋 Setup Instructions
        </h4>
        
        <div className="space-y-4 text-sm text-gray-600">
          <div className="flex items-start space-x-3">
            <Badge className="bg-blue-100 text-blue-800 border-blue-300 mt-0.5">1</Badge>
            <div>
              <p className="font-medium text-gray-900">Download and Print</p>
              <p>Download the QR code image and print multiple copies on standard 8.5x11" paper.</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <Badge className="bg-blue-100 text-blue-800 border-blue-300 mt-0.5">2</Badge>
            <div>
              <p className="font-medium text-gray-900">Strategic Placement</p>
              <p>Post QR codes in high-traffic areas: break rooms, tool cribs, chemical storage areas, and workstations.</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <Badge className="bg-blue-100 text-blue-800 border-blue-300 mt-0.5">3</Badge>
            <div>
              <p className="font-medium text-gray-900">Worker Training</p>
              <p>Show workers how to scan with their phone camera app - no special app download required.</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <Badge className="bg-blue-100 text-blue-800 border-blue-300 mt-0.5">4</Badge>
            <div>
              <p className="font-medium text-gray-900">Monitor Usage</p>
              <p>All scans and searches are automatically logged for OSHA compliance and audit trails.</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Usage Guidelines */}
      <Card className="p-6 bg-yellow-50 border-yellow-200">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          ⚠️ Important Guidelines
        </h4>
        
        <ul className="space-y-2 text-sm text-gray-700">
          <li>• Protect QR codes from moisture and direct sunlight</li>
          <li>• Replace damaged or faded QR codes immediately</li>
          <li>• Ensure codes are posted at appropriate heights for easy scanning</li>
          <li>• Keep backup printed copies in your EHS office</li>
          <li>• Test QR codes regularly to ensure they're working properly</li>
        </ul>
      </Card>
    </div>
  );
};

export default QRCodeGenerator;
