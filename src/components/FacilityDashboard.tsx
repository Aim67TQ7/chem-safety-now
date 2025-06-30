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
import SDSDocumentSelector from "./SDSDocumentSelector";
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
        <div className="mb-16 relative">
          {/* SDS Search Component */}
          <div className="max-w-6xl mx-auto">
            <SDSSearch facilityId={facility.id} />
          </div>
        </div>

        {/* Dashboard Cards Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* SDS Document Selector for Label Printing */}
          <SDSDocumentSelector facilityId={facility.id} />
          
          {/* Facility Activity Card */}
          <FacilityActivityCard facilityId={facility.id} />
        </div>

        {/* Full Width Cards */}
        <div className="grid grid-cols-1 gap-6">
          {/* Audit Trail */}
          <AuditTrail facilityId={facility.id} />
        </div>
      </div>
    </div>
  );
};

export default FacilityDashboard;
