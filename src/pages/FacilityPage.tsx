
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Search, MessageCircle, Printer, QrCode, MapPin, Clock, Shield, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import QRCodeGenerator from "@/components/QRCodeGenerator";
import SDSSearch from "@/components/SDSSearch";
import AIAssistant from "@/components/AIAssistant";
import LabelPrinter from "@/components/LabelPrinter";

interface FacilityData {
  email: string;
  facilityName: string;
  contactName: string;
  address: string;
  logo: File | null;
  slug: string;
  createdAt: string;
  subscription: {
    status: string;
    expiresAt: string;
  };
}

const FacilityPage = () => {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const isSetup = searchParams.get('setup') === 'true';
  
  const [facilityData, setFacilityData] = useState<FacilityData | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  
  useEffect(() => {
    // Load facility data
    const data = localStorage.getItem(`facility_${slug}`);
    if (data) {
      setFacilityData(JSON.parse(data));
    }
    
    // Get GPS location for compliance
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Location access denied:', error);
        }
      );
    }
    
    // Show setup success message
    if (isSetup) {
      toast({
        title: "🎉 Facility Setup Complete!",
        description: "Your chemical safety platform is now ready for workers.",
      });
    }
  }, [slug, isSetup, toast]);

  if (!facilityData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Facility Not Found</h2>
          <p className="text-gray-600">This facility link may be invalid or expired.</p>
        </Card>
      </div>
    );
  }

  const facilityUrl = `${window.location.origin}/facility/${slug}`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Facility Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{facilityData.facilityName}</h1>
                <div className="flex items-center text-sm text-gray-600 space-x-4">
                  <span className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {facilityData.address}
                  </span>
                  {currentLocation && (
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                      Location Verified
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                <Clock className="w-3 h-3 mr-1" />
                Active License
              </Badge>
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                OSHA Compliant
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Setup Success Banner */}
      {isSetup && (
        <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">🎉 Your Facility is Ready!</h2>
              <p className="text-green-100">
                Workers can now scan QR codes to access chemical safety information. 
                Download your QR code from the "View QR Code" tab below.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="search" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="search" className="flex items-center space-x-2">
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Search SDS</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center space-x-2">
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">AI Assistant</span>
            </TabsTrigger>
            <TabsTrigger value="labels" className="flex items-center space-x-2">
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print Labels</span>
            </TabsTrigger>
            <TabsTrigger value="qr" className="flex items-center space-x-2">
              <QrCode className="w-4 h-4" />
              <span className="hidden sm:inline">View QR Code</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search">
            <SDSSearch facilityData={facilityData} currentLocation={currentLocation} />
          </TabsContent>

          <TabsContent value="ai">
            <AIAssistant facilityData={facilityData} />
          </TabsContent>

          <TabsContent value="labels">
            <LabelPrinter facilityData={facilityData} />
          </TabsContent>

          <TabsContent value="qr">
            <QRCodeGenerator 
              facilityData={facilityData} 
              facilityUrl={facilityUrl}
              isSetup={isSetup}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default FacilityPage;
