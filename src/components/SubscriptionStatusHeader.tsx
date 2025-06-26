
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

  // Don't show for expired subscriptions
  if (SubscriptionService.isTrialExpired(subscription) && subscription.subscription_status === 'trial') {
    return null;
  }

  // Show warning for trials ending in 2 days or less
  const showTrialWarning = subscription.subscription_status === 'trial' && subscription.trial_days_remaining <= 2;
  
  // Show countdown for paid subscriptions ending in 7 days or less
  const showPaidCountdown = ['basic', 'premium'].includes(subscription.subscription_status) && 
                           subscription.subscription_days_remaining !== undefined && 
                           subscription.subscription_days_remaining <= 7;

  // Don't show anything if no warnings needed
  if (!showTrialWarning && !showPaidCountdown) {
    return null;
  }

  return (
    <Card className={`mb-4 ${showTrialWarning ? 'border-yellow-200 bg-yellow-50' : 'border-blue-200 bg-blue-50'}`}>
      <CardContent className="py-3">
        <div className={`flex items-center justify-center space-x-2 ${showTrialWarning ? 'text-yellow-700' : 'text-blue-700'}`}>
          {showTrialWarning ? (
            <>
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">
                Trial ending in {subscription.trial_days_remaining} day{subscription.trial_days_remaining !== 1 ? 's' : ''} - upgrade to continue access to SDS search and Sarah AI
              </span>
            </>
          ) : (
            <>
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">
                Your {subscription.subscription_status} subscription expires in {subscription.subscription_days_remaining} day{subscription.subscription_days_remaining !== 1 ? 's' : ''}
              </span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionStatusHeader;
