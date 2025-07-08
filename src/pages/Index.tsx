
import { useEffect } from "react";
import HeroSection from "@/components/landing/HeroSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import ComparisonSection from "@/components/landing/ComparisonSection";
import ProblemStatementSection from "@/components/landing/ProblemStatementSection";
import CTASection from "@/components/landing/CTASection";
import LandingHeader from "@/components/landing/LandingHeader";
import LandingFooter from "@/components/landing/LandingFooter";
import AnalyticsService from "@/services/analytics";

const Index = () => {
  useEffect(() => {
    AnalyticsService.initializeGoogleAnalytics('AW-17319034937');
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col w-full">
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
