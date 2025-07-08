import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, RefreshCw, Database, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { interactionLogger } from '@/services/interactionLogger';
import { AuditService } from '@/services/auditService';

interface LoggingStats {
  auditTrailCount: number;
  facilityUsageCount: number;
  sdsInteractionsCount: number;
  labelGenerationsCount: number;
  aiConversationsCount: number;
  uniqueIpCount: number;
  recentIpAddresses: any[];
  recentAuditEvents: any[];
  recentActivity: any[];
}

export const LoggingVerificationPanel: React.FC = () => {
  const [stats, setStats] = useState<LoggingStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [testingLogging, setTestingLogging] = useState(false);

  const fetchLoggingStats = async () => {
    setLoading(true);
    try {
      // Get counts from all logging tables
      const [
        auditTrailResult,
        facilityUsageResult,
        sdsInteractionsResult,
        labelGenerationsResult,
        aiConversationsResult
      ] = await Promise.all([
        supabase.from('facility_audit_trail').select('*', { count: 'exact' }).limit(0),
        supabase.from('qr_code_interactions').select('*', { count: 'exact' }).limit(0),
        supabase.from('sds_interactions').select('*', { count: 'exact' }).limit(0),
        supabase.from('label_generations').select('*', { count: 'exact' }).limit(0),
        supabase.from('ai_conversations').select('*', { count: 'exact' }).limit(0)
      ]);

      // Get recent audit events
      const { data: recentAudit } = await supabase
        .from('facility_audit_trail')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      // Get recent activity
      const { data: recentActivity } = await supabase
        .from('qr_code_interactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      // Get unique IP addresses from all tables that track IPs
      const [
        errorIps,
        feedbackIps,
        qrIps
      ] = await Promise.all([
        supabase.from('error_tracking').select('ip_address').not('ip_address', 'is', null),
        supabase.from('facility_feedback').select('ip_address').not('ip_address', 'is', null),
        supabase.from('qr_code_interactions').select('ip_address').not('ip_address', 'is', null)
      ]);

      // Combine all IP addresses and get unique ones
      const allIps = [
        ...(errorIps.data || []),
        ...(feedbackIps.data || []),
        ...(qrIps.data || [])
      ].map(item => item.ip_address).filter(ip => ip !== null);

      const uniqueIps = [...new Set(allIps)];

      // Get recent unique IP addresses with metadata
      const { data: recentIpData } = await supabase
        .from('qr_code_interactions')
        .select('ip_address, created_at, metadata')
        .not('ip_address', 'is', null)
        .order('created_at', { ascending: false })
        .limit(10);

      // Process recent IPs to show unique ones with latest activity
      const ipMap = new Map();
      recentIpData?.forEach(item => {
        if (!ipMap.has(item.ip_address)) {
          ipMap.set(item.ip_address, {
            ip_address: item.ip_address,
            last_seen: item.created_at,
            metadata: item.metadata
          });
        }
      });

      const recentUniqueIps = Array.from(ipMap.values()).slice(0, 5);

      setStats({
        auditTrailCount: auditTrailResult.count || 0,
        facilityUsageCount: facilityUsageResult.count || 0,
        sdsInteractionsCount: sdsInteractionsResult.count || 0,
        labelGenerationsCount: labelGenerationsResult.count || 0,
        aiConversationsCount: aiConversationsResult.count || 0,
        uniqueIpCount: uniqueIps.length,
        recentIpAddresses: recentUniqueIps,
        recentAuditEvents: recentAudit || [],
        recentActivity: recentActivity || []
      });
    } catch (error) {
      console.error('Error fetching logging stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const testLoggingSystem = async () => {
    setTestingLogging(true);
    try {
      // Set a test facility context
      interactionLogger.setUserContext(null, 'test-facility-id');
      
      // Test various logging functions
      await Promise.all([
        // Test audit logging
        AuditService.logAction({
          facilityId: 'test-facility-id',
          actionType: 'system_test',
          actionDescription: 'Testing logging system functionality'
        }),
        
        // Test facility usage logging
        interactionLogger.logFacilityUsage({
          eventType: 'system_test',
          eventDetail: { testType: 'logging_verification' }
        }),
        
        // Test SDS interaction logging
        interactionLogger.logSDSInteraction({
          sdsDocumentId: 'test-document-id',
          actionType: 'view',
          metadata: { testType: 'logging_verification' }
        }),
        
        // Test label generation logging
        interactionLogger.logLabelGeneration({
          productName: 'Test Chemical',
          actionType: 'generate',
          metadata: { testType: 'logging_verification' }
        })
      ]);

      // Refresh stats after testing
      setTimeout(() => {
        fetchLoggingStats();
      }, 1000);
      
    } catch (error) {
      console.error('Error testing logging system:', error);
    } finally {
      setTestingLogging(false);
    }
  };

  useEffect(() => {
    fetchLoggingStats();
  }, []);

  const getHealthStatus = () => {
    if (!stats) return { status: 'loading', color: 'text-gray-500' };
    
    const totalEvents = stats.auditTrailCount + stats.facilityUsageCount + 
                       stats.sdsInteractionsCount + stats.labelGenerationsCount;
    
    if (totalEvents === 0) {
      return { 
        status: 'No logging data found', 
        color: 'text-red-600',
        icon: AlertTriangle 
      };
    }
    
    if (totalEvents < 5) {
      return { 
        status: 'Limited logging activity', 
        color: 'text-yellow-600',
        icon: AlertTriangle 
      };
    }
    
    return { 
      status: 'Logging system operational', 
      color: 'text-green-600',
      icon: CheckCircle 
    };
  };

  const healthStatus = getHealthStatus();
  const HealthIcon = healthStatus.icon || CheckCircle;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Logging System Verification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <HealthIcon className={`h-4 w-4 ${healthStatus.color}`} />
            <AlertDescription className={healthStatus.color}>
              <strong>Status:</strong> {healthStatus.status}
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats?.auditTrailCount || 0}
              </div>
              <div className="text-sm text-gray-600">Audit Events</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats?.facilityUsageCount || 0}
              </div>
              <div className="text-sm text-gray-600">Activity Events</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {stats?.sdsInteractionsCount || 0}
              </div>
              <div className="text-sm text-gray-600">SDS Events</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {stats?.labelGenerationsCount || 0}
              </div>
              <div className="text-sm text-gray-600">Label Events</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">
                {stats?.aiConversationsCount || 0}
              </div>
              <div className="text-sm text-gray-600">AI Events</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {stats?.uniqueIpCount || 0}
              </div>
              <div className="text-sm text-gray-600">Unique IPs</div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={fetchLoggingStats} 
              variant="outline" 
              size="sm"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh Stats
            </Button>
            <Button 
              onClick={testLoggingSystem} 
              variant="outline" 
              size="sm"
              disabled={testingLogging}
            >
              <Activity className={`w-4 h-4 mr-2 ${testingLogging ? 'animate-pulse' : ''}`} />
              Test Logging
            </Button>
          </div>
        </CardContent>
      </Card>

      {stats && stats.recentAuditEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Audit Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.recentAuditEvents.map((event, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{event.action_description}</div>
                    <div className="text-xs text-gray-500">
                      {event.facility_id} • {new Date(event.created_at).toLocaleString()}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {event.action_type}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {stats && stats.recentIpAddresses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Unique IP Addresses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.recentIpAddresses.map((ipData, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex-1">
                    <div className="font-medium text-sm font-mono">{ipData.ip_address}</div>
                    <div className="text-xs text-gray-500">
                      Last seen: {new Date(ipData.last_seen).toLocaleString()}
                      {ipData.metadata?.event_detail?.facilityName && 
                        ` • ${ipData.metadata.event_detail.facilityName}`
                      }
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Active
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LoggingVerificationPanel;