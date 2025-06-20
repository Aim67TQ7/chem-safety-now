
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Users, 
  DollarSign, 
  Shield, 
  FileText, 
  Clock, 
  CheckCircle,
  ArrowRight,
  Star
} from "lucide-react";

const SalesPartnerPage = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    company: "",
    experience: "",
    stripeEmail: "",
    agreeToTerms: false,
    agreeToNDA: false,
    agreeToEthics: false
  });

  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send the data to your backend
    console.log("Sales partner application:", formData);
    setSubmitted(true);
  };

  const isFormValid = formData.fullName && 
                     formData.email && 
                     formData.phone && 
                     formData.stripeEmail && 
                     formData.agreeToTerms && 
                     formData.agreeToNDA && 
                     formData.agreeToEthics;

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Application Submitted Successfully!
            </h2>
            <p className="text-gray-600 mb-6">
              Thank you for your interest in becoming a ChemLabel-GPT sales partner. 
              We'll review your application and contact you within 24-48 hours to schedule 
              your platform demonstration and onboarding session.
            </p>
            <Button 
              onClick={() => window.location.href = '/'}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Return to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10">
              <img 
                src="/lovable-uploads/7cbd0a20-15f0-43f7-9877-126cab0c631c.png" 
                alt="ChemLabel-GPT Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ChemLabel-GPT</h1>
              <p className="text-sm text-gray-600">Sales Partner Program</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Join Our Sales Partner Program
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Earn 30% commission on all customer payments with no hidden fees
          </p>
          <div className="flex justify-center items-center space-x-6 text-sm text-gray-600">
            <div className="flex items-center">
              <DollarSign className="w-4 h-4 text-green-500 mr-2" />
              30% Commission
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 text-blue-500 mr-2" />
              20-30 Min Demo
            </div>
            <div className="flex items-center">
              <Shield className="w-4 h-4 text-purple-500 mr-2" />
              Ethical Standards
            </div>
          </div>
        </div>

        {/* Program Overview */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <CardTitle className="text-lg">Platform Demonstration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm">
                Receive comprehensive 20-30 minute training on the ChemLabel-GPT platform, 
                including all features, benefits, and sales talking points.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <CardTitle className="text-lg">30% Commission</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm">
                Earn 30% commission on every customer payment at their selected plan price, 
                including recurring monthly payments. Automatic Stripe payment splitting with no hidden fees.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <Shield className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <CardTitle className="text-lg">Ethical Standards</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm">
                All partners must agree to our ethical sales practices, non-disclosure 
                requirements, and professional conduct standards.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Commission Structure */}
        <Card className="mb-8 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center text-green-800">
              <Star className="w-5 h-5 mr-2" />
              Commission Structure
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">All Plan Sales</h4>
                <p className="text-2xl font-bold text-green-600 mb-1">30% Commission</p>
                <p className="text-sm text-gray-600">On every customer payment including recurring monthly subscriptions</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Payment Processing</h4>
                <p className="text-2xl font-bold text-green-600 mb-1">No Hidden Fees</p>
                <p className="text-sm text-gray-600">Automatic Stripe payment splitting at time of customer payment</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Application Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Sales Partner Application
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <Input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company (Optional)
                  </label>
                  <Input
                    type="text"
                    value={formData.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stripe Email for Commission Payments *
                </label>
                <Input
                  type="email"
                  value={formData.stripeEmail}
                  onChange={(e) => handleInputChange('stripeEmail', e.target.value)}
                  placeholder="Email associated with your Stripe account"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  This email will be used for automatic commission splitting through Stripe
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sales Experience (Optional)
                </label>
                <Textarea
                  value={formData.experience}
                  onChange={(e) => handleInputChange('experience', e.target.value)}
                  placeholder="Brief description of your sales experience, especially in B2B, SaaS, or industrial safety..."
                  rows={3}
                />
              </div>

              {/* Agreements */}
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900">Required Agreements</h4>
                
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="terms"
                    checked={formData.agreeToTerms}
                    onCheckedChange={(checked) => handleInputChange('agreeToTerms', checked)}
                  />
                  <label htmlFor="terms" className="text-sm text-gray-700">
                    I agree to the{" "}
                    <a 
                      href="/sales-partner-terms" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      Sales Partner Terms and Conditions
                    </a>
                    , including commission structure, payment terms, and partnership obligations.
                  </label>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="nda"
                    checked={formData.agreeToNDA}
                    onCheckedChange={(checked) => handleInputChange('agreeToNDA', checked)}
                  />
                  <label htmlFor="nda" className="text-sm text-gray-700">
                    I agree to maintain strict confidentiality regarding ChemLabel-GPT's business 
                    information, customer data, and all persons associated with the company.
                  </label>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="ethics"
                    checked={formData.agreeToEthics}
                    onCheckedChange={(checked) => handleInputChange('agreeToEthics', checked)}
                  />
                  <label htmlFor="ethics" className="text-sm text-gray-700">
                    I commit to ethical sales practices, honest representation of the product, 
                    and professional conduct in all customer interactions.
                  </label>
                </div>
              </div>

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  All applications are reviewed within 24-48 hours. Upon approval, you'll receive 
                  a calendar link to schedule your platform demonstration and complete the onboarding process.
                </AlertDescription>
              </Alert>

              <Button
                type="submit"
                disabled={!isFormValid}
                className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white py-3 text-lg font-semibold"
              >
                Submit Sales Partner Application
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">
            © 2025 ChemLabel-GPT. Professional Sales Partner Program.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default SalesPartnerPage;
