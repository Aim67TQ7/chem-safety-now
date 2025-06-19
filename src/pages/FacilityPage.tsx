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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, FileText } from "lucide-react";
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

interface SubscriptionInfo {
  subscription_status: 'trial' | 'basic' | 'premium' | 'expired';
  trial_days_remaining?: number;
}

const FacilityPage = () => {
  const { facilitySlug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [facilityData, setFacilityData] = useState<FacilityData | null>(null);
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [selectedIncidentType, setSelectedIncidentType] = useState<'near_miss' | 'reportable' | null>(null);
  const [activeTab, setActiveTab] = useState('list');

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

  const handleIncidentSuccess = () => {
    toast({
      title: "Incident Report Submitted",
      description: "Your incident report has been successfully submitted.",
    });
    setSelectedIncidentType(null);
    setActiveTab('list');
  };

  const handleIncidentCancel = () => {
    setSelectedIncidentType(null);
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

  const renderIncidentTypeSelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Select Incident Type</h3>
        <p className="text-gray-600">Choose the type of incident you want to report</p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <Card 
          className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-orange-300"
          onClick={() => setSelectedIncidentType('near_miss')}
        >
          <CardHeader className="text-center">
            <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <CardTitle className="text-orange-700">Near Miss Incident</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-center">
              Report incidents that could have resulted in injury, illness, or property damage but didn't.
            </p>
            <ul className="mt-4 text-sm text-gray-500 space-y-1">
              <li>• Close calls and potential hazards</li>
              <li>• Unsafe conditions discovered</li>
              <li>• Equipment malfunctions without injury</li>
            </ul>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-red-300"
          onClick={() => setSelectedIncidentType('reportable')}
        >
          <CardHeader className="text-center">
            <FileText className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-700">Reportable Incident</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-center">
              Report actual incidents involving injury, illness, or property damage.
            </p>
            <ul className="mt-4 text-sm text-gray-500 space-y-1">
              <li>• Workplace injuries</li>
              <li>• Occupational illnesses</li>
              <li>• Property damage incidents</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );

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
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-fit grid-cols-2">
                  <TabsTrigger value="list">Incident List</TabsTrigger>
                  <TabsTrigger value="report">Report Incident</TabsTrigger>
                </TabsList>
                <TabsContent value="list" className="space-y-4">
                  <IncidentsList />
                </TabsContent>
                <TabsContent value="report" className="space-y-4">
                  {selectedIncidentType ? (
                    <IncidentReportForm 
                      incidentType={selectedIncidentType}
                      onSuccess={handleIncidentSuccess}
                      onCancel={handleIncidentCancel}
                    />
                  ) : (
                    renderIncidentTypeSelection()
                  )}
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
        setSelectedIncidentType(null); // Reset incident type when navigating to incidents
        setActiveTab('list'); // Start on list tab
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
