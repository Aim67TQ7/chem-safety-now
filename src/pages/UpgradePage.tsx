
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Check, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

const UpgradePage = () => {
  const navigate = useNavigate();

  const plans = [
    {
      name: "Professional",
      price: "$49/month",
      features: [
        "Unlimited SDS documents",
        "Advanced AI extraction",
        "Custom label printing",
        "Priority support",
        "Advanced analytics"
      ]
    },
    {
      name: "Enterprise",
      price: "$199/month",
      features: [
        "Everything in Professional",
        "Multi-facility management",
        "Custom integrations",
        "Dedicated support",
        "Advanced reporting"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-red-50">
      <div className="container mx-auto p-6">
        <div className="text-center mb-8">
          <Crown className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Upgrade Your Plan</h1>
          <p className="text-gray-600">Choose the plan that's right for your organization</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <Card key={index} className="relative">
              {index === 1 && (
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-yellow-600">
                  <Star className="w-3 h-3 mr-1" />
                  Most Popular
                </Badge>
              )}
              <CardHeader className="text-center">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <div className="text-3xl font-bold text-blue-600">{plan.price}</div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center">
                      <Check className="w-4 h-4 text-green-600 mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button className="w-full" variant={index === 1 ? "default" : "outline"}>
                  Upgrade to {plan.name}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-8">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UpgradePage;
