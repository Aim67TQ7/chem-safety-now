
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from "@/components/ui/card";
import FacilityDashboard from '@/components/FacilityDashboard';

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

        const { data, error } = await supabase
          .from('facilities')
          .select('*')
          .eq('slug', facilitySlug)
          .single();

        if (error) {
          throw new Error(`Failed to fetch facility: ${error.message}`);
        }

        // Ensure logo_url has a default value if null
        const facilityData = {
          ...data,
          logo_url: data.logo_url || ''
        };

        setFacility(facilityData);
      } catch (err: any) {
        setError(err.message || 'Failed to load facility data.');
        console.error(err);
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
