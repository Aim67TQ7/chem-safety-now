
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft, CreditCard } from "lucide-react";

const SubscriptionCancelPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const facilitySlug = searchParams.get('facility');

  const handleRetryPayment = () => {
    if (facilitySlug) {
      navigate(`/subscribe/${facilitySlug}`);
    } else {
      navigate('/subscribe');
    }
  };

  const handleGoBack = () => {
    if (facilitySlug) {
      navigate(`/facility/${facilitySlug}`);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl text-red-700">Payment Cancelled</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            Your payment was cancelled. No charges have been made to your account.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-700">
              You can try again anytime or continue with your current plan.
            </p>
          </div>

          <div className="space-y-2">
            <Button onClick={handleRetryPayment} className="w-full">
              <CreditCard className="w-4 h-4 mr-2" />
              Try Payment Again
            </Button>
            
            <Button onClick={handleGoBack} variant="outline" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionCancelPage;
