
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Crown, Zap, Check, Shield, Building2 } from "lucide-react";
import { SubscriptionService, SubscriptionPlan } from "@/services/subscriptionService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SubscriptionRequiredPage = () => {
  const { facilitySlug } = useParams();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [facilityExists, setFacilityExists] = useState<boolean | null>(null);
  const [facilityName, setFacilityName] = useState<string>("");
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlansAndValidateFacility = async () => {
      // Fetch subscription plans
      const subscriptionPlans = await SubscriptionService.getSubscriptionPlans();
      setPlans(subscriptionPlans);

      // Validate facility if slug is provided
      if (facilitySlug) {
        try {
          const { data: facility, error } = await supabase
            .from('facilities')
            .select('facility_name')
            .eq('slug', facilitySlug)
            .single();

          if (error || !facility) {
            console.log('Facility not found:', facilitySlug);
            setFacilityExists(false);
          } else {
            setFacilityExists(true);
            setFacilityName(facility.facility_name);
          }
        } catch (error) {
          console.error('Error validating facility:', error);
          setFacilityExists(false);
        }
      } else {
        // No facility slug provided - this is okay, user can still subscribe
        setFacilityExists(null);
      }

      setLoading(false);
    };

    fetchPlansAndValidateFacility();
  }, [facilitySlug]);

  const handleSelectPlan = async (plan: SubscriptionPlan) => {
    setProcessingPlan(plan.id);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          planId: plan.id,
          billingCycle,
          facilitySlug: facilityExists ? facilitySlug : undefined
        }
      });

      if (error) throw error;

      if (data?.url) {
        // Open Stripe checkout in a new tab
        window.open(data.url, '_blank');
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to start checkout process. Please try again.');
    } finally {
      setProcessingPlan(null);
    }
  };

  const handleCreateFacility = () => {
    navigate('/signup');
  };

  const featureDescriptions = {
    sds_search: "Unlimited SDS document search and safety data access",
    ai_assistant: "24/7 access to Sarah, your AI safety manager", 
    basic_qr_codes: "Generate and print facility QR codes",
    label_printing: "Create GHS compliant chemical labels",
    qr_codes: "Advanced QR code features and analytics",
    dashboards: "Safety analytics and usage dashboards",
    compliance_tracking: "OSHA compliance monitoring tools",
    audit_trails: "Detailed audit trails and safety reporting"
  };

  const getPrice = (plan: SubscriptionPlan) => {
    return billingCycle === 'monthly' ? plan.monthly_price : plan.annual_price;
  };

  const getSavings = (plan: SubscriptionPlan) => {
    const monthlyTotal = plan.monthly_price * 12;
    const savings = monthlyTotal - plan.annual_price;
    return Math.round((savings / monthlyTotal) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">Loading subscription plans...</div>
      </div>
    );
  }

  // Show facility not found message
  if (facilitySlug && facilityExists === false) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Building2 className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl text-red-700">Facility Not Found</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              The facility "{facilitySlug}" could not be found. You'll need to create a facility first before subscribing.
            </p>
            
            <div className="space-y-2">
              <Button onClick={handleCreateFacility} className="w-full">
                <Building2 className="w-4 h-4 mr-2" />
                Create Facility First
              </Button>
              
              <Button onClick={() => navigate('/')} variant="outline" className="w-full">
                Return to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ChemLabel-GPT</h1>
              <p className="text-gray-600">
                {facilityExists && facilityName ? 
                  `Subscription for ${facilityName}` : 
                  "Chemical Safety Management Platform"
                }
              </p>
            </div>
            <Badge variant="outline" className="border-red-200 text-red-700 bg-red-50">
              <AlertTriangle className="w-3 h-3 mr-1" />
              {facilityExists ? "Trial Expired" : "Subscription Required"}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Trial Expired Notice */}
        <div className="text-center mb-12">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
            <AlertTriangle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {facilityExists ? "Your 7-Day Trial Has Ended" : "Subscribe to ChemLabel-GPT"}
            </h2>
            <p className="text-gray-700 mb-4">
              {facilityExists ? 
                "To continue accessing SDS documents, Sarah AI assistant, and safety tools, please select a subscription plan below." :
                "Get access to SDS documents, Sarah AI assistant, and professional safety tools by selecting a subscription plan below."
              }
            </p>
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center">
                <Shield className="w-4 h-4 mr-1" />
                OSHA Compliant
              </div>
              <span>•</span>
              <span>Cancel Anytime</span>
              <span>•</span>
              <span>24/7 Support</span>
            </div>
          </div>

          {!facilityExists && !facilitySlug && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
              <p className="text-blue-700 text-sm">
                Don't have a facility yet? You can{" "}
                <button 
                  onClick={handleCreateFacility}
                  className="underline hover:no-underline font-medium"
                >
                  create one here
                </button>{" "}
                to get started with a 7-day free trial.
              </p>
            </div>
          )}
        </div>

        {/* Billing Cycle Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-100 p-1 rounded-lg flex">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-3 rounded-md text-sm font-medium transition-colors ${
                billingCycle === 'monthly' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-6 py-3 rounded-md text-sm font-medium transition-colors ${
                billingCycle === 'annual' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Annual Billing
              <Badge variant="secondary" className="ml-2 text-xs">Save up to 17%</Badge>
            </button>
          </div>
        </div>

        {/* Subscription Plans */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative ${
                plan.name === 'Premium' 
                  ? 'border-purple-200 shadow-xl scale-105' 
                  : 'border-gray-200'
              }`}
            >
              {plan.name === 'Premium' && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-purple-600 text-white px-4 py-2">
                    <Crown className="w-4 h-4 mr-1" />
                    Recommended
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-6">
                <CardTitle className="flex items-center justify-center space-x-2 text-xl">
                  {plan.name === 'Basic' && <Zap className="w-6 h-6 text-blue-500" />}
                  {plan.name === 'Premium' && <Crown className="w-6 h-6 text-purple-500" />}
                  <span>{plan.name} Plan</span>
                </CardTitle>
                <div className="space-y-2">
                  <div className="text-4xl font-bold">
                    ${getPrice(plan).toLocaleString()}
                    <span className="text-lg font-normal text-gray-600">
                      /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                    </span>
                  </div>
                  {billingCycle === 'annual' && (
                    <div className="text-sm text-green-600 font-medium">
                      Save {getSavings(plan)}% with annual billing
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="space-y-3">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start space-x-3">
                      <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">
                        {featureDescriptions[feature as keyof typeof featureDescriptions] || feature}
                      </span>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => handleSelectPlan(plan)}
                  disabled={processingPlan === plan.id}
                  size="lg"
                  className={`w-full text-lg py-6 ${
                    plan.name === 'Premium'
                      ? 'bg-purple-600 hover:bg-purple-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {processingPlan === plan.id ? 'Processing...' : `Get Started with ${plan.name}`}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center text-gray-600 mt-12 space-y-2">
          <p>All plans include unlimited customer support and can be canceled anytime.</p>
          <p>Payments are processed securely through Stripe. No setup fees.</p>
          <button 
            onClick={() => navigate('/')}
            className="text-blue-600 hover:text-blue-700 underline"
          >
            Return to main site
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionRequiredPage;
