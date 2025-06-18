import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import FacilityDashboard from "@/components/FacilityDashboard";
import SDSSearch from "@/components/SDSSearch";
import QRCodeGenerator from "@/components/QRCodeGenerator";
import LabelPrinter from "@/components/LabelPrinter";
import AIAssistant from "@/components/AIAssistant";
import DesktopLinkGenerator from "@/components/DesktopLinkGenerator";
import FacilitySettings from "@/components/FacilitySettings";
import FeatureAccessWrapper from "@/components/FeatureAccessWrapper";
import SubscriptionStatusHeader from "@/components/SubscriptionStatusHeader";
import FeedbackPopup from "@/components/FeedbackPopup";
import { SubscriptionService } from "@/services/subscriptionService";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings } from "lucide-react";

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
  const navigate = useNavigate();
  const [facilityData, setFacilityData] = useState<FacilityData | null>(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFacilityData = async () => {
      if (!facilitySlug) {
        setError('Facility slug is required');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('facilities')
          .select('*')
          .eq('slug', facilitySlug)
          .single();

        if (error) {
          console.error('Error fetching facility:', error);
          setError('Facility not found');
          setLoading(false);
          return;
        }

        setFacilityData(data);

        // Check if trial has expired and redirect if needed
        const subscription = await SubscriptionService.getFacilitySubscription(data.id);
        if (subscription && SubscriptionService.isTrialExpired(subscription)) {
          navigate(`/subscribe/${facilitySlug}`);
          return;
        }

        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch facility data:', error);
        setError('Failed to load facility');
        setLoading(false);
      }
    };

    fetchFacilityData();
  }, [facilitySlug, navigate]);

  const handleFacilityUpdate = (updatedData: FacilityData) => {
    setFacilityData(updatedData);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading facility...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center">Error: {error}</div>;
  }

  if (!facilityData) {
    return <div className="min-h-screen flex items-center justify-center">Facility not found.</div>;
  }

  const facilityUrl = `https://chemlabel-gpt.com/facility/${facilityData.slug}`;

  const handleUpgrade = () => {
    navigate(`/subscribe/${facilitySlug}`);
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <FacilityDashboard
            facilityData={facilityData}
            onQuickAction={handleQuickAction}
          />
        );
      case 'sds-search':
        return (
          <FeatureAccessWrapper
            feature="sds_search"
            facilityId={facilityData.id}
            onUpgrade={handleUpgrade}
          >
            <SDSSearch facilityData={facilityData} />
          </FeatureAccessWrapper>
        );
      case 'qr-generator':
        return <QRCodeGenerator facilityData={facilityData} facilityUrl={facilityUrl} />;
      case 'desktop-links':
        return <DesktopLinkGenerator facilityData={facilityData} />;
      case 'label-printer':
        return (
          <FeatureAccessWrapper
            feature="label_printing"
            facilityId={facilityData.id}
            onUpgrade={handleUpgrade}
          >
            <LabelPrinter />
          </FeatureAccessWrapper>
        );
      case 'ai-assistant':
        return (
          <FeatureAccessWrapper
            feature="ai_assistant"
            facilityId={facilityData.id}
            onUpgrade={handleUpgrade}
          >
            <AIAssistant facilityData={facilityData} />
          </FeatureAccessWrapper>
        );
      case 'settings':
        return (
          <FacilitySettings 
            facilityData={facilityData} 
            onFacilityUpdate={handleFacilityUpdate}
          />
        );
      default:
        return <FacilityDashboard facilityData={facilityData} onQuickAction={handleQuickAction} />;
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'search':
        setCurrentView('sds-search');
        break;
      case 'qr-codes':
        setCurrentView('qr-generator');
        break;
      case 'desktop-links':
        setCurrentView('desktop-links');
        break;
      case 'labels':
        setCurrentView('label-printer');
        break;
      case 'ai-assistant':
        setCurrentView('ai-assistant');
        break;
      case 'settings':
        setCurrentView('settings');
        break;
      default:
        setCurrentView('dashboard');
    }
  };

  return (
    <div className="container mx-auto py-8">
      <SubscriptionStatusHeader 
        facilityId={facilityData.id} 
        onUpgrade={handleUpgrade}
      />
      
      {/* Header with navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          {currentView !== 'dashboard' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentView('dashboard')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </Button>
          )}
          <h1 className="text-2xl font-bold">{facilityData.facility_name} Dashboard</h1>
        </div>
        
        {currentView !== 'settings' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentView('settings')}
            className="flex items-center space-x-2"
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </Button>
        )}
      </div>

      {renderView()}

      {/* Feedback Popup */}
      <FeedbackPopup 
        facilityId={facilityData.id}
        facilityName={facilityData.facility_name || 'Your Facility'}
      />
    </div>
  );
};

export default FacilityPage;
