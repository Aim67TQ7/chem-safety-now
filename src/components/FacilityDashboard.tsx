
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
          {/* Header */}
          <div className="text-center mb-8 relative">
            <div className="relative z-10">
              <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-red-600 to-orange-600 mb-4 leading-tight">
                FIND YOUR SDS
              </h1>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
                Safety Data Sheet Search
              </h2>
              <p className="text-lg md:text-xl text-gray-700 max-w-4xl mx-auto font-semibold">
                Search our database to get OSHA-compliant labels instantly
              </p>
            </div>
          </div>
          
          {/* SDS Search Component */}
          <div className="max-w-6xl mx-auto">
            <SDSSearch facilityId={facility.id} />
          </div>
          
          {/* Status Elements */}
          <div className="flex justify-center items-center mt-8 space-x-8">
            <div className="flex items-center bg-green-100 px-4 py-2 rounded-full border-2 border-green-300">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse"></div>
              <span className="font-bold text-green-800">OSHA COMPLIANT</span>
            </div>
            <div className="flex items-center bg-blue-100 px-4 py-2 rounded-full border-2 border-blue-300">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-3 animate-pulse"></div>
              <span className="font-bold text-blue-800">INSTANT RESULTS</span>
            </div>
            <div className="flex items-center bg-purple-100 px-4 py-2 rounded-full border-2 border-purple-300">
              <div className="w-3 h-3 bg-purple-500 rounded-full mr-3 animate-pulse"></div>
              <span className="font-bold text-purple-800">LABEL READY</span>
            </div>
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
