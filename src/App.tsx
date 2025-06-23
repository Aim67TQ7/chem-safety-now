
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { navItems } from "./nav-items";
import Index from "./pages/Index";
import SDSDocumentsPage from "./pages/SDSDocumentsPage";
import IncidentsPage from "./pages/IncidentsPage";
import AdminPage from "./pages/AdminPage";
import SubscriptionRequiredPage from "./pages/SubscriptionRequiredPage";
import SubscriptionSuccessPage from "./pages/SubscriptionSuccessPage";
import SubscriptionCancelPage from "./pages/SubscriptionCancelPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";
import SalesPartnerPage from "./pages/SalesPartnerPage";
import SalesPartnerTermsPage from "./pages/SalesPartnerTermsPage";
import GlobalSafetyStanWidget from "./components/GlobalSafetyStanWidget";

const queryClient = new QueryClient();

const AppContent = () => {
  const location = useLocation();
  const isSignupPage = location.pathname === '/signup';
  
  return (
    <>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/sds-documents" element={<SDSDocumentsPage />} />
        <Route path="/incidents" element={<IncidentsPage />} />
        <Route path="/secret-admin-dashboard" element={<AdminPage />} />
        <Route path="/subscribe/:facilitySlug?" element={<SubscriptionRequiredPage />} />
        <Route path="/subscription/success" element={<SubscriptionSuccessPage />} />
        <Route path="/subscription/cancel" element={<SubscriptionCancelPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/sales-partner" element={<SalesPartnerPage />} />
        <Route path="/sales-partner-terms" element={<SalesPartnerTermsPage />} />
        {navItems.map(({ to, page }) => (
          <Route key={to} path={to} element={page} />
        ))}
      </Routes>
      
      {/* Global Safety Stan Widget - appears on all pages */}
      <GlobalSafetyStanWidget 
        initialPosition={{ x: window.innerWidth - 100, y: window.innerHeight - 100 }}
        companyName="ChemLabel-GPT"
        industry="Chemical Safety Management"
        customInstructions="You are Safety Stan, an expert in chemical safety, OSHA compliance, and workplace safety. Help users with safety questions, SDS information, and compliance guidance."
      />
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
