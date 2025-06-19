import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Bot, 
  Settings,
  Building2,
  Activity,
  Crown,
  AlertTriangle,
  Link,
  Clock,
  TrendingUp,
  Award
} from "lucide-react";
import FacilityActivityCard from "@/components/FacilityActivityCard";
import SafetyGameCard from "@/components/SafetyGameCard";

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
  onChatWithSarah?: () => void;
}

const FacilityDashboard = ({
  facilityData,
  subscriptionInfo,
  onQuickAction,
  onUpgrade,
  onChatWithSarah
}: FacilityDashboardProps) => {
  // Helper function to check feature access with improved logic
  const hasFeatureAccess = (featureName: string): boolean => {
    if (!subscriptionInfo) return true; // Default to true if no subscription info
    
    // Define feature tiers
    const basicFeatures = ['sds_search', 'access_tools', 'ai_assistant'];
    const premiumFeatures = ['label_printing'];
    
    const isBasicFeature = basicFeatures.includes(featureName);
    
    // Trial users (with remaining days) get access to basic features regardless of their plan
    const isActiveTrial = subscriptionInfo.subscription_status === 'trial' && 
                         subscriptionInfo.trial_days_remaining > 0;
    
    // Premium users get access to everything
    if (subscriptionInfo.subscription_status === 'premium') {
      return true;
    }
    
    // Basic users get access to basic features
    if (subscriptionInfo.subscription_status === 'basic') {
      return isBasicFeature;
    }
    
    // Active trial users get access to basic features
    if (isActiveTrial) {
      return isBasicFeature;
    }
    
    // Expired users only get access to basic features (free tier)
    return isBasicFeature && !premiumFeatures.includes(featureName);
  };

  const quickActions = [
    {
      id: 'search',
      title: 'SDS Search',
      description: 'Find chemical safety data sheets',
      icon: Search,
      color: 'bg-blue-600',
      hoverColor: 'hover:bg-blue-700',
      featured: true
    },
    {
      id: 'incidents',
      title: 'Incident Reporting',
      description: 'Report and manage safety incidents',
      icon: AlertTriangle,
      color: 'bg-red-600',
      hoverColor: 'hover:bg-red-700',
      requiresFeature: 'incident_reporting'
    },
    {
      id: 'access-tools',
      title: 'Access Tools',
      description: 'Generate QR codes and desktop shortcuts',
      icon: Link,
      color: 'bg-green-600',
      hoverColor: 'hover:bg-green-700',
      requiresFeature: 'access_tools'
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
    <div className="space-y-8">
      {/* Facility Header Card with Subscription Status, Chat with Sarah, and Settings Button */}
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
              {onChatWithSarah && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onChatWithSarah}
                  className="flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 hover:from-blue-100 hover:to-purple-100"
                >
                  <Avatar className="w-6 h-6">
                    <AvatarImage 
                      src="/lovable-uploads/f96c7ce3-ace7-434d-a4a6-fcec5716efa8.png" 
                      alt="Sarah - Chemical Safety Manager"
                    />
                    <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs">
                      <Bot className="w-3 h-3" />
                    </AvatarFallback>
                  </Avatar>
                  <span>Chat with Sarah</span>
                </Button>
              )}
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

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            const isLocked = action.requiresFeature && !hasFeatureAccess(action.requiresFeature);
            
            return (
              <Card
                key={action.id}
                className={`
                  relative cursor-pointer transition-all duration-300 hover:shadow-lg group
                  ${action.featured ? 'ring-2 ring-blue-500 ring-opacity-50 animate-soft-glow bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200' : ''}
                  ${isLocked ? 'opacity-60' : ''}
                `}
                onClick={() => isLocked ? onUpgrade && onUpgrade() : onQuickAction(action.id)}
              >
                {action.featured && (
                  <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-bounce">
                    START HERE
                  </div>
                )}
                
                <div className="p-6 relative">
                  {isLocked && (
                    <div className="absolute top-2 right-2">
                      <Crown className="w-4 h-4 text-yellow-500" />
                    </div>
                  )}
                  
                  <div className={`${action.color} ${action.hoverColor} w-16 h-16 rounded-lg flex items-center justify-center mb-4 transition-colors group-hover:scale-105 transform duration-200`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  
                  <h4 className={`text-xl font-semibold mb-2 ${action.featured ? 'text-blue-900' : 'text-gray-900'}`}>
                    {action.title}
                  </h4>
                  
                  <p className={`text-sm ${action.featured ? 'text-blue-700' : 'text-gray-600'}`}>
                    {action.description}
                  </p>
                  
                  {isLocked && (
                    <div className="mt-3">
                      <Badge variant="outline" className="text-xs">
                        Upgrade Required
                      </Badge>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </Card>

      {/* Enhanced Dashboard Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        <FacilityActivityCard facilityId={facilityData.id} />
        <SafetyGameCard facilityId={facilityData.id} />
      </div>

      {/* Facility Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="w-5 h-5" />
            <span>Facility Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
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
          </div>
          <div className="space-y-3">
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FacilityDashboard;
