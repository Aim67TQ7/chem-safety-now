
import { HomeIcon, Building2, FileText, AlertTriangle, Settings, Users, BarChart3, HelpCircle, ShieldCheck, UserCheck, Phone } from "lucide-react";

export const navItems = [
  {
    title: "Home",
    to: "/",
    icon: <HomeIcon className="h-4 w-4" />,
  },
  {
    title: "Facility",
    to: "/facility/:facilitySlug",
    icon: <Building2 className="h-4 w-4" />,
  },
  {
    title: "Facility Settings",
    to: "/facility/:facilitySlug/settings",
    icon: <Settings className="h-4 w-4" />,
  },
  {
    title: "SDS Documents",
    to: "/facility/:facilitySlug/sds-documents",
    icon: <FileText className="h-4 w-4" />,
  },
  {
    title: "Incidents",
    to: "/facility/:facilitySlug/incidents",
    icon: <AlertTriangle className="h-4 w-4" />,
  },
  {
    title: "QR Code Print",
    to: "/qr-print",
    icon: <BarChart3 className="h-4 w-4" />,
  },
  {
    title: "Admin",
    to: "/admin",
    icon: <Users className="h-4 w-4" />,
  },
  {
    title: "Privacy Policy",
    to: "/privacy",
    icon: <ShieldCheck className="h-4 w-4" />,
  },
  {
    title: "Terms of Service",
    to: "/terms",
    icon: <FileText className="h-4 w-4" />,
  },
  {
    title: "Sales Partner",
    to: "/sales-partner",
    icon: <UserCheck className="h-4 w-4" />,
  },
  {
    title: "Sales Partner Terms",
    to: "/sales-partner-terms",
    icon: <FileText className="h-4 w-4" />,
  },
  {
    title: "Signup",
    to: "/signup",
    icon: <UserCheck className="h-4 w-4" />,
  },
];
