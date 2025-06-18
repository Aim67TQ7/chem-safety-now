
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Crown, AlertTriangle } from "lucide-react";
import { SubscriptionService, FacilitySubscription } from "@/services/subscriptionService";

interface SubscriptionStatusHeaderProps {
  facilityId: string;
  onUpgrade: () => void;
}

const SubscriptionStatusHeader = ({ facilityId, onUpgrade }: SubscriptionStatusHeaderProps) => {
  const [subscription, setSubscription] = useState<FacilitySubscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscription = async () => {
      const sub = await SubscriptionService.getFacilitySubscription(facilityId);
      setSubscription(sub);
      setLoading(false);
    };

    fetchSubscription();
    
    // Refresh every minute to update countdown
    const interval = setInterval(fetchSubscription, 60000);
    return () => clearInterval(interval);
  }, [facilityId]);

  if (loading || !subscription) {
    return null;
  }

  // Don't show for expired trials - they'll see the subscription page
  if (SubscriptionService.isTrialExpired(subscription)) {
    return null;
  }

  const getStatusBadge = () => {
    switch (subscription.subscription_status) {
      case 'trial':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            {subscription.trial_days_remaining} day{subscription.trial_days_remaining !== 1 ? 's' : ''} left in trial
          </Badge>
        );
      case 'basic':
        return (
          <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
            Basic Plan
          </Badge>
        );
      case 'premium':
        return (
          <Badge variant="default" className="bg-purple-50 text-purple-700 border-purple-200">
            <Crown className="w-3 h-3 mr-1" />
            Premium Plan
          </Badge>
        );
      default:
        return null;
    }
  };

  const showUpgradePrompt = subscription.subscription_status === 'trial' && subscription.trial_days_remaining <= 3;

  return (
    <Card className={`mb-4 ${showUpgradePrompt ? 'border-yellow-200 bg-yellow-50' : ''}`}>
      <CardContent className="py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStatusBadge()}
            {showUpgradePrompt && (
              <div className="flex items-center text-sm text-yellow-700">
                <AlertTriangle className="w-4 h-4 mr-1" />
                <span>Trial ending soon - upgrade to continue access to SDS search and Sarah AI</span>
              </div>
            )}
          </div>
          
          {subscription.subscription_status === 'trial' && (
            <Button 
              onClick={onUpgrade}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Upgrade Now
            </Button>
          )}
          
          {subscription.subscription_status === 'basic' && (
            <Button 
              onClick={onUpgrade}
              size="sm"
              variant="outline"
              className="border-purple-200 text-purple-700 hover:bg-purple-50"
            >
              Upgrade to Premium
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionStatusHeader;
