
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, QrCode, Printer, Share } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface QRCodeGeneratorProps {
  facilityData: any;
  facilityUrl: string;
  isSetup?: boolean;
}

const QRCodeGenerator = ({ facilityData, facilityUrl, isSetup }: QRCodeGeneratorProps) => {
  const { toast } = useToast();

  const downloadQRCode = () => {
    // In a real implementation, this would generate and download a QR code image
    toast({
      title: "QR Code Downloaded",
      description: "Your facility QR code has been saved to downloads.",
    });
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(facilityUrl);
    toast({
      title: "URL Copied",
      description: "Facility URL copied to clipboard.",
    });
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
            <div className="w-64 h-64 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
              <div className="text-center space-y-4">
                <QrCode className="w-16 h-16 text-gray-400 mx-auto" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-900">{facilityData.facilityName}</p>
                  <p className="text-xs text-gray-500">Chemical Safety Portal</p>
                  <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                    Scan with Phone Camera
                  </Badge>
                </div>
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
            
            <Button variant="outline" onClick={downloadQRCode}>
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
