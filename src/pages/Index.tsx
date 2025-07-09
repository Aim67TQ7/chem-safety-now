
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import HeroSection from "@/components/landing/HeroSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import ComparisonSection from "@/components/landing/ComparisonSection";
import ProblemStatementSection from "@/components/landing/ProblemStatementSection";
import FAQSection from "@/components/landing/FAQSection";
import TrustSection from "@/components/landing/TrustSection";
import CTASection from "@/components/landing/CTASection";
import LandingFooter from "@/components/landing/LandingFooter";
import AnalyticsService from "@/services/analytics";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    AnalyticsService.initializeGoogleAnalytics('AW-17319034937');
    
    // Auto-redirect to demo after 1 second
    const timer = setTimeout(() => {
      navigate('/facility/demo');
    }, 1000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col w-full">
      <HeroSection />
      <TrustSection />
      <HowItWorksSection />
      <ComparisonSection />
      <FAQSection />
      <ProblemStatementSection />
      <CTASection />
      <LandingFooter />
    </div>
  );
};

export default Index;
