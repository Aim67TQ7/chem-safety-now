import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { CheckCircle, Clock, AlertTriangle, Crown, Zap } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  const handleGetStarted = () => {
    if (email) {
      navigate(`/signup?email=${encodeURIComponent(email)}`);
    } else {
      navigate("/signup");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-red-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
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
                <p className="text-sm text-gray-600">AI-Powered Chemical Safety</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
              OSHA Compliant
            </Badge>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Transform Your Facility's
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-blue-600"> Chemical Safety</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Replace paper-based SDS management with instant QR code access. Get AI-powered safety insights, 
            automatic compliance tracking, and professional audit trails.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto mb-8">
            <Input
              type="email"
              placeholder="Enter your work email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={handleGetStarted}
              className="bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-700 hover:to-blue-700 text-white px-8 py-3 text-lg font-semibold w-full sm:w-auto"
            >
              Start 7-Day Free Trial
            </Button>
          </div>

          <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              7-Day Free Trial
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              No App Required
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
              Setup in Minutes
            </div>
          </div>
        </div>
      </section>

      {/* OSHA Warning Section */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Alert className="max-w-4xl mx-auto bg-red-50 border-red-200 mb-8">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800 font-medium">
                <strong>2,888 OSHA citations</strong> were issued last year under Hazard Communication — the #2 most-cited standard in the U.S.
                <br />
                Most involved missing SDSs, mislabeled containers, or inaccessible safety info.
                <br />
                <strong className="text-red-900">Violations can trigger fines up to $16.5K each — and serious repeat offenders face up to $165K per violation.</strong>
              </AlertDescription>
            </Alert>
            
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              ⚠️ Why Businesses Choose ChemLabel-GPT
            </h2>
            <p className="text-xl text-gray-700 font-semibold mb-16">
              ChemLabel-GPT fixes that — instantly.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-green-500 mr-2" />
                <h3 className="text-xl font-semibold">Mobile SDS Access</h3>
              </div>
              <p className="text-gray-600">
                Scan QR codes to pull SDS documents in seconds — no login, no app.
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-green-500 mr-2" />
                <h3 className="text-xl font-semibold">AI-Powered Safety Assistant</h3>
              </div>
              <p className="text-gray-600">
                Ask real-time safety questions. Get instant answers based on your SDSs.
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-green-500 mr-2" />
                <h3 className="text-xl font-semibold">One-Click Label Generator</h3>
              </div>
              <p className="text-gray-600">
                Generate compliant secondary container labels with your facility's branding.
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-green-500 mr-2" />
                <h3 className="text-xl font-semibold">Audit-Ready Analytics</h3>
              </div>
              <p className="text-gray-600">
                Track who accessed what, when — and impress your inspector every time.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-16">
            How It Works
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Scan QR Code</h3>
              <p className="text-gray-600">
                Workers use their phones to scan facility QR codes posted throughout your site.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Search Chemicals</h3>
              <p className="text-gray-600">
                Instantly search for any chemical by product name and get comprehensive safety data.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Stay Compliant</h3>
              <p className="text-gray-600">
                All activity is logged automatically for OSHA compliance and audit readiness.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section - Updated for new tier structure */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Simple Facility-Based Pricing
          </h2>
          <p className="text-lg text-gray-600 mb-12">
            Choose the plan that fits your facility's safety needs
          </p>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-12">
            {/* Basic Plan */}
            <Card className="p-8 border-2 border-blue-200 relative">
              <div className="flex items-center justify-center mb-4">
                <Zap className="w-8 h-8 text-blue-500 mr-2" />
                <h3 className="text-2xl font-bold">Basic Plan</h3>
              </div>
              
              <div className="mb-6">
                <div className="flex items-baseline justify-center">
                  <span className="text-4xl font-bold text-gray-900">$50</span>
                  <span className="text-lg text-gray-600 ml-1">/month</span>
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  or $500/year (save $100)
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                <div className="flex items-center justify-center text-blue-800">
                  <Clock className="w-4 h-4 mr-2" />
                  <span className="font-semibold">7-Day Free Trial Included</span>
                </div>
              </div>
              
              <ul className="space-y-3 mb-8 text-left">
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  Unlimited worker QR code access
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  SDS document search database
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  Sarah AI safety assistant
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  Basic facility QR codes
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  OSHA compliance tracking
                </li>
              </ul>
              
              <Button 
                onClick={handleGetStarted}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold w-full"
              >
                Start Free Trial
              </Button>
            </Card>

            {/* Premium Plan */}
            <Card className="p-8 border-2 border-purple-200 relative shadow-xl scale-105">
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white">
                <Crown className="w-4 h-4 mr-1" />
                Most Popular
              </Badge>
              
              <div className="flex items-center justify-center mb-4">
                <Crown className="w-8 h-8 text-purple-500 mr-2" />
                <h3 className="text-2xl font-bold">Premium Plan</h3>
              </div>
              
              <div className="mb-6">
                <div className="flex items-baseline justify-center">
                  <span className="text-4xl font-bold text-gray-900">$500</span>
                  <span className="text-lg text-gray-600 ml-1">/month</span>
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  or $5,000/year (save $1,000)
                </div>
              </div>
              
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-6">
                <div className="flex items-center justify-center text-purple-800">
                  <Clock className="w-4 h-4 mr-2" />
                  <span className="font-semibold">7-Day Free Trial Included</span>
                </div>
              </div>
              
              <ul className="space-y-3 mb-8 text-left">
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  Everything in Basic plan
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  GHS-compliant label printing
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  Advanced QR code features
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  Safety analytics dashboard
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  Detailed audit trails
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  Priority support
                </li>
              </ul>
              
              <Button 
                onClick={handleGetStarted}
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 text-lg font-semibold w-full"
              >
                Start Free Trial
              </Button>
            </Card>
          </div>
          
          {/* Updated CTA Section */}
          <div className="bg-gradient-to-r from-red-600 to-blue-600 rounded-lg p-8 text-white mb-8">
            <h3 className="text-2xl font-bold mb-4">
              🟢 Stop gambling with compliance.
            </h3>
            <p className="text-xl mb-6">
              Get ChemLabel-GPT working for your team in under 15 minutes.
            </p>
            <Button 
              onClick={handleGetStarted}
              className="bg-white text-gray-900 hover:bg-gray-100 px-8 py-4 text-lg font-semibold"
            >
              Start 7-Day Free Trial Now
            </Button>
          </div>
          
          {/* Features List */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h4 className="text-lg font-semibold mb-4">7-Day Free Trial Details</h4>
            <div className="grid md:grid-cols-3 gap-6 text-sm text-gray-600">
              <div>
                <strong className="text-gray-900">No Credit Card Required</strong>
                <p>Start your trial immediately without payment details</p>
              </div>
              <div>
                <strong className="text-gray-900">Complete Plan Access</strong>
                <p>Experience your selected plan's full feature set during trial</p>
              </div>
              <div>
                <strong className="text-gray-900">Easy Upgrade</strong>
                <p>Choose your plan when trial ends, cancel anytime</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8">
                <img 
                  src="/lovable-uploads/7cbd0a20-15f0-43f7-9877-126cab0c631c.png" 
                  alt="ChemLabel-GPT Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-xl font-bold">ChemLabel-GPT</span>
            </div>
            <p className="text-gray-400">
              © 2025 ChemLabel-GPT. OSHA Compliant Chemical Safety Solutions.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
