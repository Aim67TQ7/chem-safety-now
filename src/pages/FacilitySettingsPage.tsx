import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import FacilitySettings from '@/components/FacilitySettings';
import FacilityNavbar from '@/components/FacilityNavbar';

interface FacilityData {
  id: string;
  slug: string;
  facility_name: string | null;
  contact_name: string | null;
  email: string | null;
  address: string | null;
  logo_url?: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
}

const FacilitySettingsPage = () => {
  const { facilitySlug } = useParams<{ facilitySlug: string }>();
  const [facilityData, setFacilityData] = useState<FacilityData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFacilityData = async () => {
      if (!facilitySlug) {
        setError('Facility slug is missing.');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const { data: facility, error: facilityError } = await supabase
          .from('facilities')
          .select('*')
          .eq('slug', facilitySlug)
          .single();

        if (facilityError) {
          console.error('Error fetching facility:', facilityError);
          setError('Failed to load facility data.');
          return;
        }

        if (!facility) {
          setError('Facility not found.');
          return;
        }

        setFacilityData(facility);
      } catch (err: any) {
        console.error('Error:', err);
        setError(err.message || 'Failed to load data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFacilityData();
  }, [facilitySlug]);

  const handleFacilityUpdate = (updatedData: FacilityData) => {
    setFacilityData(updatedData);
    toast({
      title: "Success",
      description: "Facility information updated successfully!",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading facility settings...</p>
        </div>
      </div>
    );
  }

  if (error || !facilityData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Settings Error</h2>
          <p className="text-gray-600 mb-4">{error || 'Facility not found'}</p>
          <Button onClick={() => navigate(`/facility/${facilitySlug}`)}>
            Return to Facility
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-red-50">
      <FacilityNavbar 
        facilityName={facilityData.facility_name || undefined}
        facilityLogo={facilityData.logo_url}
      />
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <FacilitySettings 
            facilityData={facilityData}
            onFacilityUpdate={handleFacilityUpdate}
          />
        </div>
      </div>
    </div>
  );
};

export default FacilitySettingsPage;
