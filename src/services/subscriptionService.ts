
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
}

export class SubscriptionService {
  static async checkFeatureAccess(facilityId: string, featureName: string): Promise<boolean> {
    try {
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
      const daysRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));

      return {
        ...data,
        trial_days_remaining: daysRemaining
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

      return data || [];
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
}
