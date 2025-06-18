
import { supabase } from "@/integrations/supabase/client";

export interface FeedbackData {
  id: string;
  facility_id: string;
  feedback_type: 'comment' | 'suggestion' | 'problem';
  message: string;
  contact_info?: string;
  user_agent?: string;
  ip_address?: string;
  status: 'new' | 'reviewed' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  metadata: Record<string, any>;
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

      return (data || []).map(item => ({
        ...item,
        feedback_type: item.feedback_type as 'comment' | 'suggestion' | 'problem',
        status: item.status as 'new' | 'reviewed' | 'resolved',
        priority: item.priority as 'low' | 'medium' | 'high',
        facility_name: item.facilities?.facility_name || 'Unknown Facility'
      }));
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
