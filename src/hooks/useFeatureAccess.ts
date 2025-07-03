import { useState, useEffect } from 'react';
import { SubscriptionService, FacilitySubscription } from '@/services/subscriptionService';

interface FeatureAccessHook {
  subscription: FacilitySubscription | null;
  loading: boolean;
  hasFeatureAccess: (feature: string) => boolean;
  refetch: () => void;
}

export const useFeatureAccess = (facilityId: string): FeatureAccessHook => {
  const [subscription, setSubscription] = useState<FacilitySubscription | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSubscription = async () => {
    if (!facilityId) return;
    
    setLoading(true);
    try {
      const subscriptionData = await SubscriptionService.getFacilitySubscription(facilityId);
      setSubscription(subscriptionData);
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [facilityId]);

  const hasFeatureAccess = (feature: string): boolean => {
    if (!subscription) return false;
    
    const basicFeatures = ['sds_search', 'ai_assistant', 'basic_qr_codes', 'incident_reporting', 'incidents'];
    const isBasicFeature = basicFeatures.includes(feature);
    const isActiveTrial = subscription.subscription_status === 'trial' && subscription.trial_days_remaining > 0;
    
    // Active trial users get full access to basic features
    if (isActiveTrial && isBasicFeature) {
      return true;
    }
    
    // Premium users get everything
    if (subscription.subscription_status === 'premium') {
      return true;
    }
    
    // Basic users get basic features only
    if (subscription.subscription_status === 'basic' && isBasicFeature) {
      return true;
    }
    
    return false;
  };

  return {
    subscription,
    loading,
    hasFeatureAccess,
    refetch: fetchSubscription
  };
};