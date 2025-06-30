
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { navItems } from "./nav-items";
import AdminSDSDocumentsPage from "./pages/AdminSDSDocumentsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {navItems.map(({ to, page }) => (
            <Route key={to} path={to} element={page} />
          ))}
          <Route path="/admin/sds-documents" element={<AdminSDSDocumentsPage />} />
          <Route path="/qr-print/:facilitySlug" element={navItems.find(item => item.to === "/qr-print")?.page} />
          <Route path="/sales-rep/:salesRepId" element={navItems.find(item => item.to === "/sales-rep/:salesRepId")?.page} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
