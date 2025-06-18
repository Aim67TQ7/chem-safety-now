
import { HomeIcon, Settings, FileText, Search } from "lucide-react";
import Index from "./pages/Index";
import FacilityPage from "./pages/FacilityPage";
import LandingPage from "./pages/LandingPage";
import QRCodePrintPage from "./pages/QRCodePrintPage";
import NotFound from "./pages/NotFound";
import SignupPage from "./pages/SignupPage";
import SDSDocumentsPage from "./pages/SDSDocumentsPage";

export const navItems = [
  {
    title: "Home",
    to: "/",
    icon: <HomeIcon className="h-4 w-4" />,
    page: <Index />,
  },
  {
    title: "SDS Documents",
    to: "/sds-documents",
    icon: <FileText className="h-4 w-4" />,
    page: <SDSDocumentsPage />,
  },
  {
    title: "Facility",
    to: "/facility/:slug",
    icon: <Settings className="h-4 w-4" />,
    page: <FacilityPage />,
  },
  {
    title: "Landing",
    to: "/landing",
    icon: <HomeIcon className="h-4 w-4" />,
    page: <LandingPage />,
  },
  {
    title: "QR Print",
    to: "/qr-print",
    icon: <Search className="h-4 w-4" />,
    page: <QRCodePrintPage />,
  },
  {
    title: "Signup",
    to: "/signup",
    icon: <Settings className="h-4 w-4" />,
    page: <SignupPage />,
  },
  {
    title: "Not Found",
    to: "*",
    icon: <HomeIcon className="h-4 w-4" />,
    page: <NotFound />,
  },
];
