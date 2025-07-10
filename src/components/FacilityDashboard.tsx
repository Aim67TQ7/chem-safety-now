
import { useState, useEffect } from "react";
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
  hideActivityCard?: boolean;
}

const FacilityDashboard = ({ facility, hideActivityCard = false }: FacilityDashboardProps) => {

  // Set facility context for all logging
  useEffect(() => {
    console.log('🏢 Setting facility context for logging:', facility.id);
    interactionLogger.setUserContext(null, facility.id);
    
    // Log facility dashboard access - non-blocking
    AuditService.logAction({
      facilityId: facility.id,
      actionType: 'facility_access',
      actionDescription: `Facility dashboard accessed: ${facility.facility_name}`,
    }).catch(error => {
      console.warn('Audit logging failed (non-critical):', error);
    });

    interactionLogger.logFacilityUsage({
      eventType: 'dashboard_access',
      eventDetail: {
        facilityName: facility.facility_name,
        facilitySlug: facility.slug
      }
    }).catch(error => {
      console.warn('Interaction logging failed (non-critical):', error);
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
              <SDSSearch facilityId={facility.id} facilitySlug={facility.slug} />
            </div>
          </div>

          {/* Dashboard Cards Section */}
          <div className="grid grid-cols-1 gap-6">
            {/* Facility Activity Card */}
            {!hideActivityCard && <FacilityActivityCard facilityId={facility.id} />}

            {/* Audit Trail */}
            <AuditTrail facilityId={facility.id} />
          </div>
        </div>

    </div>
  );
};

export default FacilityDashboard;
