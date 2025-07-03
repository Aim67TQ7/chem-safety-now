
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Calendar, Globe, QrCode, Crown, Zap, ArrowDown, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SubscriptionService, FacilitySubscription } from "@/services/subscriptionService";
import FacilityActivityCard from "./FacilityActivityCard";
import AuditTrail from "./AuditTrail";
import SDSSearch from "./SDSSearch";
import FacilityNavbar from "./FacilityNavbar";
import { interactionLogger } from "@/services/interactionLogger";
import { AuditService } from "@/services/auditService";

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

  // Set facility context for all logging
  useEffect(() => {
    console.log('🏢 Setting facility context for logging:', facility.id);
    interactionLogger.setUserContext(null, facility.id);
    
    // Log facility dashboard access
    AuditService.logAction({
      facilityId: facility.id,
      actionType: 'facility_access',
      actionDescription: `Facility dashboard accessed: ${facility.facility_name}`,
    });

    interactionLogger.logFacilityUsage({
      eventType: 'dashboard_access',
      eventDetail: {
        facilityName: facility.facility_name,
        facilitySlug: facility.slug
      }
    });
  }, [facility.id, facility.facility_name, facility.slug]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Global Navigation Bar */}
      <FacilityNavbar 
        facilityName={facility.facility_name}
        facilityLogo={facility.logo_url}
        facilityAddress={facility.address}
        facilityId={facility.id}
      />

      <div className="container mx-auto px-4 py-8">
        {/* SDS Search Section */}
        <div className="mb-16 relative">
          {/* SDS Search Component */}
          <div className="max-w-6xl mx-auto">
            <SDSSearch facilityId={facility.id} />
          </div>
        </div>

        {/* Dashboard Cards Section */}
        <div className="grid grid-cols-1 gap-6">
          {/* Facility Activity Card */}
          <FacilityActivityCard facilityId={facility.id} />

          {/* Audit Trail */}
          <AuditTrail facilityId={facility.id} />
        </div>
      </div>
    </div>
  );
};

export default FacilityDashboard;
