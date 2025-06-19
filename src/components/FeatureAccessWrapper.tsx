
import { useState, useEffect, ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Crown, Zap, Calendar, AlertTriangle } from "lucide-react";
import { SubscriptionService } from "@/services/subscriptionService";

interface FeatureAccessWrapperProps {
  children: ReactNode;
  feature: string;
  facilityId: string;
  onUpgrade: () => void;
  fallbackMessage?: string;
  showPreview?: boolean;
}

const FeatureAccessWrapper = ({ 
  children, 
  feature, 
  facilityId, 
  onUpgrade,
  fallbackMessage,
  showPreview = false
}: FeatureAccessWrapperProps) => {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      const [access, sub] = await Promise.all([
        SubscriptionService.checkFeatureAccess(facilityId, feature),
        SubscriptionService.getFacilitySubscription(facilityId)
      ]);
      
      // Improved logic: give users the most permissive access
      if (sub) {
        const basicFeatures = ['sds_search', 'ai_assistant', 'basic_qr_codes', 'incident_reporting'];
        const isBasicFeature = basicFeatures.includes(feature);
        const isActiveTrial = sub.subscription_status === 'trial' && sub.trial_days_remaining > 0;
        
        // Premium users get everything
        if (sub.subscription_status === 'premium') {
          setHasAccess(true);
        }
        // Basic users or active trial users get basic features
        else if (sub.subscription_status === 'basic' || isActiveTrial) {
          setHasAccess(isBasicFeature || access);
        }
        // Otherwise use the server-side access check
        else {
          setHasAccess(access);
        }
      } else {
        setHasAccess(access);
      }
      
      setSubscription(sub);
      setLoading(false);
    };

    checkAccess();
  }, [facilityId, feature]);

  // Check if label printing is blocked due to beta testing
  const isLabelPrintingBlocked = () => {
    if (feature !== 'label_printing') return false;
    
    const currentDate = new Date();
    const launchDate = new Date('2025-07-01');
    return currentDate < launchDate;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-pulse text-gray-500">Checking access...</div>
      </div>
    );
  }

  // Special handling for label printing beta restriction
  if (isLabelPrintingBlocked()) {
    return (
      <Card className="border-2 border-dashed border-orange-200 bg-orange-50">
        <CardContent className="py-12">
          <div className="text-center space-y-4">
            <Calendar className="w-8 h-8 text-orange-500 mx-auto" />
            <div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <h3 className="text-xl font-semibold text-gray-900">
                  GHS Label Printing
                </h3>
                <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">
                  Beta
                </Badge>
              </div>
              <p className="text-gray-600 mb-1">
                Professional, OSHA-compliant chemical labels
              </p>
              <p className="text-sm text-orange-600 font-medium">
                Coming July 1st, 2025 - Currently in Beta Testing
              </p>
            </div>
            
            {showPreview && (
              <div className="relative bg-gray-100 rounded-lg p-4 mb-4">
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-orange-400" />
                </div>
                <div className="opacity-30">
                  {children}
                </div>
              </div>
            )}

            <Button 
              disabled
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-2 cursor-not-allowed opacity-60"
            >
              Available July 1st, 2025
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If user has access, show the content
  if (hasAccess) {
    return <>{children}</>;
  }

  const getFeatureInfo = () => {
    switch (feature) {
      case 'incident_reporting':
        return {
          icon: <AlertTriangle className="w-8 h-8 text-red-500" />,
          title: "Incident Reporting & Management",
          description: "Report, track, and analyze workplace safety incidents with AI-powered insights",
          plan: "Basic"
        };
      case 'label_printing':
        return {
          icon: <Crown className="w-8 h-8 text-purple-500" />,
          title: "GHS Label Printing",
          description: "Create professional, OSHA-compliant chemical labels",
          plan: "Premium"
        };
      case 'dashboards':
        return {
          icon: <Crown className="w-8 h-8 text-purple-500" />,
          title: "Analytics Dashboard",
          description: "Track usage, compliance metrics, and safety insights",
          plan: "Premium"
        };
      case 'sds_search':
        return {
          icon: <Zap className="w-8 h-8 text-blue-500" />,
          title: "SDS Document Search",
          description: "Access comprehensive safety data sheets database",
          plan: "Basic"
        };
      case 'ai_assistant':
        return {
          icon: <Zap className="w-8 h-8 text-blue-500" />,
          title: "Sarah AI Assistant",
          description: "24/7 AI-powered safety guidance and support",
          plan: "Basic"
        };
      default:
        return {
          icon: <Lock className="w-8 h-8 text-gray-500" />,
          title: "Premium Feature",
          description: "This feature requires a subscription",
          plan: "Premium"
        };
    }
  };

  const featureInfo = getFeatureInfo();
  const isTrialUser = subscription?.subscription_status === 'trial' && subscription?.trial_days_remaining > 0;

  return (
    <Card className="border-2 border-dashed border-gray-200">
      <CardContent className="py-12">
        <div className="text-center space-y-4">
          {featureInfo.icon}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {featureInfo.title}
            </h3>
            <p className="text-gray-600 mb-1">
              {fallbackMessage || featureInfo.description}
            </p>
            <p className="text-sm text-gray-500">
              Available with {featureInfo.plan} plan
            </p>
            
            {/* Special messaging for trial users viewing Premium features */}
            {isTrialUser && featureInfo.plan === 'Premium' && (
              <p className="text-sm text-blue-600 font-medium mt-2">
                Continue accessing this page with a Basic subscription
              </p>
            )}
          </div>
          
          {showPreview && (
            <div className="relative bg-gray-100 rounded-lg p-4 mb-4">
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <Lock className="w-6 h-6 text-gray-400" />
              </div>
              <div className="opacity-30">
                {children}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Button 
              onClick={onUpgrade}
              className={`${
                featureInfo.plan === 'Premium' 
                  ? 'bg-purple-600 hover:bg-purple-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white px-8 py-2`}
            >
              Upgrade to {featureInfo.plan}
            </Button>
            
            {/* Show "Continue with Basic" option for trial users viewing Premium features */}
            {isTrialUser && featureInfo.plan === 'Premium' && (
              <p className="text-xs text-gray-500">
                or continue with Basic plan to keep accessing this page
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FeatureAccessWrapper;
