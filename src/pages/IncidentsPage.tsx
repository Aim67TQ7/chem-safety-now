
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, FileText, Plus } from 'lucide-react';
import { IncidentReportForm } from '@/components/incidents/IncidentReportForm';
import { IncidentsList } from '@/components/incidents/IncidentsList';
import FacilityNavbar from '@/components/FacilityNavbar';
import { supabase } from '@/integrations/supabase/client';

const IncidentsPage = () => {
  const { facilitySlug } = useParams<{ facilitySlug: string }>();
  const [activeTab, setActiveTab] = useState('list');
  const [incidentType, setIncidentType] = useState<'near_miss' | 'reportable'>('near_miss');
  const [facilityData, setFacilityData] = useState<any>(null);

  useEffect(() => {
    const fetchFacilityData = async () => {
      if (!facilitySlug) return;

      const { data: facility } = await supabase
        .from('facilities')
        .select('facility_name, logo_url')
        .eq('slug', facilitySlug)
        .single();

      if (facility) {
        setFacilityData(facility);
      }
    };

    fetchFacilityData();
  }, [facilitySlug]);

  const handleNewIncident = (type: 'near_miss' | 'reportable') => {
    setIncidentType(type);
    setActiveTab('report');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <FacilityNavbar 
        facilityName={facilityData?.facility_name || undefined}
        facilityLogo={facilityData?.logo_url}
      />
      
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Incident Reporting System
            </h1>
            <p className="text-gray-600">
              Report and track workplace incidents, near-misses, and safety concerns
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="list">View Incidents</TabsTrigger>
              <TabsTrigger value="report">Report Incident</TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <Card className="cursor-pointer hover:shadow-lg transition-shadow border-yellow-200 bg-yellow-50"
                      onClick={() => handleNewIncident('near_miss')}>
                  <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                    <AlertTriangle className="h-6 w-6 text-yellow-600 mr-3" />
                    <div className="flex-1">
                      <CardTitle className="text-lg text-yellow-800">Report Near-Miss</CardTitle>
                      <CardDescription className="text-yellow-700">
                        Document incidents that could have caused harm
                      </CardDescription>
                    </div>
                    <Plus className="h-5 w-5 text-yellow-600" />
                  </CardHeader>
                </Card>

                <Card className="cursor-pointer hover:shadow-lg transition-shadow border-red-200 bg-red-50"
                      onClick={() => handleNewIncident('reportable')}>
                  <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                    <FileText className="h-6 w-6 text-red-600 mr-3" />
                    <div className="flex-1">
                      <CardTitle className="text-lg text-red-800">Report Incident</CardTitle>
                      <CardDescription className="text-red-700">
                        Report actual injuries, illnesses, or property damage
                      </CardDescription>
                    </div>
                    <Plus className="h-5 w-5 text-red-600" />
                  </CardHeader>
                </Card>
              </div>

              <IncidentsList />
            </TabsContent>

            <TabsContent value="report" className="space-y-6">
              <IncidentReportForm 
                incidentType={incidentType}
                onSuccess={() => setActiveTab('list')}
                onCancel={() => setActiveTab('list')}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default IncidentsPage;
