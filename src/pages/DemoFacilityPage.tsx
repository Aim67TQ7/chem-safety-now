import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from "@/components/ui/card";
import DemoFacilityDashboard from '@/components/DemoFacilityDashboard';
import { DemoProvider } from '@/contexts/DemoContext';
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

const DemoFacilityPage = () => {
  const [facility, setFacility] = useState<Facility | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDemoFacility = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase
          .from('facilities')
          .select('*')
          .eq('slug', 'demo')
          .single();

        if (error) {
          throw new Error(`Failed to fetch demo facility: ${error.message}`);
        }

        // Ensure logo_url has a default value if null
        const facilityData = {
          ...data,
          logo_url: data.logo_url || ''
        };

        setFacility(facilityData);
        
        // Set up logging context for demo
        console.log('🎬 Demo facility loaded, setting up logging context:', facilityData.id);
        interactionLogger.setUserContext(null, facilityData.id);
        
        // Log demo access
        AuditService.logAction({
          facilityId: facilityData.id,
          actionType: 'demo_access',
          actionDescription: `Demo facility accessed: ${facilityData.facility_name}`,
        });

      } catch (err: any) {
        setError(err.message || 'Failed to load demo facility data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDemoFacility();
  }, []);

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
              <h2 className="text-xl font-semibold mb-4">Demo Unavailable</h2>
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
              <h2 className="text-xl font-semibold mb-4">Demo Not Found</h2>
              <p className="text-gray-600">The demo facility could not be found.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <DemoProvider>
      <DemoFacilityDashboard facility={facility} />
    </DemoProvider>
  );
};

export default DemoFacilityPage;