
import { useState, useEffect } from "react";
import HeroSection from "@/components/landing/HeroSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import ComparisonSection from "@/components/landing/ComparisonSection";
import ProblemStatementSection from "@/components/landing/ProblemStatementSection";
import CTASection from "@/components/landing/CTASection";
import LandingHeader from "@/components/landing/LandingHeader";
import LandingFooter from "@/components/landing/LandingFooter";

const Index = () => {
  useEffect(() => {
    // Load Google tag script
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = 'https://www.googletagmanager.com/gtag/js?id=AW-17319034937';
    document.head.appendChild(script1);

    // Add gtag configuration
    const script2 = document.createElement('script');
    script2.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'AW-17319034937');
    `;
    document.head.appendChild(script2);

    // Cleanup function to remove scripts when component unmounts
    return () => {
      document.head.removeChild(script1);
      document.head.removeChild(script2);
    };
  }, []);

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
      
      <LandingHeader />

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
