
import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Printer, Bot, QrCode, Settings } from "lucide-react";
import SDSSearch from "@/components/SDSSearch";
import LabelPrinter from "@/components/LabelPrinter";
import AIAssistant from "@/components/AIAssistant";
import QRCodeGenerator from "@/components/QRCodeGenerator";
import { interactionLogger } from "@/services/interactionLogger";

const FacilityPage = () => {
  const { facilitySlug } = useParams();
  const [searchParams] = useSearchParams();
  const isSetup = searchParams.get('setup') === 'true';
  const [activeTab, setActiveTab] = useState("search");

  // Mock facility data - in real app, this would come from API
  const facilityData = {
    facilityName: "Bunting Magnetics",
    facilitySlug: facilitySlug,
    logoUrl: null,
    setupMode: isSetup
  };

  useEffect(() => {
    // Set facility context for interaction logging
    interactionLogger.setUserContext(null, facilityData.facilitySlug);
    
    // Log facility page visit
    interactionLogger.logFacilityUsage({
      eventType: 'facility_page_visit',
      eventDetail: {
        facilitySlug,
        setupMode: isSetup,
        tab: activeTab
      }
    });
  }, [facilitySlug, isSetup, activeTab]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    interactionLogger.logFacilityUsage({
      eventType: 'facility_tab_change',
      eventDetail: {
        previousTab: activeTab,
        newTab: value
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              {facilityData.logoUrl ? (
                <img 
                  src={facilityData.logoUrl} 
                  alt={facilityData.facilityName}
                  className="h-10 w-auto"
                />
              ) : (
                <div className="w-10 h-10 bg-gray-800 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {facilityData.facilityName.charAt(0)}
                  </span>
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {facilityData.facilityName}
                </h1>
                <p className="text-sm text-gray-600">Chemical Safety Platform</p>
              </div>
            </div>
            
            {isSetup && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Setup Mode
              </Badge>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="search" className="flex items-center space-x-2">
              <Search className="w-4 h-4" />
              <span>SDS Search</span>
            </TabsTrigger>
            <TabsTrigger value="labels" className="flex items-center space-x-2">
              <Printer className="w-4 h-4" />
              <span>Print Labels</span>
            </TabsTrigger>
            <TabsTrigger value="assistant" className="flex items-center space-x-2">
              <Bot className="w-4 h-4" />
              <span>AI Assistant</span>
            </TabsTrigger>
            <TabsTrigger value="qr" className="flex items-center space-x-2">
              <QrCode className="w-4 h-4" />
              <span>QR Codes</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-6">
            <SDSSearch facilityData={facilityData} />
          </TabsContent>

          <TabsContent value="labels" className="space-y-6">
            <Card className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  GHS Label Printer
                </h2>
                <p className="text-sm text-gray-600">
                  Create compliant chemical labels with HMIS ratings, pictograms, and hazard information
                </p>
              </div>
              <LabelPrinter />
            </Card>
          </TabsContent>

          <TabsContent value="assistant" className="space-y-6">
            <Card className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  Chemical Safety Assistant
                </h2>
                <p className="text-sm text-gray-600">
                  Get expert guidance on chemical safety protocols and regulatory compliance
                </p>
              </div>
              <AIAssistant facilityData={facilityData} />
            </Card>
          </TabsContent>

          <TabsContent value="qr" className="space-y-6">
            <Card className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  QR Code Generator
                </h2>
                <p className="text-sm text-gray-600">
                  Generate QR codes for quick access to safety information and documentation
                </p>
              </div>
              <QRCodeGenerator />
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default FacilityPage;
