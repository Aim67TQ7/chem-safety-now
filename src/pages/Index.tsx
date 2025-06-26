
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { CheckCircle, Clock, AlertTriangle, TrendingUp, Award, Zap } from "lucide-react";
import SafetyStanAvatar from "@/components/SafetyStanAvatar";
import GlobalSafetyStanWidget from "@/components/GlobalSafetyStanWidget";

const Index = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [showStanley, setShowStanley] = useState(false);

  const handleGetStarted = () => {
    if (email) {
      navigate(`/signup?email=${encodeURIComponent(email)}`);
    } else {
      navigate("/signup");
    }
  };

  const handleTalkWithStanley = () => {
    setShowStanley(true);
  };

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat relative"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url('/lovable-uploads/d83b9d2d-01f6-44be-9fc0-7cd3b3a48061.png')`,
        backgroundBlendMode: 'overlay'
      }}
    >
      {/* Enhanced double-exposure overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/60 via-transparent to-green-900/60 mix-blend-multiply"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-blue-500/20 to-transparent mix-blend-screen"></div>
      
      {/* GlobalSafetyStanWidget - Conditionally render Stanley */}
      {showStanley && (
        <GlobalSafetyStanWidget 
          companyName="ChemLabel-GPT"
          industry="Chemical Safety"
          customInstructions="You are Safety Stan, helping users understand how ChemLabel-GPT can save their facility hours of paperwork and improve safety compliance. Be enthusiastic about the benefits of digital safety management over paper systems."
        />
      )}

      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md shadow-lg border-b border-white/20 relative z-10">
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
                <h1 className="text-2xl font-bold text-white">ChemLabel-GPT</h1>
                <p className="text-sm text-gray-200">AI-Powered Chemical Safety</p>
              </div>
            </div>
            <Button 
              onClick={handleTalkWithStanley}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold"
            >
              Talk with Stanley
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-white mb-6 drop-shadow-lg">
            Stop Wasting Hours on Paperwork
          </h1>
          <p className="text-xl text-gray-200 mb-8 max-w-3xl mx-auto drop-shadow-md">
            Eliminate time-consuming searches through filing cabinets and paper binders. 
            Get instant smartphone access to safety data sheets and incident reporting, 
            automated compliance tracking, and save hours of manual paperwork — 
            all while improving safety response times and regulatory readiness.
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
              className="bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-700 hover:to-blue-700 text-white px-8 py-3 text-lg font-semibold w-full sm:w-auto shadow-xl"
            >
              Start 7-Day Free Trial
            </Button>
          </div>

          <div className="flex items-center justify-center space-x-6 text-sm text-gray-200">
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
              Save 10+ Hours/Week
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
              No Paper Filing
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
              Auto Compliance
            </div>
          </div>
        </div>
      </section>

      {/* OSHA Warning Section */}
      <section className="py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Alert className="max-w-4xl mx-auto bg-red-900/20 border-red-400/30 backdrop-blur-sm mb-8">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-200 font-medium">
                <strong>2,888 OSHA citations</strong> were issued last year under Hazard Communication — the #2 most-cited standard in the U.S.
                <br />
                Most violations involved <strong>missing SDSs, outdated paper files, lost incident reports, and inaccessible safety info</strong> during inspections.
                <br />
                <strong className="text-red-100">Paper-based systems cost facilities an average of 15+ hours per week in manual filing, searching, and compliance updates.</strong>
              </AlertDescription>
            </Alert>

            {/* New Beta Features Announcement */}
            <div className="max-w-4xl mx-auto mb-8">
              <div className="bg-gradient-to-r from-blue-600/80 to-green-600/80 backdrop-blur-sm rounded-lg p-6 text-white border border-white/20">
                <div className="flex items-center justify-center mb-3">
                  <Zap className="w-6 h-6 mr-2" />
                  <span className="text-xl font-bold">2 New Features Added Monthly</span>
                </div>
                <p className="text-lg">
                  Lock in your price now as an early subscriber and you will have full access to Beta Testing new modules as they are released.
                </p>
              </div>
            </div>
            
            <h2 className="text-3xl font-bold text-white mb-4">
              📱 Why Smart Facilities Are Replacing Paper Systems
            </h2>
            <p className="text-xl text-gray-200 font-semibold mb-16">
              ChemLabel-GPT eliminates the time drain and compliance risks of paper-based safety management.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="p-6 text-center hover:shadow-lg transition-shadow bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <div className="flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-green-400 mr-2" />
                <h3 className="text-xl font-semibold">Instant SDS Access</h3>
              </div>
              <p className="text-gray-200">
                Scan QR codes for instant safety data — no more wasting time digging through filing cabinets or outdated binders.
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <div className="flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-green-400 mr-2" />
                <h3 className="text-xl font-semibold">Digital Incident Reports</h3>
              </div>
              <p className="text-gray-200">
                Submit and track incidents digitally — eliminate paperwork delays and improve response times with automated workflows.
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <div className="flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-green-400 mr-2" />
                <h3 className="text-xl font-semibold">Automated Compliance</h3>
              </div>
              <p className="text-gray-200">
                Auto-generate compliance reports — no more manual tracking or scrambling to find documents during inspections.
              </p>
            </Card>

            <Card className="p-6 text-center hover:shadow-lg transition-shadow bg-white/10 backdrop-blur-sm border-white/20 text-white">
              <div className="flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-green-400 mr-2" />
                <h3 className="text-xl font-semibold">Real-Time Updates</h3>
              </div>
              <p className="text-gray-200">
                Always current information — eliminate outdated paper documents and ensure teams access the latest safety data.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-white mb-16">
            From Hours of Filing to Seconds of Access
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">Scan & Access Instantly</h3>
              <p className="text-gray-200">
                Workers scan QR codes with their phones — instantly access safety information instead of searching through filing systems for 10+ minutes.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">Report Digitally</h3>
              <p className="text-gray-200">
                Submit incident reports and access procedures digitally — eliminate paper forms and speed up response times from hours to minutes.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-white">Auto-Track Compliance</h3>
              <p className="text-gray-200">
                All activity auto-logs for compliance — eliminate manual documentation and be audit-ready without hours of preparation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Paper vs Digital Comparison Section */}
      <section className="py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-white mb-16">
            The Real Cost of Paper Systems
          </h2>
          
          <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-red-900/20 border-2 border-red-400/30 backdrop-blur-sm rounded-lg p-8">
              <h3 className="text-2xl font-bold text-red-400 mb-6 flex items-center">
                <Clock className="w-6 h-6 mr-3" />
                Paper-Based Problems
              </h3>
              <ul className="space-y-4 text-red-200">
                <li className="flex items-start">
                  <AlertTriangle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                  <span><strong>15+ hours weekly</strong> spent filing, searching, and updating paper documents</span>
                </li>
                <li className="flex items-start">
                  <AlertTriangle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                  <span><strong>Lost documents</strong> during critical safety incidents</span>
                </li>
                <li className="flex items-start">
                  <AlertTriangle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                  <span><strong>Outdated information</strong> creating compliance risks</span>
                </li>
                <li className="flex items-start">
                  <AlertTriangle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                  <span><strong>Manual compliance reports</strong> taking hours to compile</span>
                </li>
                <li className="flex items-start">
                  <AlertTriangle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                  <span><strong>Inspection panic</strong> when documents can't be found</span>
                </li>
              </ul>
            </div>

            <div className="bg-green-900/20 border-2 border-green-400/30 backdrop-blur-sm rounded-lg p-8">
              <h3 className="text-2xl font-bold text-green-400 mb-6 flex items-center">
                <TrendingUp className="w-6 h-6 mr-3" />
                Digital Advantages
              </h3>
              <ul className="space-y-4 text-green-200">
                <li className="flex items-start">
                  <Award className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                  <span><strong>Seconds to access</strong> any safety document or incident report</span>
                </li>
                <li className="flex items-start">
                  <Award className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                  <span><strong>Always available</strong> information from any smartphone</span>
                </li>
                <li className="flex items-start">
                  <Award className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                  <span><strong>Auto-updated data</strong> ensures current information</span>
                </li>
                <li className="flex items-start">
                  <Award className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                  <span><strong>Automatic compliance tracking</strong> and report generation</span>
                </li>
                <li className="flex items-start">
                  <Award className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                  <span><strong>Audit-ready documentation</strong> at the click of a button</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Updated CTA Section */}
      <section className="py-20 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-r from-red-600/80 to-blue-600/80 backdrop-blur-sm rounded-lg p-8 text-white mb-8 border border-white/20">
            <h3 className="text-2xl font-bold mb-4">
              🟢 Ditch the dusty binders and filing cabinets.
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
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <h4 className="text-lg font-semibold mb-4 text-white">7-Day Free Trial Details</h4>
            <div className="grid md:grid-cols-3 gap-6 text-sm text-gray-200">
              <div>
                <strong className="text-white">No Credit Card Required</strong>
                <p>Start your trial immediately without payment details</p>
              </div>
              <div>
                <strong className="text-white">Complete Plan Access</strong>
                <p>Experience your selected plan's full feature set during trial</p>
              </div>
              <div>
                <strong className="text-white">Easy Upgrade</strong>
                <p>Choose your plan when trial ends, cancel anytime</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/50 backdrop-blur-sm text-white py-12 relative z-10 border-t border-white/20">
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
            <div className="flex items-center space-x-6">
              <a 
                href="/sales-partner" 
                className="text-gray-300 hover:text-white transition-colors text-sm"
              >
                Sales Partner Program
              </a>
              <p className="text-gray-300">
                © 2025 ChemLabel-GPT. OSHA Compliant Chemical Safety Solutions.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
