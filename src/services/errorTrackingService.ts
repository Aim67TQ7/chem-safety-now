import { supabase } from "@/integrations/supabase/client";

export type ErrorLevel = 'error' | 'warning' | 'critical';
export type ErrorType = 'client_error' | 'api_error' | 'edge_function_error' | 'database_error';
export type ErrorStatus = 'new' | 'investigating' | 'resolved' | 'ignored';

export interface ErrorTrackingData {
  id: string;
  facility_id?: string;
  error_type: ErrorType;
  error_level: ErrorLevel;
  error_message: string;
  error_stack?: string;
  error_code?: string;
  user_agent?: string;
  url?: string;
  user_id?: string;
  session_id?: string;
  ip_address?: string;
  additional_context: Record<string, any>;
  status: ErrorStatus;
  assigned_to?: string;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

export class ErrorTrackingService {
  private static sessionId = this.generateSessionId();

  private static generateSessionId(): string {
    // Use crypto.randomUUID() for proper UUID generation
    try {
      return crypto.randomUUID();
    } catch (error) {
      // Fallback for environments without crypto.randomUUID()
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
  }

  private static getCurrentFacilityId(): string | undefined {
    // Extract facility ID from current URL if on a facility page
    const path = window.location.pathname;
    const facilityMatch = path.match(/\/facility\/([^\/]+)/);
    if (facilityMatch) {
      // Get facility ID from localStorage cache or URL
      return localStorage.getItem('currentFacilityId') || undefined;
    }
    return undefined;
  }

  static async trackError(
    errorType: ErrorType,
    errorMessage: string,
    errorLevel: ErrorLevel = 'error',
    additionalContext: Record<string, any> = {}
  ): Promise<boolean> {
    try {
      const facilityId = this.getCurrentFacilityId();
      
      // Validate facilityId if it exists (should be a valid UUID)
      if (facilityId && !this.isValidUUID(facilityId)) {
        console.warn('Invalid facility ID detected:', facilityId);
        // Continue without facility ID rather than failing
      }

      const errorData = {
        facility_id: facilityId && this.isValidUUID(facilityId) ? facilityId : null,
        error_type: errorType,
        error_level: errorLevel,
        error_message: errorMessage.substring(0, 1000), // Limit message length
        error_stack: additionalContext.stack?.substring(0, 5000), // Limit stack trace
        error_code: additionalContext.code,
        user_agent: navigator.userAgent,
        url: window.location.href,
        session_id: this.sessionId,
        additional_context: {
          ...additionalContext,
          timestamp: new Date().toISOString(),
          browser: this.getBrowserInfo(),
          viewport: this.getViewportInfo(),
          connectionType: this.getConnectionType()
        }
      };

      const { error } = await supabase
        .from('error_tracking')
        .insert(errorData);

      if (error) {
        console.error('Failed to track error:', error);
        return false;
      }

      // For critical errors, also create a high-priority feedback entry
      if (errorLevel === 'critical' && facilityId && this.isValidUUID(facilityId)) {
        await this.createCriticalErrorFeedback(facilityId, errorMessage, additionalContext);
      }

      return true;
    } catch (error) {
      console.error('Error tracking service failed:', error);
      return false;
    }
  }

  private static isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  private static async createCriticalErrorFeedback(
    facilityId: string | undefined,
    errorMessage: string,
    context: Record<string, any>
  ): Promise<void> {
    if (!facilityId) return;

    try {
      await supabase
        .from('facility_feedback')
        .insert({
          facility_id: facilityId,
          feedback_type: 'problem',
          message: `🚨 CRITICAL ERROR: ${errorMessage}`,
          user_agent: navigator.userAgent,
          priority: 'high',
          metadata: {
            url: window.location.href,
            timestamp: new Date().toISOString(),
            error_context: context,
            auto_generated: true
          }
        });
    } catch (error) {
      console.error('Failed to create critical error feedback:', error);
    }
  }

  static async getErrorsForAdmin(): Promise<ErrorTrackingData[]> {
    try {
      const { data, error } = await supabase
        .from('error_tracking')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching error tracking data:', error);
        return [];
      }

      return (data || []).map(item => ({
        ...item,
        error_type: item.error_type as ErrorType,
        error_level: item.error_level as ErrorLevel,
        status: item.status as ErrorStatus,
        ip_address: item.ip_address ? String(item.ip_address) : undefined,
        additional_context: (item.additional_context as Record<string, any>) || {}
      }));
    } catch (error) {
      console.error('Failed to fetch error tracking data:', error);
      return [];
    }
  }

  static async updateErrorStatus(
    errorId: string,
    status: ErrorStatus,
    assignedTo?: string,
    resolutionNotes?: string
  ): Promise<boolean> {
    try {
      const updateData: any = { status };
      
      if (assignedTo) updateData.assigned_to = assignedTo;
      if (resolutionNotes) updateData.resolution_notes = resolutionNotes;
      if (status === 'resolved') updateData.resolved_at = new Date().toISOString();

      const { error } = await supabase
        .from('error_tracking')
        .update(updateData)
        .eq('id', errorId);

      if (error) {
        console.error('Error updating error status:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to update error status:', error);
      return false;
    }
  }

  // Client-side error tracking helpers
  static trackJSError(error: Error, additionalContext: Record<string, any> = {}) {
    this.trackError('client_error', error.message, 'error', {
      stack: error.stack,
      name: error.name,
      ...additionalContext
    });
  }

  static trackAPIError(
    response: Response,
    requestData: Record<string, any> = {},
    additionalContext: Record<string, any> = {}
  ) {
    const errorLevel: ErrorLevel = response.status >= 500 ? 'critical' : 'error';
    
    this.trackError('api_error', `API Error: ${response.status} ${response.statusText}`, errorLevel, {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
      request_data: requestData,
      ...additionalContext
    });
  }

  static trackDatabaseError(error: any, query: string, additionalContext: Record<string, any> = {}) {
    this.trackError('database_error', error.message, 'critical', {
      query,
      error_code: error.code,
      error_details: error.details,
      ...additionalContext
    });
  }

  private static getBrowserInfo() {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine
    };
  }

  private static getViewportInfo() {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      devicePixelRatio: window.devicePixelRatio
    };
  }

  private static getConnectionType() {
    // @ts-ignore - navigator.connection is experimental
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    return connection ? {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt
    } : null;
  }
}