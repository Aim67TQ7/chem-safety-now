
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Calendar, Globe, QrCode, Crown, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
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
    navigate(`/subscription/plans?facility=${facility.slug}`);
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

          {/* Upgrade Prompt for Trial Users */}
          {subscription.subscription_status === 'trial' && (
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-center text-xl font-bold text-gray-900">
                  Ready to Upgrade?
                </CardTitle>
                <p className="text-center text-gray-600">
                  Continue accessing SDS search and Sarah AI with one of our plans
                </p>
              </CardHeader>
              <CardContent className="text-center">
                <Button 
                  onClick={handleUpgrade}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg font-semibold"
                >
                  <Crown className="w-5 h-5 mr-2" />
                  View Plans & Pricing
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default FacilityDashboard;
