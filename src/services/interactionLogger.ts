
import { supabase } from "@/integrations/supabase/client";

// Generate a proper UUID for session ID
const generateSessionId = (): string => {
  return crypto.randomUUID();
};

class InteractionLogger {
  private sessionId: string;
  private currentUserId: string | null = null;
  private currentFacilityId: string | null = null;
  private facilityIdCache: Map<string, string> = new Map();

  constructor() {
    // Use crypto.randomUUID() for proper UUID format
    this.sessionId = generateSessionId();
    console.log('InteractionLogger initialized with session ID:', this.sessionId);
  }

  // Convert facility slug to UUID
  private async getFacilityIdFromSlug(facilitySlug: string): Promise<string | null> {
    // Check cache first
    if (this.facilityIdCache.has(facilitySlug)) {
      return this.facilityIdCache.get(facilitySlug) || null;
    }

    try {
      const { data, error } = await supabase
        .from('facilities')
        .select('id')
        .eq('slug', facilitySlug)
        .single();

      if (error || !data) {
        console.error('Failed to get facility ID from slug:', error);
        return null;
      }

      // Cache the result
      this.facilityIdCache.set(facilitySlug, data.id);
      return data.id;
    } catch (error) {
      console.error('Error getting facility ID from slug:', error);
      return null;
    }
  }

  // Set current user context - now handles both slugs and UUIDs
  async setUserContext(userIdOrFacilitySlug: string | null, facilityIdOrSlug: string | null = null) {
    this.currentUserId = userIdOrFacilitySlug;
    
    if (facilityIdOrSlug) {
      // Check if it's a UUID or a slug
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      
      if (uuidRegex.test(facilityIdOrSlug)) {
        // It's already a UUID
        this.currentFacilityId = facilityIdOrSlug;
      } else {
        // It's a slug, convert to UUID
        this.currentFacilityId = await this.getFacilityIdFromSlug(facilityIdOrSlug);
      }
    }
  }

  // Set facility context by slug
  async setFacilityBySlug(facilitySlug: string) {
    this.currentFacilityId = await this.getFacilityIdFromSlug(facilitySlug);
  }

  // Log facility usage with proper error handling
  async logFacilityUsage(params: {
    eventType: string;
    eventDetail?: any;
    lat?: number;
    lng?: number;
    durationMs?: number;
    facilitySlug?: string; // Allow passing facility slug directly
  }) {
    try {
      let facilityId = this.currentFacilityId;
      
      // If facility slug is provided, convert it to UUID
      if (params.facilitySlug && !facilityId) {
        facilityId = await this.getFacilityIdFromSlug(params.facilitySlug);
      }

      const payload = {
        session_id: this.sessionId,
        facility_id: facilityId,
        user_id: this.currentUserId,
        event_type: params.eventType,
        event_detail: params.eventDetail || {},
        lat: params.lat,
        lng: params.lng,
        duration_ms: params.durationMs,
        user_agent: navigator.userAgent
      };

      console.log('Logging facility usage:', payload);

      const { error } = await supabase
        .from('facility_usage_logs')
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
    actionType: 'view' | 'download' | 'generate_label' | 'ask_ai';
    searchQuery?: string;
    metadata?: any;
    facilitySlug?: string;
  }) {
    try {
      let facilityId = this.currentFacilityId;
      
      if (params.facilitySlug && !facilityId) {
        facilityId = await this.getFacilityIdFromSlug(params.facilitySlug);
      }

      const { error } = await supabase
        .from('sds_interactions')
        .insert({
          session_id: this.sessionId,
          facility_id: facilityId,
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
  async updatePageView(page: string, facilitySlug?: string) {
    try {
      await this.logFacilityUsage({
        eventType: 'page_view',
        eventDetail: { page },
        facilitySlug
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
