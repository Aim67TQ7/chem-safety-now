import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Eye, AlertTriangle, Clock, Calendar } from "lucide-react";
import AdminActionButtons from "@/components/AdminActionButtons";
import SalespersonEditor from "@/components/SalespersonEditor";
import { supabase } from "@/integrations/supabase/client";

interface Facility {
  id: string;
  facility_name: string | null;
  contact_name: string | null;
  email: string | null;
  address: string | null;
  subscription_status: string;
  trial_days_remaining: number | null;
  subscription_days_remaining: number | null;
  subscription_start_date: string | null;
  billing_period: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  slug: string;
  created_at: string;
}

interface FacilitySalesperson {
  facility_id: string;
  sales_rep_id: string;
  sales_rep_name: string;
}

interface AdminTrialTabsProps {
  facilities: Facility[];
  onStatusUpdate: () => void;
}

const AdminTrialTabs = ({ facilities, onStatusUpdate }: AdminTrialTabsProps) => {
  const [activeTab, setActiveTab] = useState("active");
  const [facilitySalespeople, setFacilitySalespeople] = useState<FacilitySalesperson[]>([]);

  useEffect(() => {
    fetchFacilitySalespeople();
  }, [facilities]);

  const fetchFacilitySalespeople = async () => {
    try {
      const { data, error } = await supabase
        .from('facility_sales_assignments')
        .select(`
          facility_id,
          sales_rep_id,
          sales_reps(name)
        `)
        .eq('is_primary', true);

      if (error) throw error;

      const salespeople = data?.map(assignment => ({
        facility_id: assignment.facility_id,
        sales_rep_id: assignment.sales_rep_id,
        sales_rep_name: (assignment.sales_reps as any)?.name || 'Unknown'
      })) || [];

      setFacilitySalespeople(salespeople);
    } catch (error) {
      console.error('Error fetching facility salespeople:', error);
    }
  };

  const getSalespersonForFacility = (facilityId: string) => {
    return facilitySalespeople.find(sp => sp.facility_id === facilityId);
  };

  // Filter facilities into active and expired trials
  const activeFacilities = facilities.filter(facility => {
    const isExpiredTrial = facility.subscription_status === 'trial' && (facility.trial_days_remaining || 0) <= 0;
    return !isExpiredTrial;
  });

  const expiredTrials = facilities.filter(facility => {
    const isExpiredTrial = facility.subscription_status === 'trial' && (facility.trial_days_remaining || 0) <= 0;
    return isExpiredTrial;
  });

  const formatSubscriptionInfo = (facility: Facility) => {
    if (facility.subscription_status === 'trial') {
      return {
        text: `${facility.trial_days_remaining} days left`,
        color: facility.trial_days_remaining && facility.trial_days_remaining <= 2 ? 'text-red-600' : 'text-gray-500'
      };
    } else if (['basic', 'premium'].includes(facility.subscription_status)) {
      const daysLeft = facility.subscription_days_remaining;
      const billingPeriod = facility.billing_period;
      const startDate = facility.subscription_start_date ? new Date(facility.subscription_start_date).toLocaleDateString() : 'Unknown';
      
      return {
        text: daysLeft !== null ? `${daysLeft} days until renewal` : 'Active',
        subText: `${billingPeriod || 'Unknown'} plan • Started ${startDate}`,
        color: daysLeft !== null && daysLeft <= 7 ? 'text-orange-600' : 'text-green-600'
      };
    }
    return { text: 'Unknown', color: 'text-gray-500' };
  };

  const FacilityTable = ({ facilities: facilityList, showExpiredBadge = false }: { facilities: Facility[], showExpiredBadge?: boolean }) => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Facility</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Status & Renewal</TableHead>
            <TableHead>Salesperson</TableHead>
            <TableHead>Stripe IDs</TableHead>
            <TableHead>Actions</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {facilityList.map((facility) => {
            const subscriptionInfo = formatSubscriptionInfo(facility);
            const salesperson = getSalespersonForFacility(facility.id);
            
            return (
              <TableRow key={facility.id} className={showExpiredBadge ? "bg-red-50" : ""}>
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium flex items-center gap-2">
                      {facility.facility_name || "Unnamed Facility"}
                      {showExpiredBadge && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Expired
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {facility.email || "—"}
                    </div>
                    {facility.slug && (
                      <a 
                        href={`https://chemlabel-gpt.com/facility/${facility.slug}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:underline"
                      >
                        View Site
                      </a>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div>{facility.contact_name || "—"}</div>
                    {facility.address && (
                      <div className="text-xs text-gray-500">{facility.address}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={
                          facility.subscription_status === "premium" ? "default" :
                          facility.subscription_status === "basic" ? "secondary" : 
                          showExpiredBadge ? "destructive" : "outline"
                        }
                      >
                        {facility.subscription_status || "trial"}
                      </Badge>
                      {['basic', 'premium'].includes(facility.subscription_status) && facility.billing_period && (
                        <Badge variant="outline" className="text-xs">
                          <Calendar className="w-3 h-3 mr-1" />
                          {facility.billing_period}
                        </Badge>
                      )}
                    </div>
                    <div className={`text-xs ${subscriptionInfo.color}`}>
                      {subscriptionInfo.text}
                    </div>
                    {subscriptionInfo.subText && (
                      <div className="text-xs text-gray-400">
                        {subscriptionInfo.subText}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <SalespersonEditor
                    facilityId={facility.id}
                    currentSalespersonId={salesperson?.sales_rep_id}
                    currentSalespersonName={salesperson?.sales_rep_name}
                    onUpdate={() => {
                      fetchFacilitySalespeople();
                      onStatusUpdate();
                    }}
                  />
                </TableCell>
                <TableCell>
                  <div className="text-xs space-y-1">
                    <div>Customer: {facility.stripe_customer_id ? 
                      facility.stripe_customer_id.substring(0, 12) + "..." : "—"}</div>
                    <div>Sub: {facility.stripe_subscription_id ? 
                      facility.stripe_subscription_id.substring(0, 12) + "..." : "—"}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <AdminActionButtons
                    facilityId={facility.id}
                    facilityName={facility.facility_name || "Unnamed Facility"}
                    currentStatus={facility.subscription_status || "trial"}
                    onStatusUpdate={onStatusUpdate}
                  />
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {facility.created_at && new Date(facility.created_at).toLocaleDateString()}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" /> Facility Overview & Subscription Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="active" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Active Facilities ({activeFacilities.length})
            </TabsTrigger>
            <TabsTrigger value="expired" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Expired Trials ({expiredTrials.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="active" className="mt-6">
            {activeFacilities.length === 0 ? (
              <p className="text-center py-10 text-muted-foreground">No active facilities found</p>
            ) : (
              <FacilityTable facilities={activeFacilities} />
            )}
          </TabsContent>
          
          <TabsContent value="expired" className="mt-6">
            {expiredTrials.length === 0 ? (
              <div className="text-center py-10">
                <Clock className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-muted-foreground">No expired trials - all facilities are active!</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-red-700 mb-2">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-medium">Expired Trials Requiring Attention</span>
                  </div>
                  <p className="text-sm text-red-600">
                    These facilities have expired trial periods and may need follow-up emails or subscription assistance.
                  </p>
                </div>
                <FacilityTable facilities={expiredTrials} showExpiredBadge={true} />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AdminTrialTabs;
