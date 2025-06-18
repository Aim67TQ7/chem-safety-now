
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

  // Don't show for expired trials - they'll see the subscription page
  if (SubscriptionService.isTrialExpired(subscription)) {
    return null;
  }

  // Only show warning for trials ending in 2 days or less
  const showWarning = subscription.subscription_status === 'trial' && subscription.trial_days_remaining <= 2;

  if (!showWarning) {
    return null;
  }

  return (
    <Card className="mb-4 border-yellow-200 bg-yellow-50">
      <CardContent className="py-3">
        <div className="flex items-center justify-center space-x-2 text-yellow-700">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm font-medium">
            Trial ending in {subscription.trial_days_remaining} day{subscription.trial_days_remaining !== 1 ? 's' : ''} - upgrade to continue access to SDS search and Sarah AI
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionStatusHeader;
