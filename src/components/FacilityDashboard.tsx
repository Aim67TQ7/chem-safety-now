
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Calendar, Globe, QrCode, Crown, Zap } from "lucide-react";
import { SubscriptionService, FacilitySubscription } from "@/services/subscriptionService";
import SubscriptionStatusHeader from "./SubscriptionStatusHeader";
import FacilityActivityCard from "./FacilityActivityCard";
import FeatureAccessWrapper from "./FeatureAccessWrapper";
import AuditTrail from "./AuditTrail";
import SDSSearch from "./SDSSearch";
import FacilityNavbar from "./FacilityNavbar";

interface FacilityProps {
  id: string;
  slug: string;
  facility_name: string;
  contact_name: string;
  email: string;
  address: string;
  logo_url: string;
  created_at: string;
}

interface FacilityDashboardProps {
  facility: FacilityProps;
}

const FacilityDashboard = ({ facility }: FacilityDashboardProps) => {
  const [subscription, setSubscription] = useState<FacilitySubscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscription = async () => {
      const sub = await SubscriptionService.getFacilitySubscription(facility.id);
      setSubscription(sub);
      setLoading(false);
    };

    fetchSubscription();
  }, [facility.id]);

  if (loading || !subscription) {
    return null;
  }

  const hasPremiumAccess = subscription ? SubscriptionService.hasPremiumAccess(subscription) : false;

  const handleUpgrade = () => {
    // TODO: Implement upgrade functionality
    console.log('Upgrade requested for facility:', facility.id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Global Navigation Bar */}
      <FacilityNavbar 
        facilityName={facility.facility_name}
        facilityLogo={facility.logo_url}
        facilityAddress={facility.address}
      />

      <div className="container mx-auto px-4 py-8">
        {/* SDS Search Section */}
        <div className="mb-8">
          <SDSSearch facilityId={facility.id} />
        </div>

        {/* Dashboard Cards Section */}
        <div className="grid grid-cols-1 gap-6">
          {/* Subscription Status Header */}
          <SubscriptionStatusHeader facilityId={facility.id} onUpgrade={handleUpgrade} />

          {/* Facility Activity Card */}
          <FacilityActivityCard facilityId={facility.id} />

          {/* Audit Trail - Premium Feature */}
          {hasPremiumAccess && (
            <FeatureAccessWrapper 
              feature="audit_trail" 
              facilityId={facility.id}
              onUpgrade={handleUpgrade}
            >
              <AuditTrail facilityId={facility.id} />
            </FeatureAccessWrapper>
          )}

          {/* Subscription Plans Section */}
          {subscription.subscription_status === 'trial' && (
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-center text-xl font-bold text-gray-900">
                  Choose Your Plan After 7-Day Trial
                </CardTitle>
                <p className="text-center text-gray-600">
                  Continue accessing SDS search and Sarah AI with one of our plans
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Basic Plan */}
                  <Card className="border-2 border-blue-200 hover:border-blue-300 transition-colors">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center space-x-2">
                          <Zap className="w-5 h-5 text-blue-600" />
                          <span>Basic Plan</span>
                        </CardTitle>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          Most Popular
                        </Badge>
                      </div>
                      <div className="text-3xl font-bold text-gray-900">
                        $50<span className="text-lg font-normal text-gray-600">/month</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3 mb-6">
                        <li className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          <span className="text-gray-700">SDS Search & Library</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          <span className="text-gray-700">Sarah AI Assistant</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          <span className="text-gray-700">Basic QR Codes</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          <span className="text-gray-700">Incident Reporting</span>
                        </li>
                      </ul>
                      <Button 
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        onClick={handleUpgrade}
                      >
                        Choose Basic Plan
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Premium Plan */}
                  <Card className="border-2 border-purple-200 hover:border-purple-300 transition-colors relative">
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-purple-600 text-white px-4 py-1">
                        Best Value
                      </Badge>
                    </div>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Crown className="w-5 h-5 text-purple-600" />
                        <span>Premium Plan</span>
                      </CardTitle>
                      <div className="text-3xl font-bold text-gray-900">
                        $500<span className="text-lg font-normal text-gray-600">/month</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3 mb-6">
                        <li className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                          <span className="text-gray-700">Everything in Basic</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                          <span className="text-gray-700">GHS Label Printing</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                          <span className="text-gray-700">Advanced QR Codes</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                          <span className="text-gray-700">Analytics Dashboards</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                          <span className="text-gray-700">Compliance Tracking</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                          <span className="text-gray-700">Audit Trails</span>
                        </li>
                      </ul>
                      <Button 
                        className="w-full bg-purple-600 hover:bg-purple-700"
                        onClick={handleUpgrade}
                      >
                        Choose Premium Plan
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default FacilityDashboard;
