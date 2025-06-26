
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import FacilityDashboard from "@/components/FacilityDashboard";
import { InteractionLogger } from "@/services/interactionLogger";
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

const FacilityPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [facility, setFacility] = useState<FacilityData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFacility = async () => {
      if (!slug) return;

      try {
        const { data, error } = await supabase
          .from('facilities')
          .select('*')
          .eq('slug', slug)
          .single();

        if (error) {
          console.error('Error fetching facility:', error);
          toast.error('Facility not found');
          return;
        }

        setFacility(data);
        
        // Log facility page visit
        InteractionLogger.logInteraction(
          'facility_page_visit',
          { 
            facility_id: data.id,
            facility_slug: slug
          }
        );
      } catch (error) {
        console.error('Error:', error);
        toast.error('Error loading facility');
      } finally {
        setLoading(false);
      }
    };

    fetchFacility();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading facility...</p>
        </div>
      </div>
    );
  }

  if (!facility) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Facility Not Found</h1>
          <p className="text-gray-600">The facility you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return <FacilityDashboard facility={facility} />;
};

export default FacilityPage;
