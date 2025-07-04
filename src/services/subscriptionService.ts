
import { supabase } from "@/integrations/supabase/client";

export interface SubscriptionPlan {
  id: string;
  name: string;
  monthly_price: number;
  annual_price: number;
  stripe_monthly_price_id?: string;
  stripe_annual_price_id?: string;
  features: string[];
}

export interface FacilitySubscription {
  subscription_status: 'trial' | 'basic' | 'premium' | 'expired';
  feature_access_level: 'trial' | 'basic' | 'premium' | 'expired';
  trial_start_date: string;
  trial_end_date: string;
  trial_days_remaining: number;
  subscription_days_remaining?: number; // New field for paid subscription countdown
}

export class SubscriptionService {
  static async checkFeatureAccess(facilityId: string, featureName: string): Promise<boolean> {
    try {
      // Get facility subscription info first to handle trial users properly
      const subscription = await this.getFacilitySubscription(facilityId);
      
      if (subscription) {
        // Enhanced logic for trial users - they get access to basic and premium features during trial
        const basicFeatures = ['sds_search', 'ai_assistant', 'basic_qr_codes'];
        const premiumFeatures = ['incident_reporting', 'incidents'];
        const isBasicFeature = basicFeatures.includes(featureName);
        const isPremiumFeature = premiumFeatures.includes(featureName);
        const isActiveTrial = subscription.subscription_status === 'trial' && subscription.trial_days_remaining > 0;
        
        // Active trial users get access to all features (basic + premium)
        if (isActiveTrial && (isBasicFeature || isPremiumFeature)) {
          return true;
        }
        
        // Premium users get everything
        if (subscription.subscription_status === 'premium') {
          return true;
        }
        
        // Basic users get only basic features (no premium features like incidents)
        if (subscription.subscription_status === 'basic' && isBasicFeature) {
          return true;
        }
      }

      // Fallback to server-side check for complex cases
      const { data, error } = await supabase.rpc('check_feature_access', {
        p_facility_id: facilityId,
        p_feature_name: featureName
      });

      if (error) {
        console.error('Error checking feature access:', error);
        return false;
      }

      return data || false;
    } catch (error) {
      console.error('Feature access check failed:', error);
      return false;
    }
  }

  static async getFacilitySubscription(facilityId: string): Promise<FacilitySubscription | null> {
    try {
      const { data, error } = await supabase
        .from('facilities')
        .select(`
          subscription_status,
          feature_access_level,
          trial_start_date,
          trial_end_date
        `)
        .eq('id', facilityId)
        .single();

      if (error || !data) {
        console.error('Error fetching facility subscription:', error);
        return null;
      }

      const trialEndDate = new Date(data.trial_end_date);
      const now = new Date();
      const timeDiff = trialEndDate.getTime() - now.getTime();
      const trialDaysRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));

      // Calculate subscription days remaining for paid plans
      let subscriptionDaysRemaining: number | undefined;
      
      if (['basic', 'premium'].includes(data.subscription_status)) {
        // For paid subscriptions, use trial_end_date as the subscription end date
        // This assumes that when a subscription is granted, trial_end_date is updated to the subscription end date
        const subscriptionEndDate = new Date(data.trial_end_date);
        const subscriptionTimeDiff = subscriptionEndDate.getTime() - now.getTime();
        subscriptionDaysRemaining = Math.max(0, Math.ceil(subscriptionTimeDiff / (1000 * 3600 * 24)));
      }

      return {
        subscription_status: data.subscription_status as 'trial' | 'basic' | 'premium' | 'expired',
        feature_access_level: data.feature_access_level as 'trial' | 'basic' | 'premium' | 'expired',
        trial_start_date: data.trial_start_date,
        trial_end_date: data.trial_end_date,
        trial_days_remaining: trialDaysRemaining,
        subscription_days_remaining: subscriptionDaysRemaining
      };
    } catch (error) {
      console.error('Failed to get facility subscription:', error);
      return null;
    }
  }

  static async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('monthly_price', { ascending: true });

      if (error) {
        console.error('Error fetching subscription plans:', error);
        return [];
      }

      // Type cast and handle the Json features array
      return (data || []).map(plan => ({
        id: plan.id,
        name: plan.name,
        monthly_price: plan.monthly_price,
        annual_price: plan.annual_price,
        stripe_monthly_price_id: plan.stripe_monthly_price_id,
        stripe_annual_price_id: plan.stripe_annual_price_id,
        features: Array.isArray(plan.features) ? plan.features as string[] : []
      }));
    } catch (error) {
      console.error('Failed to get subscription plans:', error);
      return [];
    }
  }

  static isTrialExpired(subscription: FacilitySubscription): boolean {
    return subscription.subscription_status === 'trial' && subscription.trial_days_remaining <= 0;
  }

  static hasBasicAccess(subscription: FacilitySubscription): boolean {
    return ['basic', 'premium'].includes(subscription.feature_access_level) || 
           (subscription.subscription_status === 'trial' && subscription.trial_days_remaining > 0);
  }

  static hasPremiumAccess(subscription: FacilitySubscription): boolean {
    return subscription.feature_access_level === 'premium' || 
           (subscription.subscription_status === 'trial' && subscription.trial_days_remaining > 0);
  }

  // Enhanced method to check if a feature is available for trial users
  static isFeatureAvailableForTrial(featureName: string): boolean {
    const trialFeatures = ['sds_search', 'ai_assistant', 'basic_qr_codes', 'incident_reporting', 'incidents'];
    return trialFeatures.includes(featureName);
  }

  // Enhanced method to get feature tier
  static getFeatureTier(featureName: string): 'basic' | 'premium' {
    const basicFeatures = ['sds_search', 'ai_assistant', 'basic_qr_codes'];
    const premiumFeatures = ['incident_reporting', 'incidents'];
    
    if (basicFeatures.includes(featureName)) return 'basic';
    if (premiumFeatures.includes(featureName)) return 'premium';
    return 'premium'; // Default to premium for unknown features
  }
}
