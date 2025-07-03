import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, 
  AlertCircle, 
  Bug, 
  Server, 
  Globe, 
  Database,
  User,
  Clock,
  RefreshCw,
  Eye,
  CheckCircle,
  X
} from 'lucide-react';
import { ErrorTrackingService, ErrorTrackingData, ErrorLevel, ErrorStatus } from '@/services/errorTrackingService';
import { formatDistanceToNow } from 'date-fns';

const AdminErrorPanel = () => {
  const [errors, setErrors] = useState<ErrorTrackingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'new' | 'critical'>('all');

  const fetchErrors = async () => {
    setLoading(true);
    try {
      const errorData = await ErrorTrackingService.getErrorsForAdmin();
      setErrors(errorData);
    } catch (error) {
      console.error('Failed to fetch errors:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchErrors();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchErrors, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredErrors = errors.filter(error => {
    if (filter === 'new') return error.status === 'new';
    if (filter === 'critical') return error.error_level === 'critical';
    return true;
  });

  const errorCounts = {
    total: errors.length,
    new: errors.filter(e => e.status === 'new').length,
    critical: errors.filter(e => e.error_level === 'critical').length,
    resolved: errors.filter(e => e.status === 'resolved').length
  };

  const getErrorIcon = (errorType: string) => {
    switch (errorType) {
      case 'client_error': return <Bug className="w-4 h-4" />;
      case 'api_error': return <Globe className="w-4 h-4" />;
      case 'database_error': return <Database className="w-4 h-4" />;
      case 'edge_function_error': return <Server className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getErrorLevelColor = (level: ErrorLevel) => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'error': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status: ErrorStatus) => {
    switch (status) {
      case 'new': return 'text-red-600 bg-red-50 border-red-200';
      case 'investigating': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'resolved': return 'text-green-600 bg-green-50 border-green-200';
      case 'ignored': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const updateErrorStatus = async (errorId: string, status: ErrorStatus) => {
    try {
      await ErrorTrackingService.updateErrorStatus(errorId, status);
      await fetchErrors(); // Refresh the list
    } catch (error) {
      console.error('Failed to update error status:', error);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading error tracking data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Error Tracking Dashboard
          </div>
          <Button size="sm" variant="outline" onClick={fetchErrors}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Error Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-800">{errorCounts.total}</div>
            <div className="text-sm text-gray-600">Total Errors</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{errorCounts.new}</div>
            <div className="text-sm text-red-700">New Errors</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{errorCounts.critical}</div>
            <div className="text-sm text-orange-700">Critical</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{errorCounts.resolved}</div>
            <div className="text-sm text-green-700">Resolved</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <Tabs value={filter} onValueChange={(value) => setFilter(value as any)} className="mb-4">
          <TabsList>
            <TabsTrigger value="all">All ({errorCounts.total})</TabsTrigger>
            <TabsTrigger value="new">New ({errorCounts.new})</TabsTrigger>
            <TabsTrigger value="critical">Critical ({errorCounts.critical})</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Error List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredErrors.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {filter === 'all' ? 'No errors found' : `No ${filter} errors found`}
            </div>
          ) : (
            filteredErrors.map((error) => (
              <div key={error.id} className="border rounded-lg p-4 space-y-2">
                {/* Error Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getErrorIcon(error.error_type)}
                    <span className="font-medium text-gray-900">
                      {error.error_message.substring(0, 80)}
                      {error.error_message.length > 80 && '...'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className={getErrorLevelColor(error.error_level)}>
                      {error.error_level}
                    </Badge>
                    <Badge variant="outline" className={getStatusColor(error.status)}>
                      {error.status}
                    </Badge>
                  </div>
                </div>

                {/* Error Details */}
                <div className="text-sm text-gray-600 grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(error.created_at), { addSuffix: true })}
                  </div>
                  {error.url && (
                    <div className="flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      {new URL(error.url).pathname}
                    </div>
                  )}
                  {error.facility_id && (
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      Facility: {error.facility_id.substring(0, 8)}...
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {error.status === 'new' && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateErrorStatus(error.id, 'investigating')}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Investigate
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateErrorStatus(error.id, 'resolved')}
                      className="text-green-600 border-green-200 hover:bg-green-50"
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Resolve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateErrorStatus(error.id, 'ignored')}
                      className="text-gray-600 border-gray-200 hover:bg-gray-50"
                    >
                      <X className="w-3 h-3 mr-1" />
                      Ignore
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminErrorPanel;