
import { useState } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { 
  Building2, 
  AlertTriangle, 
  Settings, 
  Menu, 
  X,
  QrCode,
  MapPin,
  Printer
} from "lucide-react";

interface FacilityNavbarProps {
  facilityName?: string;
  facilityLogo?: string;
  facilityAddress?: string;
  onPrintLabelClick?: () => void;
}

const FacilityNavbar = ({ facilityName, facilityLogo, facilityAddress, onPrintLabelClick }: FacilityNavbarProps) => {
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
      name: 'Access Tools',
      path: `/facility/${facilitySlug}/access-tools`,
      icon: <QrCode className="w-4 h-4" />,
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
          {/* Facility Name and Address */}
          <div className="flex items-center space-x-3">
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
              {facilityAddress && (
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="w-3 h-3 mr-1" />
                  <span>{facilityAddress}</span>
                </div>
              )}
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
            
            {/* Print Label Button */}
            <Button
              onClick={onPrintLabelClick}
              className="flex items-center space-x-2 ml-2"
              size="sm"
            >
              <Printer className="w-4 h-4" />
              <span>Print Label</span>
            </Button>
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
              
              {/* Mobile Print Label Button */}
              <Button
                onClick={() => {
                  onPrintLabelClick?.();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center space-x-2 w-full justify-start mt-2"
                size="sm"
              >
                <Printer className="w-4 h-4" />
                <span>Print Label</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default FacilityNavbar;
