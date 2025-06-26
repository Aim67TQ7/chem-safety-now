
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
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
    <section className="flex-1 flex items-center justify-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 relative z-10">
      <div className="text-center">
        <h1 className="text-7xl font-bold text-white mb-8 drop-shadow-2xl leading-tight">
          Scan. Don't Scramble.
        </h1>
        <p className="text-3xl text-gray-100 mb-16 max-w-3xl mx-auto drop-shadow-lg font-medium">
          SDS and safety records are easily accessed with a quick scan.<br />
          <span className="text-2xl text-gray-300">Skip the filing cabinet hunt.</span>
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto mb-12">
          <Input
            type="email"
            placeholder="Enter your work email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 text-lg py-4"
          />
          <Button 
            onClick={handleGetStarted}
            className="bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-700 hover:to-blue-700 text-white px-10 py-4 text-xl font-bold w-full sm:w-auto shadow-2xl"
          >
            Start Free Trial
          </Button>
        </div>

        <div className="flex items-center justify-center space-x-8 text-lg text-gray-100 font-semibold">
          <div className="flex items-center">
            <CheckCircle className="w-6 h-6 text-green-400 mr-3" />
            Save 10+ Hours/Week
          </div>
          <div className="flex items-center">
            <CheckCircle className="w-6 h-6 text-green-400 mr-3" />
            No Paper Filing
          </div>
          <div className="flex items-center">
            <CheckCircle className="w-6 h-6 text-green-400 mr-3" />
            Auto Compliance
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
