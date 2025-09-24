
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { navItems } from "./nav-items";
import SDSDocumentsPage from "./pages/SDSDocumentsPage";
import UniversalPrinterPage from "./pages/UniversalPrinterPage";
import SEOHelmet from "./components/SEOHelmet";
import ErrorBoundary from "./components/ErrorBoundary";
import GlobalHeader from "./components/GlobalHeader";
import { APIErrorHandler } from "./utils/apiErrorHandler";
import { ErrorTrackingService } from "./services/errorTrackingService";
import { useEffect } from "react";

// Declare global gtag function for TypeScript
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

const queryClient = new QueryClient();

// Global error event handlers
const setupGlobalErrorHandlers = () => {
  // Handle unhandled JavaScript errors
  window.addEventListener('error', (event) => {
    // Don't track errors from external tracking scripts as critical
    const isTrackingScript = event.filename && (
      event.filename.includes('googletagmanager.com') ||
      event.filename.includes('google-analytics.com') ||
      event.filename.includes('doubleclick.net') ||
      event.filename.includes('googlesyndication.com')
    );
    
    ErrorTrackingService.trackJSError(event.error || new Error(event.message), {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      global_error: true,
      is_tracking_script: isTrackingScript
    });
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    // Check if the rejection is from a tracking script
    const reason = String(event.reason);
    const isTrackingScript = reason.includes('googletagmanager') || 
                            reason.includes('google-analytics') ||
                            reason.includes('doubleclick') ||
                            reason.includes('googlesyndication');
    
    ErrorTrackingService.trackError(
      'client_error',
      `Unhandled Promise Rejection: ${event.reason}`,
      isTrackingScript ? 'error' : 'error',
      {
        reason: event.reason,
        promise_rejection: true,
        is_tracking_script: isTrackingScript
      }
    );
  });

  // Setup API error tracking
  APIErrorHandler.setupSupabaseErrorTracking();
  
  // Add fallback for Google Analytics if it fails to load
  setTimeout(() => {
    if (typeof window.gtag === 'undefined') {
      console.warn('Google Analytics failed to load, continuing without tracking');
      // Create a noop gtag function to prevent errors
      window.gtag = function() {
        console.log('gtag called but GA not loaded:', arguments);
      };
    }
  }, 5000);
};

const App = () => {
  useEffect(() => {
    setupGlobalErrorHandlers();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <SEOHelmet />
            <GlobalHeader />
            <Routes>
              {navItems.map(({ to, page }) => (
                <Route key={to} path={to} element={page} />
              ))}
              <Route path="/admin/sds-documents" element={<SDSDocumentsPage />} />
              <Route path="/admin/print-tools" element={<UniversalPrinterPage />} />
              <Route path="/facility/:facilitySlug/print-tools" element={<UniversalPrinterPage />} />
              <Route path="/qr-print/:facilitySlug" element={navItems.find(item => item.to === "/qr-print/:facilitySlug")?.page} />
              <Route path="/sales-rep/:salesRepId" element={navItems.find(item => item.to === "/sales-rep/:salesRepId")?.page} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
