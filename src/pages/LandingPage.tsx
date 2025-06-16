import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Smartphone, MapPin, FileText, BarChart3, Shield, Zap, CheckCircle, Clock } from "lucide-react";

const LandingPage = () => {
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

      {/* Benefits Section */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-16">
            Why EHS Managers Choose ChemLabel-GPT
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">📱 Mobile SDS Access</h3>
              <p className="text-gray-600">
                Workers scan QR codes for instant SDS access. No app downloads, no login required.
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">📍 GPS Compliance Tracking</h3>
              <p className="text-gray-600">
                Automatic location verification ensures OSHA compliance with time-stamped audit trails.
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">🏷️ Instant Label Generation</h3>
              <p className="text-gray-600">
                Generate GHS-compliant secondary container labels with your facility branding.
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">📊 Facility Analytics</h3>
              <p className="text-gray-600">
                Professional audit trails and usage analytics impress safety inspectors.
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

      {/* Pricing */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Simple, Facility-Based Pricing
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* 18-Month Plan */}
            <Card className="p-8 border-2 border-blue-200 relative">
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-red-600 to-blue-600 text-white">
                Most Popular - Save 44%
              </Badge>
              
              <div className="mb-6">
                <span className="text-5xl font-bold text-gray-900">$500</span>
                <span className="text-xl text-gray-600 ml-2">one-time</span>
              </div>
              
              <h3 className="text-2xl font-semibold mb-2">18-Month License</h3>
              <p className="text-gray-600 mb-4">
                Complete chemical safety solution for your entire facility
              </p>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6">
                <div className="flex items-center justify-center text-green-800">
                  <Clock className="w-4 h-4 mr-2" />
                  <span className="font-semibold">7-Day Free Trial Included</span>
                </div>
              </div>
              
              <Button 
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-700 hover:to-blue-700 text-white px-8 py-4 text-lg font-semibold w-full mb-4"
              >
                Start 7-Day Free Trial
              </Button>
              
              <p className="text-sm text-gray-500">
                Equivalent to $27.78/month - Cancel anytime during trial
              </p>
            </Card>

            {/* Monthly Plan */}
            <Card className="p-8 border border-gray-200">
              <div className="mb-6">
                <span className="text-5xl font-bold text-gray-900">$50</span>
                <span className="text-xl text-gray-600 ml-2">/ month</span>
              </div>
              
              <h3 className="text-2xl font-semibold mb-2">Monthly License</h3>
              <p className="text-gray-600 mb-4">
                Flexible monthly billing for your facility
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                <div className="flex items-center justify-center text-blue-800">
                  <Clock className="w-4 h-4 mr-2" />
                  <span className="font-semibold">7-Day Free Trial Included</span>
                </div>
              </div>
              
              <Button 
                onClick={handleGetStarted}
                variant="outline"
                className="border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white px-8 py-4 text-lg font-semibold w-full mb-4"
              >
                Start 7-Day Free Trial
              </Button>
              
              <p className="text-sm text-gray-500">
                Cancel anytime - No long-term commitment
              </p>
            </Card>
          </div>
          
          {/* Features List */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h4 className="text-lg font-semibold mb-4">Both plans include:</h4>
            <ul className="grid md:grid-cols-2 gap-3 text-left max-w-2xl mx-auto">
              <li className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                Unlimited worker access via QR codes
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                Custom branded facility website
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                AI-powered chemical safety assistant
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                Automatic compliance tracking
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                Professional audit trails
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                Label printing capabilities
              </li>
            </ul>
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

export default LandingPage;
