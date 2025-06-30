
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, Users, DollarSign, Target, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import ConvertToSubscriptionButton from './ConvertToSubscriptionButton';

interface SalesRepData {
  id: string;
  name: string;
  email: string;
  territory: string;
  total_facilities: number;
  trial_facilities: number;
  paid_facilities: number;
  total_conversions: number;
  monthly_revenue: number;
  annual_revenue: number;
  conversion_rate: number;
}

interface FacilityData {
  id: string;
  facility_name: string;
  email: string;
  subscription_status: string;
  trial_days_remaining: number;
  created_at: string;
  contact_name: string;
  address: string;
}

interface SalesRepDashboardProps {
  salesRepId: string;
}

const SalesRepDashboard = ({ salesRepId }: SalesRepDashboardProps) => {
  const [salesRepData, setSalesRepData] = useState<SalesRepData | null>(null);
  const [facilities, setFacilities] = useState<FacilityData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSalesRepData = async () => {
    try {
      // Get sales rep performance data
      const { data: perfData, error: perfError } = await supabase
        .from('sales_rep_performance')
        .select('*')
        .eq('id', salesRepId)
        .single();

      if (perfError) throw perfError;
      setSalesRepData(perfData);

      // Get assigned facilities
      const { data: facilitiesData, error: facilitiesError } = await supabase
        .from('facility_sales_assignments')
        .select(`
          facilities!inner(
            id,
            facility_name,
            email,
            subscription_status,
            trial_end_date,
            created_at,
            contact_name,
            address
          )
        `)
        .eq('sales_rep_id', salesRepId);

      if (facilitiesError) throw facilitiesError;

      // Process facilities data
      const processedFacilities = facilitiesData?.map(assignment => {
        const facility = assignment.facilities;
        const trialEndDate = facility.trial_end_date ? new Date(facility.trial_end_date) : null;
        const now = new Date();
        
        let trial_days_remaining = null;
        if (trialEndDate) {
          const diffTime = trialEndDate.getTime() - now.getTime();
          trial_days_remaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }

        return {
          ...facility,
          trial_days_remaining
        };
      }) || [];

      setFacilities(processedFacilities);
    } catch (error) {
      console.error('Error fetching sales rep data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesRepData();
  }, [salesRepId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!salesRepData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Sales representative not found</p>
      </div>
    );
  }

  const trialFacilities = facilities.filter(f => f.subscription_status === 'trial');
  const paidFacilities = facilities.filter(f => f.subscription_status === 'basic' || f.subscription_status === 'premium');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">{salesRepData.name}</h1>
        <p className="text-blue-100">{salesRepData.territory} Territory • {salesRepData.email}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Facilities</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{salesRepData.total_facilities}</div>
            <p className="text-xs text-muted-foreground">
              {salesRepData.trial_facilities} trials, {salesRepData.paid_facilities} paid
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{salesRepData.conversion_rate}%</div>
            <p className="text-xs text-muted-foreground">
              {salesRepData.total_conversions} total conversions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${salesRepData.monthly_revenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Recurring monthly revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Annual Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${salesRepData.annual_revenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Total annual revenue
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Trial Pipeline */}
      <Card>
        <CardHeader>
          <CardTitle>Trial Pipeline ({trialFacilities.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {trialFacilities.length === 0 ? (
            <p className="text-center py-4 text-muted-foreground">No trial facilities</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Facility</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Days Remaining</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trialFacilities.map((facility) => (
                    <TableRow key={facility.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{facility.facility_name || 'Unnamed Facility'}</div>
                          <div className="text-sm text-gray-500">{facility.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div>{facility.contact_name || '—'}</div>
                          {facility.address && (
                            <div className="text-xs text-gray-500">{facility.address}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={facility.trial_days_remaining && facility.trial_days_remaining <= 2 ? "destructive" : "outline"}
                        >
                          {facility.trial_days_remaining} days
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <ConvertToSubscriptionButton
                          facilityId={facility.id}
                          facilityName={facility.facility_name || 'Unnamed Facility'}
                          salesRepId={salesRepId}
                          onConversionComplete={fetchSalesRepData}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paid Customers */}
      <Card>
        <CardHeader>
          <CardTitle>Paid Customers ({paidFacilities.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {paidFacilities.length === 0 ? (
            <p className="text-center py-4 text-muted-foreground">No paid customers yet</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Facility</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Started</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paidFacilities.map((facility) => (
                    <TableRow key={facility.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{facility.facility_name || 'Unnamed Facility'}</div>
                          <div className="text-sm text-gray-500">{facility.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div>{facility.contact_name || '—'}</div>
                          {facility.address && (
                            <div className="text-xs text-gray-500">{facility.address}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">
                          {facility.subscription_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(facility.created_at).toLocaleDateString()}
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
    </div>
  );
};

export default SalesRepDashboard;
