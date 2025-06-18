
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export interface FeedbackData {
  id: string;
  facility_id: string;
  feedback_type: 'comment' | 'suggestion' | 'problem';
  message: string;
  contact_info: string | null;
  user_agent: string | null;
  ip_address: unknown | null;
  status: 'new' | 'reviewed' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  metadata: Json | null;
  created_at: string;
  updated_at: string;
}

export interface FeedbackWithFacility extends FeedbackData {
  facility_name?: string;
}

export class FeedbackService {
  static async submitFeedback(
    facilityId: string,
    feedbackType: 'comment' | 'suggestion' | 'problem',
    message: string,
    contactInfo?: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('facility_feedback')
        .insert({
          facility_id: facilityId,
          feedback_type: feedbackType,
          message: message.trim(),
          contact_info: contactInfo?.trim() || null,
          user_agent: navigator.userAgent,
          metadata: {
            url: window.location.href,
            timestamp: new Date().toISOString()
          }
        });

      if (error) {
        console.error('Error submitting feedback:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      return false;
    }
  }

  static async getFeedbackForAdmin(): Promise<FeedbackWithFacility[]> {
    try {
      const { data, error } = await supabase
        .from('facility_feedback')
        .select(`
          *,
          facilities (
            facility_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching feedback:', error);
        return [];
      }

      return (data || []).map(item => {
        const { facilities, ...feedbackData } = item;
        return {
          ...feedbackData,
          feedback_type: feedbackData.feedback_type as 'comment' | 'suggestion' | 'problem',
          status: feedbackData.status as 'new' | 'reviewed' | 'resolved',
          priority: feedbackData.priority as 'low' | 'medium' | 'high',
          contact_info: feedbackData.contact_info as string | null,
          user_agent: feedbackData.user_agent as string | null,
          ip_address: feedbackData.ip_address as unknown | null,
          metadata: feedbackData.metadata as Json | null,
          facility_name: facilities?.facility_name || 'Unknown Facility'
        };
      });
    } catch (error) {
      console.error('Failed to fetch feedback:', error);
      return [];
    }
  }

  static async updateFeedbackStatus(
    feedbackId: string,
    status: 'new' | 'reviewed' | 'resolved'
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('facility_feedback')
        .update({ status })
        .eq('id', feedbackId);

      if (error) {
        console.error('Error updating feedback status:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to update feedback status:', error);
      return false;
    }
  }
}
