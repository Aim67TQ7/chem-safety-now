
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
  Database
} from "lucide-react";


interface FacilityNavbarProps {
  facilityName?: string;
  facilityLogo?: string;
  facilityAddress?: string;
}

const FacilityNavbar = ({ facilityName, facilityLogo, facilityAddress }: FacilityNavbarProps) => {
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
    <nav className="bg-white border-b-2 border-gray-300 shadow-lg sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Enhanced Facility Name and Address for White-Label Prominence */}
          <div className="flex items-center space-x-4 bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-3 rounded-lg border border-blue-200">
            {facilityLogo && (
              <img 
                src={facilityLogo} 
                alt={facilityName || 'Facility'} 
                className="h-12 w-12 rounded-lg object-cover border-2 border-white shadow-sm"
              />
            )}
            <div className="flex flex-col">
              <span className="text-3xl font-bold text-gray-900 tracking-tight">
                {facilityName || 'Facility Dashboard'}
              </span>
              {facilityAddress && (
                <div className="flex items-center text-sm text-gray-700 font-medium">
                  <MapPin className="w-4 h-4 mr-2 text-blue-600" />
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
            
            {/* Manage SDS Button */}
            <Link to={`/facility/${facilitySlug}/sds-documents`}>
              <Button 
                size="sm" 
                className="flex items-center space-x-2 ml-2"
              >
                <Database className="w-4 h-4" />
                <span>Manage SDS</span>
              </Button>
            </Link>
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
              
              {/* Mobile Manage SDS Button */}
              <Link 
                to={`/facility/${facilitySlug}/sds-documents`}
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full"
              >
                <Button
                  className="flex items-center space-x-2 w-full justify-start mt-2"
                  size="sm"
                >
                  <Database className="w-4 h-4" />
                  <span>Manage SDS</span>
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default FacilityNavbar;
