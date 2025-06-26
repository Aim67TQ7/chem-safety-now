
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const CTASection = () => {
  const navigate = useNavigate();
  const [email] = useState("");

  const handleGetStarted = () => {
    if (email) {
      navigate(`/signup?email=${encodeURIComponent(email)}`);
    } else {
      navigate("/signup");
    }
  };

  return (
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
  );
};

export default CTASection;
