
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { navItems } from "./nav-items";
import Index from "./pages/Index";
import FacilityPage from "./pages/FacilityPage";
import FacilitySettingsPage from "./pages/FacilitySettingsPage";
import SDSDocumentsPage from "./pages/SDSDocumentsPage";
import IncidentsPage from "./pages/IncidentsPage";
import QRCodePrintPage from "./pages/QRCodePrintPage";
import AdminPage from "./pages/AdminPage";
import NotFound from "./pages/NotFound";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import SalesPartnerPage from "./pages/SalesPartnerPage";
import SalesPartnerTermsPage from "./pages/SalesPartnerTermsPage";
import SignupPage from "./pages/SignupPage";
import SubscriptionSuccessPage from "./pages/SubscriptionSuccessPage";
import SubscriptionCancelPage from "./pages/SubscriptionCancelPage";
import SubscriptionRequiredPage from "./pages/SubscriptionRequiredPage";

const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/facility/:facilitySlug" element={<FacilityPage />} />
            <Route path="/facility/:facilitySlug/settings" element={<FacilitySettingsPage />} />
            <Route path="/facility/:facilitySlug/sds-documents" element={<SDSDocumentsPage />} />
            <Route path="/facility/:facilitySlug/incidents" element={<IncidentsPage />} />
            <Route path="/qr-print" element={<QRCodePrintPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/sales-partner" element={<SalesPartnerPage />} />
            <Route path="/sales-partner-terms" element={<SalesPartnerTermsPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/subscription/success" element={<SubscriptionSuccessPage />} />
            <Route path="/subscription/cancel" element={<SubscriptionCancelPage />} />
            <Route path="/subscription-required" element={<SubscriptionRequiredPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
