
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

const SalesPartnerTermsPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-red-50">
      <div className="container mx-auto p-6">
        <div className="text-center mb-8">
          <FileText className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sales Partner Terms</h1>
          <p className="text-gray-600">Terms and conditions for our sales partner program</p>
        </div>

        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Partner Agreement Terms</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <h3>1. Partner Responsibilities</h3>
            <p>Partners are expected to maintain professional standards and represent QRSafetyApp appropriately.</p>
            
            <h3>2. Commission Structure</h3>
            <p>Commission rates vary based on partnership tier and sales volume. Details will be provided upon approval.</p>
            
            <h3>3. Marketing Guidelines</h3>
            <p>All marketing materials must be approved by QRSafetyApp before use.</p>
            
            <h3>4. Confidentiality</h3>
            <p>Partners must maintain confidentiality of proprietary information and customer data.</p>
            
            <h3>5. Term and Termination</h3>
            <p>Partnership agreements are renewable annually and may be terminated with 30 days notice.</p>
            
            <h3>6. Support and Training</h3>
            <p>Partners receive access to training materials, support resources, and ongoing assistance.</p>
            
            <p className="text-sm text-gray-600 mt-8">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SalesPartnerTermsPage;
