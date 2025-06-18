import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  TrendingUp, 
  Clock, 
  Shield, 
  Users, 
  BarChart3,
  FileText,
  QrCode,
  Printer,
  Bot,
  Settings
} from "lucide-react";
import SubscriptionStatusHeader from "./SubscriptionStatusHeader";
import SubscriptionPlansModal from "./SubscriptionPlansModal";
import FeatureAccessWrapper from "./FeatureAccessWrapper";
import { SubscriptionService, FacilitySubscription } from "@/services/subscriptionService";

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

interface FacilityDashboardProps {
  facilityData: FacilityData;
  onQuickAction: (action: string) => void;
}

const FacilityDashboard = ({ facilityData, onQuickAction }: FacilityDashboardProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [subscription, setSubscription] = useState<FacilitySubscription | null>(null);
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchSubscription = async () => {
      const sub = await SubscriptionService.getFacilitySubscription(facilityData.id);
      setSubscription(sub);
    };

    fetchSubscription();
  }, [facilityData.id]);

  const facilityDisplayName = facilityData.facility_name || 'Your Facility';
  
  // Check if label printing is in beta (before July 1, 2025)
  const isLabelPrintingInBeta = () => {
    const currentDate = new Date();
    const launchDate = new Date('2025-07-01');
    return currentDate < launchDate;
  };
  
  const quickActions = [
    {
      icon: Search,
      title: "Search Chemicals",
      description: "Find SDS documents instantly",
      action: "search",
      color: "bg-blue-500 hover:bg-blue-600",
      feature: "sds_search"
    },
    {
      icon: QrCode,
      title: "Generate QR Codes",
      description: "Create facility QR codes",
      action: "qr-codes",
      color: "bg-green-500 hover:bg-green-600",
      feature: "basic_qr_codes"
    },
    {
      icon: Printer,
      title: "Print Labels",
      description: isLabelPrintingInBeta() ? "Coming July 1st, 2025" : "Create GHS compliant labels",
      action: "labels",
      color: "bg-purple-500 hover:bg-purple-600",
      feature: "label_printing",
      isBeta: isLabelPrintingInBeta()
    },
    {
      icon: Bot,
      title: "Ask Sarah",
      description: "Get AI safety assistance",
      action: "ai-assistant",
      color: "bg-orange-500 hover:bg-orange-600",
      feature: "ai_assistant"
    },
    {
      icon: Settings,
      title: "Facility Settings",
      description: "Update facility information",
      action: "settings",
      color: "bg-gray-500 hover:bg-gray-600",
      feature: null
    }
  ];

  const safetyTips = [
    "Always read SDS documents before handling chemicals",
    "Ensure proper PPE is worn when working with hazardous materials",
    "Keep emergency contact information easily accessible",
    "Regular safety training keeps everyone protected"
  ];

  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  useEffect(() => {
    const tipTimer = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % safetyTips.length);
    }, 10000);
    return () => clearInterval(tipTimer);
  }, []);

  const handleQuickAction = async (action: string, feature?: string) => {
    if (feature) {
      const hasAccess = await SubscriptionService.checkFeatureAccess(facilityData.id, feature);
      if (!hasAccess) {
        setShowUpgradeModal(true);
        return;
      }
    }
    
    onQuickAction(action);
  };

  return (
    <div className="space-y-6 mb-8 animate-fade-in">
      {/* Subscription Status Header */}
      <SubscriptionStatusHeader 
        facilityId={facilityData.id}
        onUpgrade={() => setShowUpgradeModal(true)}
      />

      {/* Welcome Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-900">
          Welcome to {facilityDisplayName}
        </h2>
        <p className="text-gray-600">
          Your chemical safety platform is ready. Start by searching for a chemical or exploring the quick actions below.
        </p>
        <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Shield className="w-3 h-3 mr-1" />
            OSHA Compliant
          </Badge>
        </div>
      </div>

      {/* Quick Actions Grid - Updated to 5 columns to accommodate settings */}
      <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
        {quickActions.map((action) => (
          <Card 
            key={action.action}
            className="hover:shadow-lg transition-all duration-200 cursor-pointer transform hover:scale-105"
            onClick={() => handleQuickAction(action.action, action.feature)}
          >
            <CardContent className="p-6 text-center">
              <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mx-auto mb-3 transition-colors`}>
                <action.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{action.title}</h3>
              <p className="text-sm text-gray-600">{action.description}</p>
              <div className="flex justify-center items-center gap-2 mt-2">
                {action.feature === 'label_printing' && subscription && !SubscriptionService.hasPremiumAccess(subscription) && (
                  <Badge variant="outline" className="text-xs text-purple-600 border-purple-200">
                    Premium
                  </Badge>
                )}
                {action.isBeta && (
                  <Badge variant="outline" className="text-xs text-orange-600 border-orange-200 bg-orange-50">
                    Beta
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Statistics Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Users className="w-5 h-5 mr-2 text-blue-500" />
              Facility Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Subscription Status</span>
                <Badge className={`${
                  subscription?.subscription_status === 'trial' ? 'bg-yellow-100 text-yellow-800' :
                  subscription?.subscription_status === 'basic' ? 'bg-blue-100 text-blue-800' :
                  subscription?.subscription_status === 'premium' ? 'bg-purple-100 text-purple-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {subscription?.subscription_status === 'trial' ? 'Trial' :
                   subscription?.subscription_status === 'basic' ? 'Basic' :
                   subscription?.subscription_status === 'premium' ? 'Premium' : 'Unknown'}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Platform Access</span>
                <span className="text-sm font-medium">24/7 Available</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Last Updated</span>
                <span className="text-sm font-medium">
                  {new Date(facilityData.updated_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <FeatureAccessWrapper
          feature="dashboards"
          facilityId={facilityData.id}
          onUpgrade={() => setShowUpgradeModal(true)}
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-purple-500" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">SDS Database</span>
                  <span className="text-sm font-medium">1000+ Documents</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Search Response</span>
                  <span className="text-sm font-medium">Under 2 seconds</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">AI Assistant</span>
                  <Badge variant="outline" className="text-xs">Sarah Ready</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </FeatureAccessWrapper>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Shield className="w-5 h-5 mr-2 text-orange-500" />
              Safety Tip
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 leading-relaxed">
              {safetyTips[currentTipIndex]}
            </p>
            <div className="flex mt-3 space-x-1">
              {safetyTips.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentTipIndex ? 'bg-orange-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Getting Started Guide */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-2">Getting Started</h3>
              <p className="text-sm text-gray-600 mb-3">
                New to ChemLabel-GPT? Here's how to get the most out of your chemical safety platform:
              </p>
              <div className="grid md:grid-cols-2 gap-3 text-xs text-gray-600">
                <div className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div>
                  Search for any chemical by product name
                </div>
                <div className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div>
                  Generate QR codes for facility access
                </div>
                <div className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div>
                  Print GHS compliant labels (Coming July 1st)
                </div>
                <div className="flex items-center">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div>
                  Ask Sarah for safety guidance anytime
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Plans Modal */}
      <SubscriptionPlansModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        facilityId={facilityData.id}
        currentPlan={subscription?.subscription_status}
      />
    </div>
  );
};

export default FacilityDashboard;
