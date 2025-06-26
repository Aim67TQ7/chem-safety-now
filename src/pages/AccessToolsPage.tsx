
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import FacilityNavbar from "@/components/FacilityNavbar";
import AccessTools from "@/components/AccessTools";
import { toast } from "sonner";

interface FacilityData {
  id: string;
  slug: string;
  facility_name: string;
  contact_name: string;
  email: string;
  address: string;
  logo_url: string;
  created_at: string;
}

const AccessToolsPage = () => {
  const { facilitySlug } = useParams<{ facilitySlug: string }>();
  const [facility, setFacility] = useState<FacilityData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFacility = async () => {
      if (!facilitySlug) {
        console.log('No facility slug provided');
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching facility with slug:', facilitySlug);
        const { data, error } = await supabase
          .from('facilities')
          .select('*')
          .eq('slug', facilitySlug)
          .maybeSingle();

        if (error) {
          console.error('Error fetching facility:', error);
          toast.error('Error loading facility');
          setLoading(false);
          return;
        }

        if (!data) {
          console.log('No facility found for slug:', facilitySlug);
          toast.error('Facility not found');
          setLoading(false);
          return;
        }

        console.log('Facility loaded successfully:', data);
        setFacility(data);
      } catch (error) {
        console.error('Error:', error);
        toast.error('Error loading facility');
      } finally {
        setLoading(false);
      }
    };

    fetchFacility();
  }, [facilitySlug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <FacilityNavbar 
          facilityName={facility?.facility_name}
          facilityLogo={facility?.logo_url}
        />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading facility...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!facility) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <FacilityNavbar 
          facilityName={facility?.facility_name}
          facilityLogo={facility?.logo_url}
        />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Facility Not Found</h1>
            <p className="text-gray-600">The facility you're looking for doesn't exist.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <FacilityNavbar 
        facilityName={facility.facility_name}
        facilityLogo={facility.logo_url}
      />
      
      <div className="container mx-auto px-4 py-8">
        <AccessTools facilityData={facility} />
      </div>
    </div>
  );
};

export default AccessToolsPage;
