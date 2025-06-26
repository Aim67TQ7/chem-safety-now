
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Calendar, Globe, QrCode } from "lucide-react";
import { SubscriptionService, FacilitySubscription } from "@/services/subscriptionService";
import SubscriptionStatusHeader from "./SubscriptionStatusHeader";
import FacilityActivityCard from "./FacilityActivityCard";
import AccessTools from "./AccessTools";
import FeatureAccessWrapper from "./FeatureAccessWrapper";
import AuditTrail from "./AuditTrail";
import SDSSearch from "./SDSSearch";

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
      {/* Header Section */}
      <header className="bg-white shadow-md py-4">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-800">{facility.facility_name} Dashboard</h1>
          <div className="flex items-center space-x-4">
            <Badge variant="outline">
              <Calendar className="w-4 h-4 mr-2" />
              Since {new Date(facility.created_at).toLocaleDateString()}
            </Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Hero Section - SDS Search in Prominent Colored Box */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-8 text-white shadow-lg">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold mb-2">Safety Data Sheet Access</h2>
              <p className="text-xl text-blue-100">Scan or search for chemical safety information instantly</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <SDSSearch facilityId={facility.id} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Facility Info & QR Code */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Building2 className="w-5 h-5 text-gray-500" />
                  <h2 className="text-lg font-semibold">{facility.facility_name}</h2>
                </div>
                <div className="text-gray-600">
                  <MapPin className="w-4 h-4 inline-block mr-1" />
                  {facility.address}
                </div>
                <div className="text-gray-600">
                  <Globe className="w-4 h-4 inline-block mr-1" />
                  <a href={`/facility/${facility.slug}`} className="text-blue-500 hover:underline">
                    View Public Page
                  </a>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex flex-col items-center justify-center">
                {facility.logo_url ? (
                  <img src={facility.logo_url} alt="Facility Logo" className="max-w-full h-auto rounded-md mb-3" />
                ) : (
                  <div className="text-gray-500 italic mb-3">No logo uploaded</div>
                )}
                <QrCode className="w-6 h-6 text-gray-500 mb-2" />
                <a href={`/facility/${facility.slug}`} className="text-sm text-blue-500 hover:underline">
                  Facility QR Code
                </a>
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Right Side */}
          <div className="lg:col-span-2 space-y-6">
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

            {/* Access Tools */}
            <AccessTools facilityData={facility} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacilityDashboard;
