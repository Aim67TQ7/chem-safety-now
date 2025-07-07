
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QrCode, Monitor } from "lucide-react";
import QRCodeGenerator from "@/components/QRCodeGenerator";
import DesktopLinkGenerator from "@/components/DesktopLinkGenerator";

interface AccessToolsProps {
  facilityData: {
    id: string;
    slug: string;
    facility_name: string | null;
    contact_name: string | null;
    email: string | null;
    address: string | null;
    logo_url?: string;
  };
}

const AccessTools = ({ facilityData }: AccessToolsProps) => {
  const facilityUrl = `https://qrsafetyapp.com/facility/${facilityData.slug}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <QrCode className="w-6 h-6 text-blue-600" />
        <h2 className="text-3xl font-bold text-gray-900">Access Tools</h2>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <Tabs defaultValue="qr-codes" className="w-full">
            <div className="border-b">
              <TabsList className="grid w-full grid-cols-2 rounded-none h-12">
                <TabsTrigger value="qr-codes" className="flex items-center space-x-2">
                  <QrCode className="w-4 h-4" />
                  <span>QR Codes</span>
                </TabsTrigger>
                <TabsTrigger value="desktop-links" className="flex items-center space-x-2">
                  <Monitor className="w-4 h-4" />
                  <span>Desktop Links</span>
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="qr-codes" className="p-6 m-0">
              <QRCodeGenerator 
                facilityData={facilityData}
              />
            </TabsContent>
            
            <TabsContent value="desktop-links" className="p-6 m-0">
              <DesktopLinkGenerator facilityData={facilityData} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccessTools;
