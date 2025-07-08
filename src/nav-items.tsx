import { HomeIcon, Building2, FileText, AlertTriangle, Settings, Users, BarChart3, HelpCircle, ShieldCheck, UserCheck, Phone, Crown, Wrench, Printer } from "lucide-react";
import Index from "@/pages/Index";
import FacilityPageWrapper from "@/pages/FacilityPageWrapper";
import DemoFacilityPage from "@/pages/DemoFacilityPage";
import FacilitySettingsPage from "@/pages/FacilitySettingsPage";
import SDSDocumentsPage from "@/pages/SDSDocumentsPage";
import IncidentsPage from "@/pages/IncidentsPage";
import QRCodePrintPage from "@/pages/QRCodePrintPage";
import AdminPage from "@/pages/AdminPage";
import UpgradePage from "@/pages/UpgradePage";
import PrivacyPage from "@/pages/PrivacyPage";
import TermsPage from "@/pages/TermsPage";
import SalesPartnerPage from "@/pages/SalesPartnerPage";
import SalesPartnerTermsPage from "@/pages/SalesPartnerTermsPage";
import SignupPage from "@/pages/SignupPage";
import AccessToolsPage from "@/pages/AccessToolsPage";
import LabelPrinterPage from "@/pages/LabelPrinterPage";
import AdminLabelPrinterPage from "@/pages/AdminLabelPrinterPage";
import SalesRepPage from "@/pages/SalesRepPage";
import SubscriptionPlansPage from "@/pages/SubscriptionPlansPage";
import SubscriptionSuccessPage from "@/pages/SubscriptionSuccessPage";
import SubscriptionCancelPage from "@/pages/SubscriptionCancelPage";

export const navItems = [
  {
    title: "Home",
    to: "/",
    icon: <HomeIcon className="h-4 w-4" />,
    page: <Index />,
  },
  {
    title: "Demo Facility",
    to: "/facility/demo",
    icon: <Building2 className="h-4 w-4" />,
    page: <DemoFacilityPage />,
  },
  {
    title: "Facility",
    to: "/facility/:facilitySlug",
    icon: <Building2 className="h-4 w-4" />,
    page: <FacilityPageWrapper />,
  },
  {
    title: "Shared Basic Facility",
    to: "/facility/basic/:companyId",
    icon: <Building2 className="h-4 w-4" />,
    page: <FacilityPageWrapper />,
  },
  {
    title: "Facility Settings",
    to: "/facility/:facilitySlug/settings",
    icon: <Settings className="h-4 w-4" />,
    page: <FacilitySettingsPage />,
  },
  {
    title: "Shared Basic Settings",
    to: "/facility/basic/:companyId/settings",
    icon: <Settings className="h-4 w-4" />,
    page: <FacilitySettingsPage />,
  },
  {
    title: "SDS Documents",
    to: "/facility/:facilitySlug/sds-documents",
    icon: <FileText className="h-4 w-4" />,
    page: <SDSDocumentsPage />,
  },
  {
    title: "Shared Basic SDS Documents",
    to: "/facility/basic/:companyId/sds-documents",
    icon: <FileText className="h-4 w-4" />,
    page: <SDSDocumentsPage />,
  },
  {
    title: "Incidents",
    to: "/facility/:facilitySlug/incidents",
    icon: <AlertTriangle className="h-4 w-4" />,
    page: <IncidentsPage />,
  },
  {
    title: "Access Tools",
    to: "/facility/:facilitySlug/access-tools",
    icon: <Wrench className="h-4 w-4" />,
    page: <AccessToolsPage />,
  },
  {
    title: "Shared Basic Access Tools",
    to: "/facility/basic/:companyId/access-tools",
    icon: <Wrench className="h-4 w-4" />,
    page: <AccessToolsPage />,
  },
  {
    title: "Label Printer",
    to: "/facility/:facilitySlug/label-printer",
    icon: <Printer className="h-4 w-4" />,
    page: <LabelPrinterPage />,
  },
  {
    title: "QR Code Print",
    to: "/qr-print/:facilitySlug",
    icon: <BarChart3 className="h-4 w-4" />,
    page: <QRCodePrintPage />,
  },
  {
    title: "Admin",
    to: "/admin",
    icon: <Users className="h-4 w-4" />,
    page: <AdminPage />,
  },
  {
    title: "Upgrade",
    to: "/upgrade",
    icon: <Crown className="h-4 w-4" />,
    page: <UpgradePage />,
  },
  {
    title: "Privacy Policy",
    to: "/privacy",
    icon: <ShieldCheck className="h-4 w-4" />,
    page: <PrivacyPage />,
  },
  {
    title: "Terms of Service",
    to: "/terms",
    icon: <FileText className="h-4 w-4" />,
    page: <TermsPage />,
  },
  {
    title: "Sales Partner",
    to: "/sales-partner",
    icon: <UserCheck className="h-4 w-4" />,
    page: <SalesPartnerPage />,
  },
  {
    title: "Sales Partner Terms",
    to: "/sales-partner-terms",
    icon: <FileText className="h-4 w-4" />,
    page: <SalesPartnerTermsPage />,
  },
  {
    title: "Signup",
    to: "/signup",
    icon: <UserCheck className="h-4 w-4" />,
    page: <SignupPage />,
  },
  {
    title: "Admin Label Printer",
    to: "/admin/label-printer",
    icon: <Printer className="h-4 w-4" />,
    page: <AdminLabelPrinterPage />,
  },
  {
    title: "Sales Rep Dashboard",
    to: "/sales-rep/:salesRepId",
    icon: <UserCheck className="h-4 w-4" />,
    page: <SalesRepPage />,
  },
  {
    title: "Subscribe",
    to: "/subscribe",
    icon: <Crown className="h-4 w-4" />,
    page: <SubscriptionPlansPage />,
  },
  {
    title: "Subscribe with Facility",
    to: "/subscribe/:facilitySlug",
    icon: <Crown className="h-4 w-4" />,
    page: <SubscriptionPlansPage />,
  },
  {
    title: "Subscription Success",
    to: "/subscription/success",
    icon: <Crown className="h-4 w-4" />,
    page: <SubscriptionSuccessPage />,
  },
  {
    title: "Subscription Cancel",
    to: "/subscription/cancel",
    icon: <Crown className="h-4 w-4" />,
    page: <SubscriptionCancelPage />,
  },
];
