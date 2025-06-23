
import { supabase } from "@/integrations/supabase/client";

// Generate a proper UUID for session ID
const generateSessionId = (): string => {
  return crypto.randomUUID();
};

class InteractionLogger {
  private sessionId: string;
  private currentUserId: string | null = null;
  private currentFacilityId: string | null = null;

  constructor() {
    // Use crypto.randomUUID() for proper UUID format
    this.sessionId = generateSessionId();
    console.log('InteractionLogger initialized with session ID:', this.sessionId);
  }

  // Set current user context
  setUserContext(userId: string | null, facilityId: string | null = null) {
    this.currentUserId = userId;
    this.currentFacilityId = facilityId;
  }

  // Log facility usage using QR code interactions table as fallback
  async logFacilityUsage(params: {
    eventType: string;
    eventDetail?: any;
    lat?: number;
    lng?: number;
    durationMs?: number;
  }) {
    try {
      // Use qr_code_interactions table as a general event log since facility_usage_logs doesn't exist
      const payload = {
        session_id: this.sessionId,
        facility_id: this.currentFacilityId,
        user_id: this.currentUserId,
        action_type: params.eventType,
        metadata: {
          event_detail: params.eventDetail || {},
          lat: params.lat,
          lng: params.lng,
          duration_ms: params.durationMs,
          user_agent: navigator.userAgent
        }
      };

      console.log('Logging facility usage:', payload);

      const { error } = await supabase
        .from('qr_code_interactions')
        .insert(payload);

      if (error) {
        console.error('Failed to log facility usage:', error);
      }
    } catch (error) {
      console.error('Error logging facility usage:', error);
    }
  }

  // Log SDS interactions
  async logSDSInteraction(params: {
    sdsDocumentId: string;
    actionType: 'view' | 'view_sds' | 'download' | 'generate_label' | 'ask_ai' | 'generate_label_from_ai';
    searchQuery?: string;
    metadata?: any;
  }) {
    try {
      const { error } = await supabase
        .from('sds_interactions')
        .insert({
          session_id: this.sessionId,
          facility_id: this.currentFacilityId,
          user_id: this.currentUserId,
          sds_document_id: params.sdsDocumentId,
          action_type: params.actionType,
          search_query: params.searchQuery,
          metadata: params.metadata || {}
        });

      if (error) {
        console.error('Failed to log SDS interaction:', error);
      }
    } catch (error) {
      console.error('Error logging SDS interaction:', error);
    }
  }

  // Log AI conversations
  async logAIConversation(params: {
    question: string;
    response: string;
    responseTimeMs: number;
    metadata?: any;
  }) {
    try {
      const { error } = await supabase
        .from('ai_conversations')
        .insert({
          session_id: this.sessionId,
          facility_id: this.currentFacilityId,
          user_id: this.currentUserId,
          question: params.question,
          response: params.response,
          response_time_ms: params.responseTimeMs,
          metadata: params.metadata || {}
        });

      if (error) {
        console.error('Failed to log AI conversation:', error);
      }
    } catch (error) {
      console.error('Error logging AI conversation:', error);
    }
  }

  // Log label generations
  async logLabelGeneration(params: {
    productName: string;
    manufacturer?: string;
    actionType: 'generate' | 'download' | 'print';
    labelType?: string;
    hazardCodes?: any[];
    pictograms?: any[];
    metadata?: any;
  }) {
    try {
      const { error } = await supabase
        .from('label_generations')
        .insert({
          session_id: this.sessionId,
          facility_id: this.currentFacilityId,
          user_id: this.currentUserId,
          product_name: params.productName,
          manufacturer: params.manufacturer,
          action_type: params.actionType,
          label_type: params.labelType || 'secondary_container',
          hazard_codes: params.hazardCodes || [],
          pictograms: params.pictograms || [],
          metadata: params.metadata || {}
        });

      if (error) {
        console.error('Failed to log label generation:', error);
      }
    } catch (error) {
      console.error('Error logging label generation:', error);
    }
  }

  // Log QR code interactions
  async logQRCodeInteraction(params: {
    qrCodeId?: string;
    actionType: 'scan' | 'generate' | 'print' | 'view' | 'download' | 'copy_url';
    metadata?: any;
  }) {
    try {
      const { error } = await supabase
        .from('qr_code_interactions')
        .insert({
          session_id: this.sessionId,
          facility_id: this.currentFacilityId,
          user_id: this.currentUserId,
          qr_code_id: params.qrCodeId,
          action_type: params.actionType,
          metadata: params.metadata || {},
          user_agent: navigator.userAgent,
          ip_address: null // Will be set by database if needed
        });

      if (error) {
        console.error('Failed to log QR code interaction:', error);
      }
    } catch (error) {
      console.error('Error logging QR code interaction:', error);
    }
  }

  // Update page view tracking
  async updatePageView(page: string) {
    try {
      // For now, just log as facility usage since page view tracking needs session management
      await this.logFacilityUsage({
        eventType: 'page_view',
        eventDetail: { page }
      });
    } catch (error) {
      console.error('Error updating page view:', error);
    }
  }

  // Get current session ID
  getSessionId(): string {
    return this.sessionId;
  }
}

// Export singleton instance
export const interactionLogger = new InteractionLogger();
