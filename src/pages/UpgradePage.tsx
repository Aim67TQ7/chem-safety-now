
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Zap, ArrowLeft, Shield, Flame, AlertTriangle, Skull, AlertCircle } from "lucide-react";
import { SubscriptionService, SubscriptionPlan } from "@/services/subscriptionService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const UpgradePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const facilitySlug = searchParams.get('facility');
  
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

    fetchPlans();
  }, []);

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

  const featureDescriptions = {
    sds_search: "Unlimited SDS document search and safety data access",
    ai_assistant: "24/7 access to Sarah, your AI safety manager", 
    basic_qr_codes: "Generate and print facility QR codes",
    label_printing: "Create GHS compliant chemical labels",
    qr_codes: "Advanced QR code features and analytics",
    dashboards: "Safety analytics and usage dashboards",
    compliance_tracking: "OSHA compliance monitoring tools",
    audit_trails: "Detailed audit trials and safety reporting"
  };

  const ghsPictograms = [
    {
      name: "Explosive",
      description: "Explosive materials that can cause serious injury",
      icon: "💥",
      color: "bg-red-100 border-red-300"
    },
    {
      name: "Flammable",
      description: "Materials that catch fire easily",
      icon: "🔥",
      color: "bg-orange-100 border-orange-300"
    },
    {
      name: "Oxidizing",
      description: "Materials that can cause or contribute to combustion",
      icon: "⭕",
      color: "bg-yellow-100 border-yellow-300"
    },
    {
      name: "Compressed Gas",
      description: "Pressurized containers that may explode if heated",
      icon: "🫙",
      color: "bg-blue-100 border-blue-300"
    },
    {
      name: "Corrosive",
      description: "Materials that can burn skin or eyes on contact",
      icon: "🧪",
      color: "bg-purple-100 border-purple-300"
    },
    {
      name: "Toxic",
      description: "Materials that are poisonous if inhaled, swallowed or absorbed",
      icon: "☠️",
      color: "bg-gray-100 border-gray-300"
    },
    {
      name: "Harmful",
      description: "Materials that may cause less serious health effects",
      icon: "⚠️",
      color: "bg-amber-100 border-amber-300"
    },
    {
      name: "Health Hazard",
      description: "Materials that may cause serious health effects",
      icon: "🫁",
      color: "bg-red-100 border-red-300"
    },
    {
      name: "Environmental Hazard",
      description: "Materials that are toxic to aquatic life",
      icon: "🌱",
      color: "bg-green-100 border-green-300"
    }
  ];

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => navigate(-1)}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Upgrade Your Safety Program</h1>
                <p className="text-gray-600">Choose the plan that's right for your facility</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* GHS Pictograms Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            GHS Safety Pictograms
          </h2>
          <p className="text-gray-600 text-center mb-8">
            The Globally Harmonized System (GHS) uses these 9 pictograms to communicate chemical hazards
          </p>
          <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-4 mb-8">
            {ghsPictograms.map((pictogram, index) => (
              <Card key={index} className={`${pictogram.color} hover:shadow-md transition-shadow`}>
                <CardContent className="p-4 text-center">
                  <div className="text-2xl mb-2">{pictogram.icon}</div>
                  <div className="text-xs font-medium text-gray-700">{pictogram.name}</div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>With our Premium plan:</strong> Generate professional GHS labels with the correct pictograms, 
              hazard statements, and precautionary statements automatically extracted from SDS documents.
            </p>
          </div>
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
                    Best Value
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
        </div>
      </div>
    </div>
  );
};

export default UpgradePage;
