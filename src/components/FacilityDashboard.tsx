
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Calendar, Globe, QrCode, Crown, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SubscriptionService, FacilitySubscription } from "@/services/subscriptionService";
import FacilityActivityCard from "./FacilityActivityCard";
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Global Navigation Bar */}
      <FacilityNavbar 
        facilityName={facility.facility_name}
        facilityLogo={facility.logo_url}
        facilityAddress={facility.address}
      />

      <div className="container mx-auto px-4 py-8">
        {/* Hero SDS Search Section - Primary Feature */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Find Your Safety Data Sheets
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Search our comprehensive database of Safety Data Sheets to get OSHA-compliant labeling and safety information instantly.
            </p>
          </div>
          
          {/* Enhanced SDS Search Component */}
          <div className="max-w-4xl mx-auto">
            <SDSSearch facilityId={facility.id} />
          </div>
          
          {/* Visual Emphasis Elements */}
          <div className="flex justify-center items-center mt-8 space-x-8 text-sm text-gray-500">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              <span>OSHA Compliant</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
              <span>Instant Results</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-purple-500 rounded-full mr-2 animate-pulse"></div>
              <span>Label Ready</span>
            </div>
          </div>
        </div>

        {/* Dashboard Cards Section */}
        <div className="grid grid-cols-1 gap-6">
          {/* Facility Activity Card */}
          <FacilityActivityCard facilityId={facility.id} />

          {/* Audit Trail - Now always available */}
          <AuditTrail facilityId={facility.id} />
        </div>
      </div>
    </div>
  );
};

export default FacilityDashboard;
