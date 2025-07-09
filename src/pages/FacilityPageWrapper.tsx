
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from "@/components/ui/card";
import FacilityDashboard from '@/components/FacilityDashboard';
import { interactionLogger } from '@/services/interactionLogger';
import { AuditService } from '@/services/auditService';

interface Facility {
  id: string;
  slug: string;
  facility_name: string;
  contact_name: string;
  email: string;
  address: string;
  logo_url: string;
  created_at: string;
  updated_at: string;
}

const FacilityPageWrapper = () => {
  const { facilitySlug } = useParams<{ facilitySlug: string }>();
  const [facility, setFacility] = useState<Facility | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFacility = async () => {
      setLoading(true);
      setError(null);

      try {
        if (!facilitySlug) {
          setError('Facility slug is missing.');
          return;
        }

        console.log('🔍 Fetching facility with slug:', facilitySlug);

        const { data, error } = await supabase
          .from('facilities')
          .select('*')
          .eq('slug', facilitySlug)
          .maybeSingle(); // Use maybeSingle to avoid single() errors

        if (error) {
          console.error('Database error:', error);
          throw new Error(`Failed to fetch facility: ${error.message}`);
        }

        if (!data) {
          setError(`Facility not found with slug: ${facilitySlug}`);
          return;
        }

        // Validate facility data
        if (!data.id) {
          console.error('Facility data missing ID:', data);
          setError('Invalid facility data received.');
          return;
        }

        // Ensure logo_url has a default value if null
        const facilityData = {
          ...data,
          logo_url: data.logo_url || ''
        };

        console.log('✅ Facility loaded successfully:', facilityData.id);
        setFacility(facilityData);
        
        // Set up logging context once facility is loaded
        console.log('🏢 Facility loaded, setting up logging context:', facilityData.id);
        interactionLogger.setUserContext(null, facilityData.id);
        
        // Log page access with error handling
        try {
          await AuditService.logAction({
            facilityId: facilityData.id,
            actionType: 'page_access',
            actionDescription: `Facility page accessed: ${facilityData.facility_name}`,
          });
        } catch (auditError) {
          console.error('Failed to log audit action:', auditError);
          // Don't fail the page load if audit logging fails
        }

      } catch (err: any) {
        console.error('Error in fetchFacility:', err);
        setError(err.message || 'Failed to load facility data.');
      } finally {
        setLoading(false);
      }
    };

    fetchFacility();
  }, [facilitySlug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="p-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="p-8">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-4">Error</h2>
              <p className="text-gray-600">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!facility) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="p-8">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-4">Facility Not Found</h2>
              <p className="text-gray-600">The requested facility could not be found.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <FacilityDashboard facility={facility} />;
};

export default FacilityPageWrapper;
