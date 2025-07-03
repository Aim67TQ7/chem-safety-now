import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, FileText, BarChart3, Settings, Map, AlertTriangle, Building2, UserPlus } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import SiteMapDisplay from "@/components/SiteMapDisplay";
import AdminTrialTabs from "@/components/AdminTrialTabs";
import SalesRepManagement from "@/components/SalesRepManagement";
import AdminFeedbackPanel from "@/components/AdminFeedbackPanel";
import AdminErrorPanel from "@/components/AdminErrorPanel";
import LoggingVerificationPanel from "@/components/LoggingVerificationPanel";
import { supabase } from "@/integrations/supabase/client";

const AdminPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [facilities, setFacilities] = useState([]);
  const [salesData, setSalesData] = useState({
    totalRevenue: 0,
    newSubscriptions: 0,
    conversionRate: 0,
    salesReps: []
  });
  const [loading, setLoading] = useState(true);
  
  // Get the initial tab from URL params, default to "overview"
  const initialTab = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Update tab when URL params change
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const fetchSalesData = async () => {
    try {
      // Get sales rep performance data
      const { data: salesRepsData, error: salesError } = await supabase
        .from('sales_rep_performance')
        .select('*')
        .order('monthly_revenue', { ascending: false });

      if (salesError) throw salesError;

      // Calculate totals
      const totalMonthlyRevenue = salesRepsData?.reduce((sum, rep) => sum + rep.monthly_revenue, 0) || 0;
      const totalAnnualRevenue = salesRepsData?.reduce((sum, rep) => sum + rep.annual_revenue, 0) || 0;
      const totalConversions = salesRepsData?.reduce((sum, rep) => sum + rep.total_conversions, 0) || 0;
      const totalFacilities = salesRepsData?.reduce((sum, rep) => sum + rep.total_facilities, 0) || 0;
      const avgConversionRate = totalFacilities > 0 ? (totalConversions / totalFacilities) * 100 : 0;

      setSalesData({
        totalRevenue: totalMonthlyRevenue + totalAnnualRevenue,
        newSubscriptions: totalConversions,
        conversionRate: avgConversionRate,
        salesReps: salesRepsData || []
      });
    } catch (error) {
      console.error('Error fetching sales data:', error);
    }
  };

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
          subscription_days_remaining
        };
      }) || [];

      setFacilities(processedFacilities);
      
      // Fetch sales data after facilities are loaded
      await fetchSalesData();
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-9 w-full max-w-6xl">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="facilities">Facilities</TabsTrigger>
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="sales-reps">Sales Reps</TabsTrigger>
            <TabsTrigger value="errors">Errors</TabsTrigger>
            <TabsTrigger value="sitemap">Site Map</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="logging">Logging</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('facilities')}>
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

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('sales')}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Sales Dashboard</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">View</div>
                  <p className="text-xs text-muted-foreground">
                    Sales leaders and revenue tracking
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setActiveTab('sales-reps')}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Sales Reps</CardTitle>
                  <UserPlus className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Manage</div>
                  <p className="text-xs text-muted-foreground">
                    Add and manage sales representatives
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <AdminErrorPanel />
              <AdminFeedbackPanel />
            </div>
          </TabsContent>

          <TabsContent value="errors">
            <AdminErrorPanel />
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

          <TabsContent value="sales">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Sales Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Total Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">${salesData.totalRevenue.toFixed(2)}</div>
                      <p className="text-xs text-muted-foreground">Monthly + Annual revenue</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Total Conversions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">{salesData.newSubscriptions}</div>
                      <p className="text-xs text-muted-foreground">Trial to paid conversions</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Avg Conversion Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-purple-600">{salesData.conversionRate.toFixed(1)}%</div>
                      <p className="text-xs text-muted-foreground">Across all sales reps</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Sales Representatives Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {salesData.salesReps.map((rep, index) => (
                        <div 
                          key={rep.id}
                          className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                            index === 0 ? 'bg-green-50 border-green-200' :
                            index === 1 ? 'bg-blue-50 border-blue-200' : 
                            'bg-purple-50 border-purple-200'
                          }`}
                          onClick={() => navigate(`/sales-rep/${rep.id}`)}
                        >
                          <div>
                            <div className="font-medium">{rep.name}</div>
                            <div className="text-sm text-gray-600">{rep.territory} • {rep.email}</div>
                          </div>
                          <div className="text-right">
                            <div className={`font-bold ${
                              index === 0 ? 'text-green-600' :
                              index === 1 ? 'text-blue-600' : 
                              'text-purple-600'
                            }`}>
                              ${(rep.monthly_revenue + rep.annual_revenue).toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {rep.total_conversions} conversions • {rep.conversion_rate}% rate
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sales-reps">
            <SalesRepManagement />
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

          <TabsContent value="logging">
            <LoggingVerificationPanel />
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
