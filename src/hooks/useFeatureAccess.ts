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
    
    const basicFeatures = ['sds_search'];
    const proFeatures = ['ai_assistant', 'basic_qr_codes', 'label_printing', 'custom_branding'];
    const premiumFeatures = ['incident_reporting', 'incidents', 'audit_trails'];
    
    const isBasicFeature = basicFeatures.includes(feature);
    const isProFeature = proFeatures.includes(feature);
    const isPremiumFeature = premiumFeatures.includes(feature);
    const isActiveTrial = subscription.subscription_status === 'trial' && subscription.trial_days_remaining > 0;
    
    // Active trial users get access to all features
    if (isActiveTrial && (isBasicFeature || isProFeature || isPremiumFeature)) {
      return true;
    }
    
    // Premium users get everything
    if (subscription.subscription_status === 'premium') {
      return true;
    }
    
    // Pro users get basic + pro features
    if (subscription.subscription_status === 'pro' && (isBasicFeature || isProFeature)) {
      return true;
    }
    
    // Basic users get only basic features
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