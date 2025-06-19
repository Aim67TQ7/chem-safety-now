
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, TrendingUp, AlertTriangle, Search, QrCode } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ActivityItem {
  id: string;
  type: 'sds_search' | 'incident_report' | 'qr_scan' | 'ai_chat';
  description: string;
  timestamp: string;
  icon: any;
  color: string;
}

interface FacilityActivityCardProps {
  facilityId: string;
}

const FacilityActivityCard = ({ facilityId }: FacilityActivityCardProps) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [daysSinceIncident, setDaysSinceIncident] = useState<number>(0);

  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        // Get recent SDS interactions
        const { data: sdsData } = await supabase
          .from('sds_interactions')
          .select('*')
          .eq('facility_id', facilityId)
          .order('created_at', { ascending: false })
          .limit(3);

        // Get recent QR code interactions
        const { data: qrData } = await supabase
          .from('qr_code_interactions')
          .select('*')
          .eq('facility_id', facilityId)
          .order('created_at', { ascending: false })
          .limit(3);

        // Get recent incidents to calculate days since last incident
        const { data: incidentData } = await supabase
          .from('incidents')
          .select('incident_date')
          .eq('facility_id', facilityId)
          .order('incident_date', { ascending: false })
          .limit(1);

        // Calculate days since last incident
        if (incidentData && incidentData.length > 0) {
          const lastIncidentDate = new Date(incidentData[0].incident_date);
          const today = new Date();
          const diffTime = Math.abs(today.getTime() - lastIncidentDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          setDaysSinceIncident(diffDays);
        } else {
          setDaysSinceIncident(365); // Default to 1 year if no incidents
        }

        // Combine and format activities
        const combinedActivities: ActivityItem[] = [];

        sdsData?.forEach((item) => {
          combinedActivities.push({
            id: item.id,
            type: 'sds_search',
            description: item.search_query ? `Searched: "${item.search_query}"` : 'SDS document accessed',
            timestamp: item.created_at,
            icon: Search,
            color: 'text-blue-600'
          });
        });

        qrData?.forEach((item) => {
          combinedActivities.push({
            id: item.id,
            type: 'qr_scan',
            description: `QR code ${item.action_type}`,
            timestamp: item.created_at,
            icon: QrCode,
            color: 'text-green-600'
          });
        });

        // Sort by timestamp and take the 5 most recent
        combinedActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setActivities(combinedActivities.slice(0, 5));

      } catch (error) {
        console.error('Error fetching activity data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentActivity();
  }, [facilityId]);

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5" />
            <span>Facility Activity</span>
          </div>
          <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
            {daysSinceIncident} days safe
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Safety Streak Display */}
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Safety Streak</span>
            </div>
            <span className="text-lg font-bold text-green-700">{daysSinceIncident} days</span>
          </div>

          {/* Recent Activities */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Recent Activity</h4>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : activities.length > 0 ? (
              activities.map((activity) => {
                const Icon = activity.icon;
                return (
                  <div key={activity.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                    <Icon className={`w-4 h-4 ${activity.color}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 truncate">{activity.description}</p>
                      <p className="text-xs text-gray-500">{formatTimeAgo(activity.timestamp)}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FacilityActivityCard;
