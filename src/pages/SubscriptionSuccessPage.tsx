
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, Building2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const SubscriptionSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [countdown, setCountdown] = useState(5);
  const [facilityExists, setFacilityExists] = useState<boolean | null>(null);
  const [facilityName, setFacilityName] = useState<string>("");

  const facilitySlug = searchParams.get('facility');

  useEffect(() => {
    const validateFacilityAndRedirect = async () => {
      toast.success("Payment successful! Your subscription is now active.");
      
      // Validate facility if slug is provided
      if (facilitySlug) {
        try {
          const { data: facility, error } = await supabase
            .from('facilities')
            .select('facility_name')
            .eq('slug', facilitySlug)
            .single();

          if (error || !facility) {
            console.log('Facility not found after payment:', facilitySlug);
            setFacilityExists(false);
          } else {
            setFacilityExists(true);
            setFacilityName(facility.facility_name);
          }
        } catch (error) {
          console.error('Error validating facility after payment:', error);
          setFacilityExists(false);
        }
      } else {
        setFacilityExists(null);
      }

      // Countdown timer for auto-redirect
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleRedirect();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    };

    validateFacilityAndRedirect();
  }, [navigate, facilitySlug]);

  const handleRedirect = () => {
    if (facilitySlug && facilityExists) {
      navigate(`/facility/${facilitySlug}`);
    } else {
      navigate('/');
    }
  };

  const handleContinue = () => {
    handleRedirect();
  };

  const handleCreateFacility = () => {
    navigate('/signup');
  };

  // Show facility not found message
  if (facilitySlug && facilityExists === false) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-700">Payment Successful!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              Your subscription is now active! However, the facility "{facilitySlug}" could not be found.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700">
                You can create a new facility to get started with your subscription.
              </p>
            </div>

            <div className="space-y-2">
              <Button onClick={handleCreateFacility} className="w-full">
                <Building2 className="w-4 h-4 mr-2" />
                Create New Facility
              </Button>
              
              <Button onClick={() => navigate('/')} variant="outline" className="w-full">
                Continue to Home
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-700">Payment Successful!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            Thank you for your subscription! Your account has been upgraded and you now have access to all premium features.
            {facilityExists && facilityName && (
              <span className="block mt-2 font-medium">
                Welcome to {facilityName}!
              </span>
            )}
          </p>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-700">
              Redirecting in {countdown} seconds...
            </p>
          </div>

          <Button onClick={handleContinue} className="w-full">
            {facilityExists ? `Continue to ${facilityName || 'Dashboard'}` : 'Continue to Home'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionSuccessPage;
