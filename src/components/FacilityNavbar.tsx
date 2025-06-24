
import { useState } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  FileText, 
  AlertTriangle, 
  Settings, 
  Menu, 
  X,
  Home
} from "lucide-react";

interface FacilityNavbarProps {
  facilityName?: string;
  facilityLogo?: string;
}

const FacilityNavbar = ({ facilityName, facilityLogo }: FacilityNavbarProps) => {
  const { facilitySlug } = useParams<{ facilitySlug: string }>();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    {
      name: 'Dashboard',
      path: `/facility/${facilitySlug}`,
      icon: <Building2 className="w-4 h-4" />,
    },
    {
      name: 'SDS Documents',
      path: `/facility/${facilitySlug}/sds-documents`,
      icon: <FileText className="w-4 h-4" />,
    },
    {
      name: 'Incidents',
      path: `/facility/${facilitySlug}/incidents`,
      icon: <AlertTriangle className="w-4 h-4" />,
    },
    {
      name: 'Settings',
      path: `/facility/${facilitySlug}/settings`,
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  const isActive = (path: string) => {
    if (path === `/facility/${facilitySlug}`) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Facility Name */}
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
              <Home className="w-5 h-5" />
              <span className="text-sm font-medium">Home</span>
            </Link>
            <span className="text-gray-300">/</span>
            {facilityLogo && (
              <img 
                src={facilityLogo} 
                alt={facilityName || 'Facility'} 
                className="h-8 w-8 rounded object-cover"
              />
            )}
            <div className="flex flex-col">
              <span className="text-lg font-semibold text-gray-900">
                {facilityName || 'Facility Dashboard'}
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            ))}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-2">
            <div className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default FacilityNavbar;
