
import { useState } from "react";
import HeroSection from "@/components/landing/HeroSection";
import BenefitsSection from "@/components/landing/BenefitsSection";
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
      className="min-h-screen bg-cover bg-center bg-no-repeat relative flex flex-col w-full"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('/lovable-uploads/d83b9d2d-01f6-44be-9fc0-7cd3b3a48061.png')`,
        backgroundBlendMode: 'overlay',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '100vh'
      }}
    >
      {/* Enhanced double-exposure overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-transparent to-green-900/30 mix-blend-multiply"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-blue-500/5 to-transparent mix-blend-screen"></div>
      
      <LandingHeader 
        showStanley={showStanley}
        onTalkWithStanley={handleTalkWithStanley}
      />

      <HeroSection />
      <BenefitsSection />
      <HowItWorksSection />
      <ComparisonSection />
      <ProblemStatementSection />
      <CTASection />
      <LandingFooter />
    </div>
  );
};

export default Index;
