import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, FileText, Search, Filter, Eye } from 'lucide-react';
import { useIncidents } from '@/hooks/useIncidents';
import { format } from 'date-fns';
import { IncidentDetailsDialog } from './IncidentDetailsDialog';

interface IncidentsListProps {
  facilityId?: string;
}

export const IncidentsList: React.FC<IncidentsListProps> = ({ facilityId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  
  const { incidents, isLoading, error } = useIncidents(facilityId);

  const filteredIncidents = incidents?.filter(incident => {
    const matchesSearch = incident.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         incident.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         incident.person_involved_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || incident.status === statusFilter;
    const matchesType = typeFilter === 'all' || incident.incident_type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  }) || [];

  const handleViewDetails = (incident: any) => {
    setSelectedIncident(incident);
    setDetailsDialogOpen(true);
  };

  const getSeverityColor = (incident: any) => {
    if (incident.incident_type === 'near_miss') {
      const severity = incident.potential_severity;
      switch (severity) {
        case 'critical': return 'bg-red-100 text-red-800 border-red-200';
        case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
        case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'low': return 'bg-green-100 text-green-800 border-green-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    } else {
      const severity = incident.severity_classification;
      switch (severity) {
        case 'death': return 'bg-red-100 text-red-800 border-red-200';
        case 'days_away': return 'bg-orange-100 text-orange-800 border-orange-200';
        case 'restricted_duty': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'other_recordable': return 'bg-blue-100 text-blue-800 border-blue-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800';
      case 'under_investigation': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-blue-100 text-blue-800';
      case 'closed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading incidents...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-800">Error loading incidents: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  if (!facilityId) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <p className="text-amber-800">No facility selected. Cannot display incidents.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Incidents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search incidents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="under_investigation">Under Investigation</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="near_miss">Near-Miss</SelectItem>
                <SelectItem value="reportable">Reportable</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Incidents List */}
      {filteredIncidents.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-gray-500">No incidents found matching your criteria.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredIncidents.map((incident) => (
            <Card key={incident.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {incident.incident_type === 'near_miss' ? (
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    ) : (
                      <FileText className="h-5 w-5 text-red-600" />
                    )}
                    <div>
                      <CardTitle className="text-lg">
                        {incident.incident_type === 'near_miss' ? 'Near-Miss' : 'Reportable Incident'}
                      </CardTitle>
                      <p className="text-sm text-gray-500">
                        {format(new Date(incident.incident_date), 'PPP')}
                        {incident.incident_time && ` at ${incident.incident_time}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getSeverityColor(incident)}>
                      {incident.incident_type === 'near_miss' 
                        ? incident.potential_severity || 'Unknown'
                        : incident.severity_classification || 'Unknown'
                      }
                    </Badge>
                    <Badge className={getStatusColor(incident.status)}>
                      {incident.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Location:</span>
                      <p className="text-gray-600">{incident.location}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Person Involved:</span>
                      <p className="text-gray-600">{incident.person_involved_name}</p>
                    </div>
                  </div>
                  
                  <div>
                    <span className="font-medium text-gray-700">Description:</span>
                    <p className="text-gray-600 mt-1 line-clamp-3">{incident.description}</p>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t">
                    <div className="text-xs text-gray-500">
                      Reported by: {incident.form_completed_by_name}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewDetails(incident)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details & AI Analysis
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Incident Details Dialog */}
      <IncidentDetailsDialog
        isOpen={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        incident={selectedIncident}
        facilityData={{ facility_name: 'Current Facility' }} // Replace with actual facility data
      />
    </div>
  );
};
