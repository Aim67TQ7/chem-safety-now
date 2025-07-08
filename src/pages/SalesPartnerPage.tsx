
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UserCheck, HandshakeIcon, TrendingUp } from "lucide-react";

const SalesPartnerPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-red-50">
      <div className="container mx-auto p-6">
        <div className="text-center mb-8">
          <HandshakeIcon className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sales Partner Program</h1>
          <p className="text-gray-600">Join our partner network and grow your business with QRSafetyApp</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Partner Benefits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li>• Competitive commission structure</li>
                <li>• Dedicated partner support</li>
                <li>• Marketing materials and resources</li>
                <li>• Training and certification programs</li>
                <li>• Co-marketing opportunities</li>
                <li>• Priority technical support</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="w-5 h-5" />
                Apply Now
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <Input placeholder="Company Name" />
                <Input placeholder="Contact Name" />
                <Input placeholder="Email Address" type="email" />
                <Input placeholder="Phone Number" />
                <Textarea placeholder="Tell us about your business and why you'd like to partner with us" />
                <Button className="w-full">Submit Application</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SalesPartnerPage;
