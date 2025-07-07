
import { useState } from "react";
import HeroSection from "@/components/landing/HeroSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import ComparisonSection from "@/components/landing/ComparisonSection";
import ProblemStatementSection from "@/components/landing/ProblemStatementSection";
import CTASection from "@/components/landing/CTASection";
import LandingHeader from "@/components/landing/LandingHeader";
import LandingFooter from "@/components/landing/LandingFooter";

const Index = () => {
  const [showStanley, setShowStanley] = useState(false);

  const handleTalkWithStanley = () => {
    setShowStanley(true);
  };

  return (
    <div 
      className="min-h-screen bg-cover bg-left bg-no-repeat relative flex flex-col w-full"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.475), rgba(0, 0, 0, 0.475)), url('/lovable-uploads/d83b9d2d-01f6-44be-9fc0-7cd3b3a48061.png')`,
        backgroundBlendMode: 'overlay',
        backgroundSize: '100% auto',
        backgroundPosition: 'top left',
        minHeight: '100vh'
      }}
    >
      {/* Enhanced double-exposure overlay with blur and better contrast */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-black/20 to-green-900/30 mix-blend-multiply backdrop-blur-sm"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-blue-500/5 to-transparent mix-blend-screen"></div>
      
      <LandingHeader 
        showStanley={showStanley}
        onTalkWithStanley={handleTalkWithStanley}
      />

      <HeroSection />
      <HowItWorksSection />
      <ComparisonSection />
      <ProblemStatementSection />
      <CTASection />
      <LandingFooter />
    </div>
  );
};

export default Index;
