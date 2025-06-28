
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
    navigate('/upgrade');
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
        </div>
      </div>
    </div>
  );
};

export default FacilityDashboard;
