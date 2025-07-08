
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Zap } from "lucide-react";
import { SubscriptionService, SubscriptionPlan } from "@/services/subscriptionService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SubscriptionPlansModalProps {
  isOpen: boolean;
  onClose: () => void;
  facilityId: string;
  currentPlan?: string;
  facilitySlug?: string;
}

const SubscriptionPlansModal = ({ isOpen, onClose, facilityId, currentPlan, facilitySlug }: SubscriptionPlansModalProps) => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      const subscriptionPlans = await SubscriptionService.getSubscriptionPlans();
      setPlans(subscriptionPlans);
      setLoading(false);
    };

    if (isOpen) {
      fetchPlans();
    }
  }, [isOpen]);

  const handleSelectPlan = async (plan: SubscriptionPlan) => {
    setProcessingPlan(plan.id);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          planId: plan.id,
          billingCycle,
          facilitySlug
        }
      });

      if (error) throw error;

      if (data?.url) {
        // Open Stripe checkout in a new tab
        window.open(data.url, '_blank');
        onClose(); // Close the modal after starting checkout
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

  const featureDescriptions = {
    sds_search: "Unlimited SDS document search",
    ai_assistant: "AI-powered safety guidance and analysis", 
    basic_qr_codes: "Generate facility QR codes",
    label_printing: "Create GHS compliant labels",
    custom_branding: "Custom branded facility site",
    incident_reporting: "Advanced incident reporting system",
    incidents: "Full incidents management",
    audit_trails: "Detailed audit trails and reporting"
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
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <DialogTitle className="sr-only">Loading Subscription Plans</DialogTitle>
          <div className="flex justify-center py-8">Loading subscription plans...</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center">Choose Your Plan</DialogTitle>
        </DialogHeader>

        {/* Billing Cycle Toggle */}
        <div className="flex justify-center mb-6">
          <div className="bg-gray-100 p-1 rounded-lg flex">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === 'monthly' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === 'annual' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Annual
              <Badge variant="secondary" className="ml-1 text-xs">Save up to 17%</Badge>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative ${
                plan.name === 'Premium' 
                  ? 'border-purple-200 shadow-lg' 
                  : plan.name === 'Pro'
                  ? 'border-blue-200 shadow-md'
                  : 'border-gray-200'
              }`}
            >
              {plan.name === 'Premium' && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-purple-600 text-white px-3 py-1">
                    <Crown className="w-3 h-3 mr-1" />
                    Full Featured
                  </Badge>
                </div>
              )}
              
              {plan.name === 'Pro' && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-600 text-white px-3 py-1">
                    <Zap className="w-3 h-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <CardTitle className="flex items-center justify-center space-x-2">
                  {plan.name === 'Basic' && <span className="text-green-500">🌱</span>}
                  {plan.name === 'Pro' && <Zap className="w-5 h-5 text-blue-500" />}
                  {plan.name === 'Premium' && <Crown className="w-5 h-5 text-purple-500" />}
                  <span>{plan.name}</span>
                </CardTitle>
                <div className="space-y-1">
                  {plan.name === 'Basic' && billingCycle === 'monthly' ? (
                    <div className="text-3xl font-bold">
                      $20<span className="text-lg font-normal text-gray-600">/month</span>
                    </div>
                  ) : (
                    <>
                      <div className="text-3xl font-bold">
                        ${getPrice(plan).toLocaleString()}
                        <span className="text-lg font-normal text-gray-600">
                          /{billingCycle === 'monthly' ? 'month' : 'year'}
                        </span>
                      </div>
                      {billingCycle === 'annual' && getSavings(plan) > 0 && (
                        <div className="text-sm text-green-600">
                          Save {getSavings(plan)}% annually
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start space-x-2">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">
                        {featureDescriptions[feature as keyof typeof featureDescriptions] || feature}
                      </span>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => handleSelectPlan(plan)}
                  disabled={currentPlan === plan.name.toLowerCase() || processingPlan === plan.id}
                  className={`w-full ${
                    plan.name === 'Premium'
                      ? 'bg-purple-600 hover:bg-purple-700'
                      : plan.name === 'Pro'
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {processingPlan === plan.id 
                    ? 'Processing...' 
                    : currentPlan === plan.name.toLowerCase() 
                      ? 'Current Plan' 
                      : `Choose ${plan.name}`
                  }
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center text-sm text-gray-600 mt-6">
          <p>All plans include 24/7 customer support and can be canceled anytime.</p>
          <p>Payments are processed securely through Stripe.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionPlansModal;
