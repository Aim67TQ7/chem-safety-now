import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, AlertTriangle, CheckCircle, Calendar, CreditCard } from "lucide-react";
import { SubscriptionService, FacilitySubscription } from "@/services/subscriptionService";
import { supabase } from "@/integrations/supabase/client";
import SubscriptionPlansModal from "./SubscriptionPlansModal";
import { toast } from "sonner";

interface SubscriptionStatusIndicatorProps {
  facilityId: string;
  facilitySlug?: string;
  showManageButton?: boolean;
  compact?: boolean;
}

const SubscriptionStatusIndicator = ({ 
  facilityId, 
  facilitySlug,
  showManageButton = false,
  compact = false 
}: SubscriptionStatusIndicatorProps) => {
  const [subscription, setSubscription] = useState<FacilitySubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPlansModal, setShowPlansModal] = useState(false);
  const [managingSubscription, setManagingSubscription] = useState(false);

  useEffect(() => {
    fetchSubscription();
  }, [facilityId]);

  const fetchSubscription = async () => {
    setLoading(true);
    try {
      const subscriptionData = await SubscriptionService.getFacilitySubscription(facilityId);
      setSubscription(subscriptionData);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setManagingSubscription(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast.error('Failed to open subscription management. Please try again.');
    } finally {
      setManagingSubscription(false);
    }
  };

  const getStatusBadge = () => {
    if (!subscription) return null;

    const isTrialExpired = subscription.subscription_status === 'trial' && subscription.trial_days_remaining <= 0;
    
    if (isTrialExpired) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Trial Expired
        </Badge>
      );
    }

    if (subscription.subscription_status === 'trial') {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          Trial ({subscription.trial_days_remaining} days left)
        </Badge>
      );
    }

    const statusColors = {
      basic: 'bg-blue-100 text-blue-800 border-blue-200',
      pro: 'bg-purple-100 text-purple-800 border-purple-200',
      premium: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };

    return (
      <Badge className={`flex items-center gap-1 ${statusColors[subscription.subscription_status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
        <CheckCircle className="w-3 h-3" />
        {subscription.subscription_status.charAt(0).toUpperCase() + subscription.subscription_status.slice(1)} Plan
      </Badge>
    );
  };

  const getTimeRemaining = () => {
    if (!subscription) return null;

    if (subscription.subscription_status === 'trial') {
      return subscription.trial_days_remaining > 0 
        ? `${subscription.trial_days_remaining} days remaining`
        : 'Trial expired';
    }

    if (subscription.subscription_days_remaining !== undefined) {
      return `${subscription.subscription_days_remaining} days until renewal`;
    }

    return null;
  };

  if (loading) {
    return compact ? (
      <div className="animate-pulse bg-gray-200 h-6 w-24 rounded"></div>
    ) : (
      <Card>
        <CardContent className="p-4">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!subscription) return null;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {getStatusBadge()}
        {subscription.subscription_status !== 'premium' && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowPlansModal(true)}
            className="flex items-center gap-1"
          >
            <Crown className="w-3 h-3" />
            Upgrade
          </Button>
        )}
        <SubscriptionPlansModal
          isOpen={showPlansModal}
          onClose={() => setShowPlansModal(false)}
          facilityId={facilityId}
          currentPlan={subscription.subscription_status}
          facilitySlug={facilitySlug}
        />
      </div>
    );
  }

  const isTrialExpired = subscription.subscription_status === 'trial' && subscription.trial_days_remaining <= 0;

  return (
    <>
      <Card className={isTrialExpired ? 'border-red-200 bg-red-50' : ''}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Subscription Status</CardTitle>
            {getStatusBadge()}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {getTimeRemaining() && (
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {getTimeRemaining()}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            {subscription.subscription_status !== 'premium' && (
              <Button
                onClick={() => setShowPlansModal(true)}
                className="flex items-center gap-2"
              >
                <Crown className="w-4 h-4" />
                {isTrialExpired ? 'Subscribe Now' : 'Upgrade Plan'}
              </Button>
            )}
            
            {showManageButton && subscription.subscription_status !== 'trial' && (
              <Button
                variant="outline"
                onClick={handleManageSubscription}
                disabled={managingSubscription}
                className="flex items-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                {managingSubscription ? 'Loading...' : 'Manage'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <SubscriptionPlansModal
        isOpen={showPlansModal}
        onClose={() => setShowPlansModal(false)}
        facilityId={facilityId}
        currentPlan={subscription.subscription_status}
        facilitySlug={facilitySlug}
      />
    </>
  );
};

export default SubscriptionStatusIndicator;