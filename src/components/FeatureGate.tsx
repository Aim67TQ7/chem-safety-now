import { ReactNode, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Crown, Zap } from "lucide-react";
import { SubscriptionService, FacilitySubscription } from "@/services/subscriptionService";
import SubscriptionPlansModal from "./SubscriptionPlansModal";

interface FeatureGateProps {
  children: ReactNode;
  feature: string;
  facilityId: string;
  facilitySlug?: string;
  fallbackTitle?: string;
  fallbackMessage?: string;
  showPreview?: boolean;
}

const FeatureGate = ({ 
  children, 
  feature, 
  facilityId,
  facilitySlug,
  fallbackTitle,
  fallbackMessage,
  showPreview = false
}: FeatureGateProps) => {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [subscription, setSubscription] = useState<FacilitySubscription | null>(null);
  const [showPlansModal, setShowPlansModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAccess();
  }, [facilityId, feature]);

  const checkAccess = async () => {
    setLoading(true);
    try {
      const [accessResult, subscriptionData] = await Promise.all([
        SubscriptionService.checkFeatureAccess(facilityId, feature),
        SubscriptionService.getFacilitySubscription(facilityId)
      ]);
      
      setHasAccess(accessResult);
      setSubscription(subscriptionData);
    } catch (error) {
      console.error('Error checking feature access:', error);
      setHasAccess(false);
    } finally {
      setLoading(false);
    }
  };

  const getRequiredTier = () => {
    return SubscriptionService.getFeatureTier(feature);
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'pro': return <Zap className="w-5 h-5 text-blue-500" />;
      case 'premium': return <Crown className="w-5 h-5 text-purple-500" />;
      default: return <Lock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'pro': return 'border-blue-200 bg-blue-50';
      case 'premium': return 'border-purple-200 bg-purple-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="bg-gray-200 h-40 rounded-lg"></div>
      </div>
    );
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  const requiredTier = getRequiredTier();
  const isTrialExpired = subscription?.subscription_status === 'trial' && 
                         subscription?.trial_days_remaining <= 0;

  return (
    <>
      <Card className={`${getTierColor(requiredTier)} relative overflow-hidden`}>
        {showPreview && (
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            {children}
          </div>
        )}
        
        <div className={showPreview ? 'relative bg-white/90 backdrop-blur-sm m-4 rounded-lg' : ''}>
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-2">
              {getTierIcon(requiredTier)}
            </div>
            <CardTitle className="text-lg">
              {fallbackTitle || `${requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1)} Feature`}
            </CardTitle>
          </CardHeader>
          
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              {fallbackMessage || 
               `This feature requires a ${requiredTier} subscription. ${isTrialExpired ? 'Your trial has expired.' : 'Upgrade to unlock this feature.'}`}
            </p>
            
            {subscription && (
              <div className="bg-white/50 p-3 rounded-lg text-sm text-gray-600">
                Current plan: <span className="font-medium">
                  {subscription.subscription_status === 'trial' 
                    ? `Trial (${subscription.trial_days_remaining} days left)`
                    : subscription.subscription_status.charAt(0).toUpperCase() + subscription.subscription_status.slice(1)
                  }
                </span>
              </div>
            )}
            
            <Button
              onClick={() => setShowPlansModal(true)}
              className="w-full"
            >
              {isTrialExpired ? 'Subscribe Now' : `Upgrade to ${requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1)}`}
            </Button>
          </CardContent>
        </div>
      </Card>

      <SubscriptionPlansModal
        isOpen={showPlansModal}
        onClose={() => setShowPlansModal(false)}
        facilityId={facilityId}
        currentPlan={subscription?.subscription_status}
        facilitySlug={facilitySlug}
      />
    </>
  );
};

export default FeatureGate;