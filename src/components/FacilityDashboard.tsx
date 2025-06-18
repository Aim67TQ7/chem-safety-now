
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  QrCode, 
  Printer, 
  Bot, 
  Monitor,
  Settings,
  Building2,
  Calendar,
  Users,
  Activity,
  Clock,
  Crown
} from "lucide-react";

interface FacilityData {
  id: string;
  slug: string;
  facility_name: string | null;
  contact_name: string | null;
  email: string | null;
  address: string | null;
  logo_url?: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
}

interface SubscriptionInfo {
  subscription_status: 'trial' | 'basic' | 'premium' | 'expired';
  trial_days_remaining?: number;
}

interface FacilityDashboardProps {
  facilityData: FacilityData;
  subscriptionInfo?: SubscriptionInfo;
  onQuickAction: (action: string) => void;
  onUpgrade?: () => void;
}

const FacilityDashboard = ({ facilityData, subscriptionInfo, onQuickAction, onUpgrade }: FacilityDashboardProps) => {
  const quickActions = [
    {
      id: 'search',
      title: 'SDS Search',
      description: 'Find and access Safety Data Sheets',
      icon: Search,
      color: 'bg-blue-500 hover:bg-blue-600',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      id: 'qr-codes',
      title: 'QR Codes',
      description: 'Generate facility QR codes',
      icon: QrCode,
      color: 'bg-green-500 hover:bg-green-600',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      id: 'desktop-links',
      title: 'Desktop Links',
      description: 'Create desktop shortcuts',
      icon: Monitor,
      color: 'bg-purple-500 hover:bg-purple-600',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      id: 'labels',
      title: 'Label Printer',
      description: 'Print chemical labels',
      icon: Printer,
      color: 'bg-orange-500 hover:bg-orange-600',
      textColor: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      id: 'ai-assistant',
      title: 'AI Assistant',
      description: 'Get chemical safety help',
      icon: Bot,
      color: 'bg-red-500 hover:bg-red-600',
      textColor: 'text-red-600',
      bgColor: 'bg-red-50'
    }
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderSubscriptionStatus = () => {
    if (!subscriptionInfo) return null;

    switch (subscriptionInfo.subscription_status) {
      case 'trial':
        return (
          <div className="flex items-center space-x-3">
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              <Clock className="w-3 h-3 mr-1" />
              {subscriptionInfo.trial_days_remaining} day{subscriptionInfo.trial_days_remaining !== 1 ? 's' : ''} left in trial
            </Badge>
            {onUpgrade && (
              <Button
                onClick={onUpgrade}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Upgrade Now
              </Button>
            )}
          </div>
        );
      case 'basic':
        return (
          <div className="flex items-center space-x-3">
            <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
              Basic Plan
            </Badge>
            {onUpgrade && (
              <Button
                onClick={onUpgrade}
                size="sm"
                variant="outline"
                className="border-purple-200 text-purple-700 hover:bg-purple-50"
              >
                Upgrade to Premium
              </Button>
            )}
          </div>
        );
      case 'premium':
        return (
          <Badge variant="default" className="bg-purple-50 text-purple-700 border-purple-200">
            <Crown className="w-3 h-3 mr-1" />
            Premium Plan
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Facility Header Card with Subscription Status and Settings Button */}
      <Card className="bg-gradient-to-r from-blue-50 to-red-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Avatar className="w-16 h-16">
                <AvatarImage 
                  src={facilityData.logo_url} 
                  alt={facilityData.facility_name || "Facility Logo"} 
                />
                <AvatarFallback className="text-xl font-semibold bg-blue-100 text-blue-600">
                  {facilityData.facility_name?.charAt(0)?.toUpperCase() || "F"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {facilityData.facility_name || 'Unnamed Facility'}
                </h2>
                <p className="text-gray-600">
                  Contact: {facilityData.contact_name || 'No contact set'}
                </p>
                {facilityData.address && (
                  <p className="text-sm text-gray-500">{facilityData.address}</p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {renderSubscriptionStatus()}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onQuickAction('settings')}
                className="flex items-center space-x-2"
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Actions Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quickActions.map((action) => {
          const IconComponent = action.icon;
          return (
            <Card 
              key={action.id}
              className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
              onClick={() => onQuickAction(action.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-full ${action.bgColor}`}>
                    <IconComponent className={`w-6 h-6 ${action.textColor}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{action.title}</h3>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Facility Information */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="w-5 h-5" />
              <span>Facility Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Email:</span>
              <span className="font-medium">{facilityData.email || 'Not set'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Facility ID:</span>
              <span className="font-mono text-sm">{facilityData.slug}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Created:</span>
              <span className="font-medium">{formatDate(facilityData.created_at)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>Quick Stats</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                Active
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Last Updated:</span>
              <span className="font-medium">{formatDate(facilityData.updated_at)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tools Available:</span>
              <span className="font-medium">{quickActions.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FacilityDashboard;
