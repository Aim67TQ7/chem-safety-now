
import { supabase } from "@/integrations/supabase/client";

interface BaseInteraction {
  facilityId?: string;
  sessionId?: string;
  userId?: string;
  userAgent?: string;
  ipAddress?: string;
  metadata?: Record<string, any>;
}

interface AIConversationLog extends BaseInteraction {
  question: string;
  response: string;
  responseTimeMs?: number;
}

interface LabelGenerationLog extends BaseInteraction {
  productName: string;
  manufacturer?: string;
  hazardCodes?: any[];
  pictograms?: any[];
  labelType?: string;
  actionType: 'generate' | 'print' | 'download';
}

interface QRCodeInteractionLog extends BaseInteraction {
  qrCodeId?: string;
  actionType: 'download' | 'print' | 'copy_url' | 'scan';
}

interface SDSInteractionLog extends BaseInteraction {
  sdsDocumentId?: string;
  actionType: 'view' | 'download' | 'generate_label' | 'ask_ai';
  searchQuery?: string;
}

interface FacilityUsageLog extends BaseInteraction {
  eventType: string;
  eventDetail?: Record<string, any>;
  lat?: number;
  lng?: number;
  durationMs?: number;
}

class InteractionLogger {
  private sessionId: string;
  private facilityId?: string;
  private userId?: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.setupSessionTracking();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async setupSessionTracking() {
    const facilityId = this.getFacilityIdFromUrl();
    if (facilityId) {
      this.facilityId = facilityId;
      await this.startSession();
    }
  }

  private getFacilityIdFromUrl(): string | undefined {
    const path = window.location.pathname;
    const match = path.match(/\/facility\/([^\/]+)/);
    return match ? match[1] : undefined;
  }

  private async startSession() {
    if (!this.facilityId) return;

    const userAgent = navigator.userAgent;
    let location = { lat: null, lng: null };

    // Try to get location
    if (navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
      } catch (error) {
        console.log('Could not get location:', error);
      }
    }

    // Create session record
    await supabase.from('facility_user_sessions').insert({
      facility_id: this.facilityId,
      session_token: this.sessionId,
      user_agent: userAgent,
      location_lat: location.lat,
      location_lng: location.lng,
      page_views: [{ page: window.location.pathname, timestamp: new Date().toISOString() }]
    });
  }

  public setUserId(userId: string) {
    this.userId = userId;
  }

  public async logAIConversation(data: AIConversationLog) {
    const startTime = Date.now();
    try {
      await supabase.from('ai_conversations').insert({
        facility_id: this.facilityId,
        session_id: this.sessionId,
        user_id: this.userId,
        question: data.question,
        response: data.response,
        response_time_ms: data.responseTimeMs,
        metadata: data.metadata || {}
      });
    } catch (error) {
      console.error('Failed to log AI conversation:', error);
    }
  }

  public async logLabelGeneration(data: LabelGenerationLog) {
    try {
      await supabase.from('label_generations').insert({
        facility_id: this.facilityId,
        session_id: this.sessionId,
        user_id: this.userId,
        product_name: data.productName,
        manufacturer: data.manufacturer,
        hazard_codes: data.hazardCodes || [],
        pictograms: data.pictograms || [],
        label_type: data.labelType || 'secondary_container',
        action_type: data.actionType,
        metadata: data.metadata || {}
      });
    } catch (error) {
      console.error('Failed to log label generation:', error);
    }
  }

  public async logQRCodeInteraction(data: QRCodeInteractionLog) {
    try {
      await supabase.from('qr_code_interactions').insert({
        facility_id: this.facilityId,
        qr_code_id: data.qrCodeId,
        session_id: this.sessionId,
        user_id: this.userId,
        action_type: data.actionType,
        user_agent: navigator.userAgent,
        metadata: data.metadata || {}
      });
    } catch (error) {
      console.error('Failed to log QR code interaction:', error);
    }
  }

  public async logSDSInteraction(data: SDSInteractionLog) {
    try {
      await supabase.from('sds_interactions').insert({
        facility_id: this.facilityId,
        sds_document_id: data.sdsDocumentId,
        session_id: this.sessionId,
        user_id: this.userId,
        action_type: data.actionType,
        search_query: data.searchQuery,
        metadata: data.metadata || {}
      });
    } catch (error) {
      console.error('Failed to log SDS interaction:', error);
    }
  }

  public async logFacilityUsage(data: FacilityUsageLog) {
    try {
      await supabase.from('facility_usage_logs').insert({
        facility_id: this.facilityId,
        session_id: this.sessionId,
        user_id: this.userId,
        event_type: data.eventType,
        event_detail: data.eventDetail || {},
        lat: data.lat,
        lng: data.lng,
        duration_ms: data.durationMs,
        user_agent: navigator.userAgent
      });
    } catch (error) {
      console.error('Failed to log facility usage:', error);
    }
  }

  public async updatePageView(page: string) {
    if (!this.facilityId) return;

    try {
      // Get current session
      const { data: session } = await supabase
        .from('facility_user_sessions')
        .select('page_views')
        .eq('session_token', this.sessionId)
        .single();

      if (session) {
        const pageViews = session.page_views || [];
        pageViews.push({ page, timestamp: new Date().toISOString() });

        await supabase
          .from('facility_user_sessions')
          .update({ page_views: pageViews })
          .eq('session_token', this.sessionId);
      }
    } catch (error) {
      console.error('Failed to update page view:', error);
    }
  }

  public async endSession() {
    if (!this.facilityId) return;

    try {
      const { data: session } = await supabase
        .from('facility_user_sessions')
        .select('start_time')
        .eq('session_token', this.sessionId)
        .single();

      if (session) {
        const totalDuration = Date.now() - new Date(session.start_time).getTime();
        
        await supabase
          .from('facility_user_sessions')
          .update({ 
            end_time: new Date().toISOString(),
            total_duration_ms: totalDuration
          })
          .eq('session_token', this.sessionId);
      }
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  }
}

// Create singleton instance
export const interactionLogger = new InteractionLogger();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  interactionLogger.endSession();
});
