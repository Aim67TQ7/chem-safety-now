
import { supabase } from "@/integrations/supabase/client";

export interface AuditLogEntry {
  facilityId: string;
  actionType: string;
  actionDescription: string;
  tableName?: string;
  recordId?: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditService {
  static async logAction(entry: AuditLogEntry): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('facility_audit_trail')
        .insert({
          facility_id: entry.facilityId,
          action_type: entry.actionType,
          action_description: entry.actionDescription,
          table_name: entry.tableName,
          record_id: entry.recordId,
          old_values: entry.oldValues,
          new_values: entry.newValues,
          ip_address: entry.ipAddress,
          user_agent: entry.userAgent || navigator.userAgent
        });

      if (error) {
        console.error('Audit logging failed:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Audit service error:', error);
      return false;
    }
  }

  // OSHA-specific logging methods
  static async logIncidentReport(facilityId: string, incidentId: string, description: string) {
    return this.logAction({
      facilityId,
      actionType: 'incident_report',
      actionDescription: `Incident report created: ${description}`,
      tableName: 'incidents',
      recordId: incidentId
    });
  }

  static async logSDSAccess(facilityId: string, productName: string, documentId?: string) {
    return this.logAction({
      facilityId,
      actionType: 'sds_access',
      actionDescription: `SDS document accessed: ${productName}`,
      tableName: 'sds_documents',
      recordId: documentId
    });
  }

  static async logSafetyTraining(facilityId: string, trainingType: string, completedBy: string) {
    return this.logAction({
      facilityId,
      actionType: 'safety_training',
      actionDescription: `Safety training completed: ${trainingType} by ${completedBy}`
    });
  }

  static async logHazardAssessment(facilityId: string, hazardType: string, assessmentId: string) {
    return this.logAction({
      facilityId,
      actionType: 'hazard_assessment',
      actionDescription: `Hazard assessment conducted: ${hazardType}`,
      recordId: assessmentId
    });
  }

  static async logAIInteraction(facilityId: string, interactionType: string, query: string) {
    return this.logAction({
      facilityId,
      actionType: 'ai_interaction',
      actionDescription: `AI assistant used for ${interactionType}: ${query.substring(0, 100)}...`
    });
  }
}
