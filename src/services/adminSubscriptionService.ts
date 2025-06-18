
import { supabase } from "@/integrations/supabase/client";

export interface AdminAction {
  id: string;
  facility_id: string;
  admin_user_email: string;
  action_type: string;
  previous_status: string | null;
  new_status: string | null;
  previous_access_level: string | null;
  new_access_level: string | null;
  duration_months: number | null;
  notes: string | null;
  created_at: string;
}

export class AdminSubscriptionService {
  static async grantFreeAccess(
    facilityId: string,
    planType: 'basic' | 'premium',
    durationMonths: number,
    adminEmail: string,
    notes?: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('grant_free_subscription', {
        p_facility_id: facilityId,
        p_plan_type: planType,
        p_duration_months: durationMonths,
        p_admin_email: adminEmail,
        p_notes: notes || null
      });

      if (error) {
        console.error('Error granting free access:', error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error('Error granting free access:', error);
      return false;
    }
  }

  static async extendTrial(
    facilityId: string,
    days: number,
    adminEmail: string,
    notes?: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('extend_trial_period', {
        p_facility_id: facilityId,
        p_days: days,
        p_admin_email: adminEmail,
        p_notes: notes || null
      });

      if (error) {
        console.error('Error extending trial:', error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error('Error extending trial:', error);
      return false;
    }
  }

  static async resetSubscription(
    facilityId: string,
    adminEmail: string,
    notes?: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('reset_facility_subscription', {
        p_facility_id: facilityId,
        p_admin_email: adminEmail,
        p_notes: notes || null
      });

      if (error) {
        console.error('Error resetting subscription:', error);
        return false;
      }

      return data === true;
    } catch (error) {
      console.error('Error resetting subscription:', error);
      return false;
    }
  }

  static async getAdminActions(facilityId?: string): Promise<AdminAction[]> {
    try {
      let query = supabase
        .from('admin_subscription_actions')
        .select('*')
        .order('created_at', { ascending: false });

      if (facilityId) {
        query = query.eq('facility_id', facilityId);
      }

      const { data, error } = await query.limit(50);

      if (error) {
        console.error('Error fetching admin actions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching admin actions:', error);
      return [];
    }
  }
}
