
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, FileText, BarChart3, Settings, Map, AlertTriangle, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import SiteMapDisplay from "@/components/SiteMapDisplay";
import AdminTrialTabs from "@/components/AdminTrialTabs";
import { supabase } from "@/integrations/supabase/client";

const AdminPage = () => {
  const navigate = useNavigate();
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFacilities = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('facilities')
        .select(`
          id,
          facility_name,
          contact_name,
          email,
          address,
          subscription_status,
          trial_end_date,
          subscription_start_date,
          billing_period,
          stripe_customer_id,
          stripe_subscription_id,
          created_at,
          slug
        `);

      if (error) throw error;

      // Process the data to add calculated fields
      const processedFacilities = data?.map(facility => {
        const trialEndDate = facility.trial_end_date ? new Date(facility.trial_end_date) : null;
        const now = new Date();
        
        let trial_days_remaining = null;
        let subscription_days_remaining = null;
        
        if (trialEndDate) {
          const diffTime = trialEndDate.getTime() - now.getTime();
          trial_days_remaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }

        return {
          ...facility,
          trial_days_remaining,
          subscription_days_remaining,
          facility_url: `https://chemlabel-gpt.lovable.app/facility/${facility.slug}`
        };
      }) || [];

      setFacilities(processedFacilities);
    } catch (error) {
      console.error('Error fetching facilities:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-red-50">
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">System administration and management tools</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full max-w-2xl">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="facilities">Facilities</TabsTrigger>
            <TabsTrigger value="sitemap">Site Map</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/sds-documents')}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">SDS Documents</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">View All</div>
                  <p className="text-xs text-muted-foreground">
                    Manage all SDS documents in the system
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin?tab=facilities')}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Facilities</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Manage</div>
                  <p className="text-xs text-muted-foreground">
                    View active and expired facilities
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">System Health</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Online
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    All systems operational
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  Known Issues
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div>
                      <div className="font-medium text-green-900">✅ Fixed: QR Print functionality</div>
                      <div className="text-sm text-green-700">Print QR code links now work correctly with facility slugs</div>
                    </div>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Resolved
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div>
                      <div className="font-medium text-green-900">✅ Fixed: Navigation routes</div>
                      <div className="text-sm text-green-700">Missing page components have been created and routes established</div>
                    </div>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Resolved
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="facilities">
            {loading ? (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading facilities...</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <AdminTrialTabs 
                facilities={facilities} 
                onStatusUpdate={fetchFacilities}
              />
            )}
          </TabsContent>

          <TabsContent value="sitemap">
            <SiteMapDisplay />
          </TabsContent>

          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle>Document Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button 
                    onClick={() => navigate('/admin/sds-documents')}
                    className="w-full sm:w-auto"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    View All SDS Documents
                  </Button>
                  <p className="text-sm text-gray-600">
                    Access and manage all Safety Data Sheet documents across all facilities.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">Site Map Visibility</div>
                      <div className="text-sm text-gray-600">Show detailed route information for debugging</div>
                    </div>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Enabled
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">Admin Access</div>
                      <div className="text-sm text-gray-600">Administrative functions and overrides</div>
                    </div>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Active
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPage;
