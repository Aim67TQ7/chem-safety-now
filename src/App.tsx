
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { navItems } from "./nav-items";
import SDSDocumentsPage from "./pages/SDSDocumentsPage";
import SEOHelmet from "./components/SEOHelmet";
import ErrorBoundary from "./components/ErrorBoundary";
import { APIErrorHandler } from "./utils/apiErrorHandler";
import { ErrorTrackingService } from "./services/errorTrackingService";
import { useEffect } from "react";

const queryClient = new QueryClient();

// Global error event handlers
const setupGlobalErrorHandlers = () => {
  // Handle unhandled JavaScript errors
  window.addEventListener('error', (event) => {
    ErrorTrackingService.trackJSError(event.error || new Error(event.message), {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      global_error: true
    });
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    ErrorTrackingService.trackError(
      'client_error',
      `Unhandled Promise Rejection: ${event.reason}`,
      'error',
      {
        reason: event.reason,
        promise_rejection: true
      }
    );
  });

  // Setup API error tracking
  APIErrorHandler.setupSupabaseErrorTracking();
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
            <Routes>
              {navItems.map(({ to, page }) => (
                <Route key={to} path={to} element={page} />
              ))}
              <Route path="/admin/sds-documents" element={<SDSDocumentsPage />} />
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
