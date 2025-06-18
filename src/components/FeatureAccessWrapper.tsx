
import { useState, useEffect, ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Crown, Zap } from "lucide-react";
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      const access = await SubscriptionService.checkFeatureAccess(facilityId, feature);
      setHasAccess(access);
      setLoading(false);
    };

    checkAccess();
  }, [facilityId, feature]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-pulse text-gray-500">Checking access...</div>
      </div>
    );
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  const getFeatureInfo = () => {
    switch (feature) {
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
        </div>
      </CardContent>
    </Card>
  );
};

export default FeatureAccessWrapper;
