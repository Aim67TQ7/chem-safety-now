import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import FacilityDashboard from "@/components/FacilityDashboard";
import SDSSearch from "@/components/SDSSearch";
import QRCodeGenerator from "@/components/QRCodeGenerator";
import LabelPrinter from "@/components/LabelPrinter";
import AIAssistant from "@/components/AIAssistant";
import FeatureAccessWrapper from "@/components/FeatureAccessWrapper";
import SubscriptionStatusHeader from "@/components/SubscriptionStatusHeader";
import { SubscriptionService } from "@/services/subscriptionService";

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

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading facility...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center">Error: {error}</div>;
  }

  if (!facilityData) {
    return <div className="min-h-screen flex items-center justify-center">Facility not found.</div>;
  }

  const facilityUrl = `https://chemlabel-gpt.lovable.app/facility/${facilityData.slug}`;

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
      case 'labels':
        setCurrentView('label-printer');
        break;
      case 'ai-assistant':
        setCurrentView('ai-assistant');
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
      <h1 className="text-2xl font-bold mb-4">{facilityData.facility_name} Dashboard</h1>
      {renderView()}
    </div>
  );
};

export default FacilityPage;
