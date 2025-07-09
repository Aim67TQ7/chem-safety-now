import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Shield, Clock, User, FileText, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AuditRecord {
  id: string;
  action_type: string;
  action_description: string;
  table_name: string | null;
  record_id: string | null;
  old_values: any;
  new_values: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

interface AuditTrailProps {
  facilityId: string;
}

const AuditTrail = ({ facilityId }: AuditTrailProps) => {
  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuditRecords();
  }, [facilityId]);

  const fetchAuditRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('facility_audit_trail')
        .select('*')
        .eq('facility_id', facilityId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      // Transform the data to match our interface, ensuring ip_address is a string
      const transformedData = (data || []).map(record => ({
        ...record,
        ip_address: record.ip_address ? String(record.ip_address) : null
      }));
      
      setAuditRecords(transformedData);
    } catch (error) {
      console.error('Error fetching audit records:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType.toLowerCase()) {
      case 'create':
      case 'insert':
        return <FileText className="w-4 h-4 text-green-600" />;
      case 'update':
      case 'modify':
        return <User className="w-4 h-4 text-blue-600" />;
      case 'delete':
      case 'remove':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActionBadge = (actionType: string) => {
    switch (actionType.toLowerCase()) {
      case 'create':
      case 'insert':
        return <Badge variant="default" className="bg-green-100 text-green-800">Create</Badge>;
      case 'update':
      case 'modify':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Update</Badge>;
      case 'delete':
      case 'remove':
        return <Badge variant="destructive">Delete</Badge>;
      case 'incident_report':
        return <Badge variant="default" className="bg-orange-100 text-orange-800">Incident</Badge>;
      case 'sds_access':
        return <Badge variant="outline">SDS Access</Badge>;
      case 'ai_interaction':
        return <Badge variant="outline">AI Chat</Badge>;
      default:
        return <Badge variant="secondary">{actionType}</Badge>;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const truncateText = (text: string, maxLength: number = 50) => {
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            OSHA Compliance Audit Trail
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading audit records...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          OSHA Compliance Audit Trail
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Complete record of all safety-related activities for regulatory compliance (10 most recent)
        </p>
      </CardHeader>
      <CardContent>
        {auditRecords.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-muted-foreground">No audit records found</p>
            <p className="text-sm text-muted-foreground mt-2">
              Activity will be automatically tracked here for OSHA compliance
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Table/Record</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getActionIcon(record.action_type)}
                        {getActionBadge(record.action_type)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <div className="font-medium text-sm">
                          {truncateText(record.action_description)}
                        </div>
                        {(record.old_values || record.new_values) && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Changes recorded
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {record.table_name && (
                          <div className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                            {record.table_name}
                          </div>
                        )}
                        {record.record_id && (
                          <div className="text-xs text-muted-foreground mt-1">
                            ID: {record.record_id.substring(0, 8)}...
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatTimestamp(record.created_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-mono">
                        {record.ip_address || '—'}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AuditTrail;
