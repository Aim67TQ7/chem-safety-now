
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { AlertTriangle, FileText, User, Calendar, MapPin, Activity, Shield, Eye, X } from 'lucide-react';
import { format } from 'date-fns';
import { IncidentAnalysisPanel } from './IncidentAnalysisPanel';
import { supabase } from '@/integrations/supabase/client';

interface IncidentDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  incident: any;
  facilityData?: any;
}

export const IncidentDetailsDialog: React.FC<IncidentDetailsDialogProps> = ({
  isOpen,
  onClose,
  incident,
  facilityData
}) => {
  const [relatedSDSDocuments, setRelatedSDSDocuments] = useState<any[]>([]);
  const [loadingSDSData, setLoadingSDSData] = useState(false);

  useEffect(() => {
    if (isOpen && incident) {
      searchForRelatedChemicals();
    }
  }, [isOpen, incident]);

  const searchForRelatedChemicals = async () => {
    if (!incident.equipment_materials_involved && !incident.description) return;
    
    setLoadingSDSData(true);
    try {
      // Search for chemicals mentioned in the incident description or materials
      const searchTerms = [
        incident.equipment_materials_involved,
        incident.description,
        incident.object_substance_causing_injury
      ].filter(Boolean).join(' ');

      // Simple keyword matching - in a real implementation, you might want more sophisticated matching
      const { data: sdsResults, error } = await supabase
        .from('sds_documents')
        .select('*')
        .or(`product_name.ilike.%${searchTerms}%,full_text.ilike.%${searchTerms}%`)
        .limit(5);

      if (error) {
        console.error('Error searching SDS documents:', error);
      } else {
        setRelatedSDSDocuments(sdsResults || []);
      }
    } catch (error) {
      console.error('Error in chemical search:', error);
    } finally {
      setLoadingSDSData(false);
    }
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

  if (!incident) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[95vw] h-[90vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="flex flex-row items-center justify-between p-6 pb-4 border-b flex-shrink-0">
          <DialogTitle className="flex items-center gap-3">
            {incident.incident_type === 'near_miss' ? (
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            ) : (
              <FileText className="h-6 w-6 text-red-600" />
            )}
            <div>
              <div className="text-xl font-semibold">
                {incident.incident_type === 'near_miss' ? 'Near-Miss Incident' : 'Reportable Incident'}
              </div>
              <div className="text-sm font-normal text-gray-600">
                {format(new Date(incident.incident_date), 'PPP')}
                {incident.incident_time && ` at ${incident.incident_time}`}
              </div>
            </div>
          </DialogTitle>
          <div className="flex items-center gap-3">
            <Badge className={getSeverityColor(incident)}>
              {incident.incident_type === 'near_miss' 
                ? incident.potential_severity || 'Unknown'
                : incident.severity_classification || 'Unknown'
              }
            </Badge>
            <Badge className={getStatusColor(incident.status)}>
              {incident.status.replace('_', ' ')}
            </Badge>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex-1 min-h-0">
          <Tabs defaultValue="details" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3 mx-6 mt-4">
              <TabsTrigger value="details">Incident Details</TabsTrigger>
              <TabsTrigger value="analysis">AI Analysis</TabsTrigger>
              <TabsTrigger value="documents">
                Related Documents {relatedSDSDocuments.length > 0 && `(${relatedSDSDocuments.length})`}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="flex-1 overflow-y-auto p-6 pt-4">
              <div className="space-y-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium text-gray-700">Person Involved:</span>
                      <p className="text-gray-900">{incident.person_involved_name}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Job Title:</span>
                      <p className="text-gray-900">{incident.person_involved_job_title || 'Not specified'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Location:</span>
                      <p className="text-gray-900">{incident.location}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Activity:</span>
                      <p className="text-gray-900">{incident.activity_being_performed}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Incident Description */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Incident Description
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-900 leading-relaxed">{incident.description}</p>
                    
                    {incident.equipment_materials_involved && (
                      <div className="mt-4">
                        <span className="font-medium text-gray-700">Equipment/Materials Involved:</span>
                        <p className="text-gray-900 mt-1">{incident.equipment_materials_involved}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* PPE Information */}
                {incident.ppe_used !== null && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Personal Protective Equipment
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 mb-3">
                        <span className="font-medium text-gray-700">PPE Used:</span>
                        <Badge variant={incident.ppe_used ? "default" : "destructive"}>
                          {incident.ppe_used ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                      
                      {incident.ppe_details && (
                        <div>
                          <span className="font-medium text-gray-700">PPE Details:</span>
                          <p className="text-gray-900 mt-1">{incident.ppe_details}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Actions Taken */}
                {(incident.immediate_actions_taken || incident.corrective_actions) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Actions Taken
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {incident.immediate_actions_taken && (
                        <div>
                          <span className="font-medium text-gray-700">Immediate Actions:</span>
                          <p className="text-gray-900 mt-1">{incident.immediate_actions_taken}</p>
                        </div>
                      )}
                      
                      {incident.corrective_actions && (
                        <div>
                          <span className="font-medium text-gray-700">Corrective Actions:</span>
                          <p className="text-gray-900 mt-1">{incident.corrective_actions}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Additional Information */}
                {incident.additional_comments && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Additional Comments</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-900 leading-relaxed">{incident.additional_comments}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Form Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Report Information</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium text-gray-700">Completed By:</span>
                      <p className="text-gray-900">{incident.form_completed_by_name}</p>
                    </div>
                    {incident.form_completed_by_contact && (
                      <div>
                        <span className="font-medium text-gray-700">Contact:</span>
                        <p className="text-gray-900">{incident.form_completed_by_contact}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="analysis" className="flex-1 overflow-y-auto p-6 pt-4">
              <IncidentAnalysisPanel 
                incident={incident}
                relatedSDSDocuments={relatedSDSDocuments}
                facilityData={facilityData}
              />
            </TabsContent>

            <TabsContent value="documents" className="flex-1 overflow-y-auto p-6 pt-4">
              <div className="space-y-4">
                {loadingSDSData ? (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                      <p className="text-gray-500">Searching for related chemical documents...</p>
                    </CardContent>
                  </Card>
                ) : relatedSDSDocuments.length > 0 ? (
                  relatedSDSDocuments.map((doc) => (
                    <Card key={doc.id} className="border-l-4 border-l-orange-500">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span className="text-lg">{doc.product_name}</span>
                          <Badge variant="outline">SDS Document</Badge>
                        </CardTitle>
                        {doc.manufacturer && (
                          <p className="text-sm text-gray-600">Manufacturer: {doc.manufacturer}</p>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          {doc.signal_word && (
                            <div>
                              <span className="font-medium">Signal Word:</span>
                              <Badge className="ml-2" variant={doc.signal_word === 'DANGER' ? 'destructive' : 'secondary'}>
                                {doc.signal_word}
                              </Badge>
                            </div>
                          )}
                          {doc.cas_number && (
                            <div>
                              <span className="font-medium">CAS Number:</span>
                              <span className="ml-2">{doc.cas_number}</span>
                            </div>
                          )}
                        </div>
                        
                        {doc.h_codes && doc.h_codes.length > 0 && (
                          <div className="mt-4">
                            <span className="font-medium text-sm">Hazard Statements:</span>
                            <div className="mt-2 space-y-1">
                              {doc.h_codes.slice(0, 3).map((hazard: any, index: number) => (
                                <div key={index} className="text-xs bg-red-50 border border-red-200 rounded px-2 py-1">
                                  <strong>{hazard.code}:</strong> {hazard.description}
                                </div>
                              ))}
                              {doc.h_codes.length > 3 && (
                                <div className="text-xs text-gray-500">
                                  +{doc.h_codes.length - 3} more hazard statements
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card className="border-dashed border-2 border-gray-200">
                    <CardContent className="pt-6 text-center text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-lg font-medium mb-2">No Related Documents Found</p>
                      <p className="text-sm">
                        No chemical safety documents were found related to this incident.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
