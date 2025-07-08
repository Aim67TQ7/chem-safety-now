import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crown, Clock, Shield, UserPlus } from "lucide-react";
import { FacilitySubscription } from "@/services/subscriptionService";
import { useDemoContext } from "@/contexts/DemoContext";

interface SubscriptionBadgeProps {
  subscription: FacilitySubscription | null;
  onUpgrade: () => void;
  loading?: boolean;
}

const SubscriptionBadge = ({ subscription, onUpgrade, loading }: SubscriptionBadgeProps) => {
  const { isDemo, navigateToSignup } = useDemoContext();

  // Hide subscription badge completely in demo mode
  if (isDemo) {
    return null;
  }

  if (loading || !subscription) {
    return (
      <div className="flex items-center space-x-2">
        <div className="h-6 w-20 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  const renderTrialBadge = () => (
    <div className="flex items-center space-x-2">
      <Badge 
        variant="secondary" 
        className="bg-trial-foreground text-trial border-trial/20 flex items-center gap-1"
      >
        <Clock className="w-3 h-3" />
        Trial - {subscription.trial_days_remaining} days left
      </Badge>
      <Button 
        size="sm" 
        onClick={onUpgrade}
        className="bg-trial hover:bg-trial/90 text-trial-foreground font-medium px-4 py-1 h-8"
      >
        UPGRADE
      </Button>
    </div>
  );

  const renderBasicBadge = () => (
    <Badge 
      variant="secondary" 
      className="bg-basic-foreground text-basic border-basic/20 flex items-center gap-1"
    >
      <Shield className="w-3 h-3" />
      Basic Plan
    </Badge>
  );

  const renderPremiumBadge = () => (
    <Badge 
      variant="default" 
      className="bg-premium-foreground text-premium border-premium/20 flex items-center gap-1"
    >
      <Crown className="w-3 h-3" />
      Premium Plan
    </Badge>
  );

  switch (subscription.subscription_status) {
    case 'trial':
      return subscription.trial_days_remaining > 0 ? renderTrialBadge() : renderBasicBadge();
    case 'basic':
      return renderBasicBadge();
    case 'premium':
      return renderPremiumBadge();
    default:
      return renderTrialBadge();
  }
};

export default SubscriptionBadge;