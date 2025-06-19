
import { HomeIcon, Settings, FileText, Search, AlertTriangle } from "lucide-react";
import Index from "./pages/Index";
import FacilityPage from "./pages/FacilityPage";
import QRCodePrintPage from "./pages/QRCodePrintPage";
import NotFound from "./pages/NotFound";
import SignupPage from "./pages/SignupPage";
import SDSDocumentsPage from "./pages/SDSDocumentsPage";
import IncidentsPage from "./pages/IncidentsPage";

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
    title: "Incidents",
    to: "/incidents",
    icon: <AlertTriangle className="h-4 w-4" />,
    page: <IncidentsPage />,
  },
  {
    title: "Facility",
    to: "/facility/:facilitySlug",
    icon: <Settings className="h-4 w-4" />,
    page: <FacilityPage />,
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
