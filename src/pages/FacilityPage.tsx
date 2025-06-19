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
import SubscriptionPlansModal from "@/components/SubscriptionPlansModal";
import FeedbackPopup from "@/components/FeedbackPopup";
import { SubscriptionService } from "@/services/subscriptionService";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { IncidentsList } from "@/components/incidents/IncidentsList";
import { IncidentReportForm } from "@/components/incidents/IncidentReportForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

interface SubscriptionInfo {
  subscription_status: 'trial' | 'basic' | 'premium' | 'expired';
  trial_days_remaining?: number;
}

const FacilityPage = () => {
  const { facilitySlug } = useParams();
  const navigate = useNavigate();
  const [facilityData, setFacilityData] = useState<FacilityData | null>(null);
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

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

        // Check subscription status
        const subscription = await SubscriptionService.getFacilitySubscription(data.id);
        if (subscription) {
          setSubscriptionInfo(subscription);
          
          // Check if trial has expired and redirect if needed
          if (SubscriptionService.isTrialExpired(subscription)) {
            navigate(`/subscribe/${facilitySlug}`);
            return;
          }
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

  const handleUpgrade = () => {
    setShowSubscriptionModal(true);
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

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <FacilityDashboard
            facilityData={facilityData}
            subscriptionInfo={subscriptionInfo}
            onQuickAction={handleQuickAction}
            onUpgrade={handleUpgrade}
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
      case 'incidents':
        return (
          <FeatureAccessWrapper
            feature="incident_reporting"
            facilityId={facilityData.id}
            onUpgrade={handleUpgrade}
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-gray-900">Incident Management</h2>
              </div>
              <Tabs defaultValue="list" className="w-full">
                <TabsList className="grid w-fit grid-cols-2">
                  <TabsTrigger value="list">Incident List</TabsTrigger>
                  <TabsTrigger value="report">Report Incident</TabsTrigger>
                </TabsList>
                <TabsContent value="list" className="space-y-4">
                  <IncidentsList />
                </TabsContent>
                <TabsContent value="report" className="space-y-4">
                  <IncidentReportForm facilityData={facilityData} />
                </TabsContent>
              </Tabs>
            </div>
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
        return (
          <FacilityDashboard 
            facilityData={facilityData} 
            subscriptionInfo={subscriptionInfo}
            onQuickAction={handleQuickAction}
            onUpgrade={handleUpgrade}
          />
        );
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'search':
        setCurrentView('sds-search');
        break;
      case 'incidents':
        setCurrentView('incidents');
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
      {/* Only show subscription status warning on dashboard view */}
      {currentView === 'dashboard' && (
        <SubscriptionStatusHeader 
          facilityId={facilityData.id} 
          onUpgrade={handleUpgrade}
        />
      )}
      
      {/* Header with navigation - only show back button when not on dashboard */}
      {currentView !== 'dashboard' && (
        <div className="flex items-center space-x-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentView('dashboard')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Button>
          <h1 className="text-2xl font-bold">{facilityData.facility_name} Dashboard</h1>
        </div>
      )}

      {renderView()}

      {/* Subscription Plans Modal */}
      <SubscriptionPlansModal
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        facilityId={facilityData.id}
        currentPlan={subscriptionInfo?.subscription_status}
        facilitySlug={facilitySlug}
      />

      {/* Feedback Popup */}
      <FeedbackPopup 
        facilityId={facilityData.id}
        facilityName={facilityData.facility_name || 'Your Facility'}
      />
    </div>
  );
};

export default FacilityPage;
