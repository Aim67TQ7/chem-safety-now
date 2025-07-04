import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SubscriptionSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const facilitySlug = searchParams.get('facility');

  useEffect(() => {
    const verifySubscription = async () => {
      try {
        // Give Stripe webhook time to process
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Refresh subscription status if we have a facility
        if (facilitySlug) {
          const { data: facility } = await supabase
            .from('facilities')
            .select('subscription_status')
            .eq('slug', facilitySlug)
            .single();

          if (facility?.subscription_status !== 'trial') {
            toast.success('Subscription activated successfully!');
          }
        }
      } catch (error) {
        console.error('Error verifying subscription:', error);
      } finally {
        setLoading(false);
      }
    };

    verifySubscription();
  }, [facilitySlug]);

  const handleContinue = () => {
    if (facilitySlug) {
      navigate(`/facility/${facilitySlug}`);
    } else {
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Processing your subscription...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto mb-4">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
          </div>
          <CardTitle className="text-2xl text-green-700">
            Subscription Successful!
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-gray-600">
              Thank you for subscribing! Your payment has been processed successfully.
            </p>
            <p className="text-sm text-gray-500">
              You now have access to all the features included in your plan.
            </p>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-700 font-medium">
              What's next?
            </p>
            <p className="text-sm text-green-600 mt-1">
              {facilitySlug 
                ? "Return to your facility dashboard to start using your new features."
                : "Start exploring all the premium features now available to you."
              }
            </p>
          </div>

          <Button 
            onClick={handleContinue}
            size="lg"
            className="w-full"
          >
            {facilitySlug ? (
              <>
                <Building2 className="w-4 h-4 mr-2" />
                Go to Facility Dashboard
              </>
            ) : (
              <>
                <ArrowRight className="w-4 h-4 mr-2" />
                Continue to Dashboard
              </>
            )}
          </Button>

          <div className="text-xs text-gray-500 pt-2">
            <p>
              Need help? Contact our support team anytime.
              <br />
              You can manage your subscription from your account settings.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionSuccessPage;