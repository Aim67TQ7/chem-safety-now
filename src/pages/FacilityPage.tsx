
import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bot, Printer, QrCode, AlertCircle } from "lucide-react";
import SDSSearch from "@/components/SDSSearch";
import AIAssistantPopup from "@/components/popups/AIAssistantPopup";
import LabelPrinterPopup from "@/components/popups/LabelPrinterPopup";
import QRCodePopup from "@/components/popups/QRCodePopup";
import FacilityDashboard from "@/components/FacilityDashboard";
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
  const [isAIPopupOpen, setIsAIPopupOpen] = useState(false);
  const [isLabelPopupOpen, setIsLabelPopupOpen] = useState(false);
  const [isQRPopupOpen, setIsQRPopupOpen] = useState(false);
  const [facilityData, setFacilityData] = useState<FacilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDashboard, setShowDashboard] = useState(true);
  const { toast } = useToast();

  // Generate facility URL for QR code - always use production domain
  const facilityUrl = `https://chemlabel-gpt.com/facility/${facilitySlug}`;

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
        
        // Check if dashboard should be hidden (user has searched before)
        const dashboardKey = `dashboard_hidden_${data.id}`;
        const isDashboardHidden = localStorage.getItem(dashboardKey) === 'true';
        setShowDashboard(!isDashboardHidden);
        
        // Set facility context for interaction logging
        interactionLogger.setUserContext(null, data.id);
        
        // Log facility page visit
        interactionLogger.logFacilityUsage({
          eventType: 'facility_page_visit',
          eventDetail: {
            facilitySlug,
            setupMode: isSetup
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
  }, [facilitySlug, isSetup]);

  const handleSearchStart = () => {
    if (showDashboard && facilityData) {
      // Hide dashboard and remember this preference
      setShowDashboard(false);
      localStorage.setItem(`dashboard_hidden_${facilityData.id}`, 'true');
      
      // Log dashboard dismissal
      interactionLogger.logFacilityUsage({
        eventType: 'dashboard_dismissed',
        eventDetail: {
          facilitySlug,
          dismissedBy: 'search_initiated'
        }
      });
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'search':
        // Focus will be handled by SDSSearch component
        handleSearchStart();
        break;
      case 'qr-codes':
        setIsQRPopupOpen(true);
        break;
      case 'labels':
        setIsLabelPopupOpen(true);
        break;
      case 'ai-assistant':
        setIsAIPopupOpen(true);
        break;
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
                variant="default"
                size="sm"
                onClick={() => setIsAIPopupOpen(true)}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white"
                title="Chat with Sarah, your AI Safety Manager"
              >
                <Bot className="w-4 h-4" />
                <span>Ask Sarah</span>
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
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsQRPopupOpen(true)}
                className="flex items-center space-x-2"
              >
                <QrCode className="w-4 h-4" />
                <span>QR Codes</span>
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
        {/* Dashboard - conditionally rendered */}
        {showDashboard && (
          <div className="transition-all duration-500 ease-out">
            <FacilityDashboard 
              facilityData={facilityData} 
              onQuickAction={handleQuickAction}
            />
          </div>
        )}
        
        {/* SDS Search */}
        <SDSSearch 
          facilityData={facilityData} 
          onSearchStart={handleSearchStart}
        />
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
      
      <QRCodePopup
        isOpen={isQRPopupOpen}
        onClose={() => setIsQRPopupOpen(false)}
        facilityData={facilityData}
        facilityUrl={facilityUrl}
      />
    </div>
  );
};

export default FacilityPage;
