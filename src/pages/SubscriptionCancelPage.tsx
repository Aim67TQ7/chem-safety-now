import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft, Building2, HelpCircle } from "lucide-react";

const SubscriptionCancelPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const facilitySlug = searchParams.get('facility');

  const handleBackToPlans = () => {
    if (facilitySlug) {
      navigate(`/subscribe/${facilitySlug}`);
    } else {
      navigate('/subscribe');
    }
  };

  const handleBackToFacility = () => {
    if (facilitySlug) {
      navigate(`/facility/${facilitySlug}`);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto mb-4">
            <XCircle className="w-16 h-16 text-gray-400 mx-auto" />
          </div>
          <CardTitle className="text-2xl text-gray-700">
            Subscription Cancelled
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-gray-600">
              No problem! Your subscription process was cancelled and no payment was made.
            </p>
            <p className="text-sm text-gray-500">
              You can try again anytime or contact us if you need assistance.
            </p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-2">
              <HelpCircle className="w-4 h-4 text-blue-600" />
              <p className="text-sm text-blue-700 font-medium">
                Need Help?
              </p>
            </div>
            <p className="text-sm text-blue-600">
              If you experienced any issues during checkout or have questions about our plans, we're here to help!
            </p>
          </div>

          <div className="space-y-2">
            <Button 
              onClick={handleBackToPlans}
              size="lg"
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              View Plans Again
            </Button>

            <Button 
              onClick={handleBackToFacility}
              variant="outline"
              size="lg"
              className="w-full"
            >
              {facilitySlug ? (
                <>
                  <Building2 className="w-4 h-4 mr-2" />
                  Back to Facility
                </>
              ) : (
                <>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </>
              )}
            </Button>
          </div>

          <div className="text-xs text-gray-500 pt-2">
            <p>
              Questions? Contact our support team for personalized assistance.
              <br />
              We're happy to help you choose the right plan for your needs.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionCancelPage;