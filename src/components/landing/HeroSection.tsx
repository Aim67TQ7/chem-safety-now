
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/signup");
  };

  return (
    <section className="flex-1 flex items-center justify-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 relative z-10">
      <div className="text-center">
        <h1 className="text-7xl font-bold text-white mb-8 drop-shadow-2xl leading-tight">
          Stop spending 15 minutes reading every SDS
        </h1>
        <p className="text-3xl text-gray-100 mb-16 max-w-3xl mx-auto drop-shadow-lg font-medium">
          AI extracts critical safety data in seconds - you approve in minutes
        </p>
        
        <div className="flex justify-center mb-12">
          <Button 
            onClick={handleGetStarted}
            className="bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-700 hover:to-blue-700 text-white px-12 py-6 text-2xl font-bold shadow-2xl"
          >
            Start Free Trial
          </Button>
        </div>

        <div className="flex items-center justify-center space-x-8 text-lg text-gray-100 font-semibold">
          <div className="flex items-center">
            <CheckCircle className="w-6 h-6 text-green-400 mr-3" />
            Same Compliance
          </div>
          <div className="flex items-center">
            <CheckCircle className="w-6 h-6 text-green-400 mr-3" />
            80% Less Time
          </div>
          <div className="flex items-center">
            <CheckCircle className="w-6 h-6 text-green-400 mr-3" />
            Zero Errors from Missed Details
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
