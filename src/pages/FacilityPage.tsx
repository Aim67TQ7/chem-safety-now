import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Printer, Bot, QrCode, AlertCircle } from "lucide-react";
import SDSSearch from "@/components/SDSSearch";
import LabelPrinter from "@/components/LabelPrinter";
import AIAssistant from "@/components/AIAssistant";
import QRCodeGenerator from "@/components/QRCodeGenerator";
import AIAssistantPopup from "@/components/popups/AIAssistantPopup";
import LabelPrinterPopup from "@/components/popups/LabelPrinterPopup";
import { interactionLogger } from "@/services/interactionLogger";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FacilityData {
  id: string;
  slug: string;
  facility_name: string | null;
  contact_name: string | null;
  email: string | null;
  address: string | null;
  logo_url?: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
}

const FacilityPage = () => {
  const { facilitySlug } = useParams();
  const [searchParams] = useSearchParams();
  const isSetup = searchParams.get('setup') === 'true';
  const [activeTab, setActiveTab] = useState("search");
  const [isAIPopupOpen, setIsAIPopupOpen] = useState(false);
  const [isLabelPopupOpen, setIsLabelPopupOpen] = useState(false);
  const [facilityData, setFacilityData] = useState<FacilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Generate facility URL for QR code
  const facilityUrl = `${window.location.origin}/facility/${facilitySlug}`;

  useEffect(() => {
    const fetchFacilityData = async () => {
      if (!facilitySlug) {
        setError("No facility slug provided");
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from('facilities')
          .select('*')
          .eq('slug', facilitySlug)
          .single();

        if (fetchError) {
          if (fetchError.code === 'PGRST116') {
            setError("Facility not found");
          } else {
            setError("Failed to load facility data");
          }
          setLoading(false);
          return;
        }

        setFacilityData(data);
        
        // Set facility context for interaction logging
        interactionLogger.setUserContext(null, data.id);
        
        // Log facility page visit
        interactionLogger.logFacilityUsage({
          eventType: 'facility_page_visit',
          eventDetail: {
            facilitySlug,
            setupMode: isSetup,
            tab: activeTab
          }
        });

      } catch (err) {
        console.error('Error fetching facility:', err);
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchFacilityData();
  }, [facilitySlug, isSetup, activeTab]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    if (facilityData) {
      interactionLogger.logFacilityUsage({
        eventType: 'facility_tab_change',
        eventDetail: {
          previousTab: activeTab,
          newTab: value
        }
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Loading facility...</p>
        </div>
      </div>
    );
  }

  if (error || !facilityData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 max-w-md w-full mx-4">
          <div className="text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
            <h1 className="text-2xl font-bold text-gray-900">Facility Not Found</h1>
            <p className="text-gray-600">
              {error || "The facility you're looking for doesn't exist or may have been removed."}
            </p>
            <Button onClick={() => window.location.href = '/'}>
              Return to Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const facilityDisplayName = facilityData.facility_name || 'Facility';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              {facilityData.logo_url ? (
                <img 
                  src={facilityData.logo_url} 
                  alt={facilityDisplayName}
                  className="h-10 w-auto"
                />
              ) : (
                <div className="w-10 h-10 bg-gray-800 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {facilityDisplayName.charAt(0)}
                  </span>
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {facilityDisplayName}
                </h1>
                <p className="text-sm text-gray-600">Chemical Safety Platform</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAIPopupOpen(true)}
                className="flex items-center space-x-2"
              >
                <Bot className="w-4 h-4" />
                <span>AI Assistant</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsLabelPopupOpen(true)}
                className="flex items-center space-x-2"
              >
                <Printer className="w-4 h-4" />
                <span>Print Labels</span>
              </Button>
              
              {isSetup && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  Setup Mode
                </Badge>
              )}
              
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                Active License
              </Badge>
            </div>
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
              <QRCodeGenerator 
                facilityData={facilityData}
                facilityUrl={facilityUrl}
              />
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Popups */}
      <AIAssistantPopup
        isOpen={isAIPopupOpen}
        onClose={() => setIsAIPopupOpen(false)}
        facilityData={facilityData}
      />
      
      <LabelPrinterPopup
        isOpen={isLabelPopupOpen}
        onClose={() => setIsLabelPopupOpen(false)}
      />
    </div>
  );
};

export default FacilityPage;
