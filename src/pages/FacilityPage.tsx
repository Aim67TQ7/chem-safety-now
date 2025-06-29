import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building, MapPin, Mail, Phone } from "lucide-react";
import FacilityNavbar from '@/components/FacilityNavbar';
import LabelPrinterPopup from '@/components/popups/LabelPrinterPopup';

interface Facility {
  id: string;
  slug: string;
  facility_name: string;
  contact_name: string;
  email: string;
  address: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
}

const FacilityPage = () => {
  const { facilitySlug } = useParams<{ facilitySlug: string }>();
  const [facility, setFacility] = useState<Facility | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLabelPrinter, setShowLabelPrinter] = useState(false);

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

        setFacility(data);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <FacilityNavbar 
        facilityName={facility?.facility_name}
        facilityLogo={facility?.logo_url}
        facilityAddress={facility?.address}
        onPrintLabelClick={() => setShowLabelPrinter(true)}
      />
      
      <div className="container mx-auto py-8">
        <Card className="max-w-3xl mx-auto">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-2xl font-bold">
              <Building className="w-5 h-5 mr-2 inline-block align-middle" />
              {facility?.facility_name}
            </CardTitle>
            <Badge variant="secondary">
              Created: {new Date(facility?.created_at || '').toLocaleDateString()}
            </Badge>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span className="text-gray-700">{facility?.address}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-gray-500" />
              <a href={`mailto:${facility?.email}`} className="text-blue-600 hover:underline">
                {facility?.email}
              </a>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-gray-500" />
              <span className="text-gray-700">{facility?.contact_name}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {showLabelPrinter && (
        <LabelPrinterPopup
          isOpen={showLabelPrinter}
          onClose={() => setShowLabelPrinter(false)}
        />
      )}
    </div>
  );
};

export default FacilityPage;
