
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
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import SubscriptionBadge from '@/components/SubscriptionBadge';
import SubscriptionPlansModal from '@/components/SubscriptionPlansModal';
import DemoIndicator from '@/components/DemoIndicator';
import { useDemoContext } from '@/contexts/DemoContext';


interface FacilityNavbarProps {
  facilityName?: string;
  facilityLogo?: string;
  facilityAddress?: string;
  facilityId?: string;
}

const FacilityNavbar = ({ facilityName, facilityLogo, facilityAddress, facilityId }: FacilityNavbarProps) => {
  const { facilitySlug } = useParams<{ facilitySlug: string }>();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  
  // Check if we're in demo mode
  const isDemoMode = facilitySlug === 'demo';
  
  // Only fetch subscription data if not in demo mode
  const { subscription, loading, hasFeatureAccess } = useFeatureAccess(
    isDemoMode ? '' : (facilityId || '')
  );
  const { isDemo } = useDemoContext();
  

  // Dynamic navigation based on subscription level
  const getNavItems = () => {
    const baseItems = [
      {
        name: 'Dashboard',
        path: `/facility/${facilitySlug || 'demo'}`,
        icon: <Building2 className="w-4 h-4" />,
        feature: 'dashboard'
      },
      {
        name: 'Access Tools',
        path: `/facility/${facilitySlug || 'demo'}/access-tools`,
        icon: <QrCode className="w-4 h-4" />,
        feature: 'basic_qr_codes'
      },
    ];

    // Only add settings if not in demo mode
    if (!isDemoMode) {
      baseItems.push({
        name: 'Settings',
        path: `/facility/${facilitySlug || 'demo'}/settings`,
        icon: <Settings className="w-4 h-4" />,
        feature: 'settings'
      });
    }

    // For demo mode, always show incidents. For normal mode, check feature access
    const shouldShowIncidents = isDemoMode || hasFeatureAccess('incidents');
    
    if (shouldShowIncidents) {
      baseItems.splice(2, 0, {
        name: 'Incidents',
        path: `/facility/${facilitySlug || 'demo'}/incidents`,
        icon: <AlertTriangle className="w-4 h-4" />,
        feature: 'incidents'
      });
    }

    return baseItems;
  };

  const navItems = getNavItems();

  const isActive = (path: string) => {
    if (path === `/facility/${facilitySlug || 'demo'}`) {
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
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-gray-900 tracking-tight">
                  {facilityName || 'Facility Dashboard'}
                </span>
                <DemoIndicator />
              </div>
              {facilityAddress && (
                <div className="flex items-center text-sm text-gray-700 font-medium">
                  <MapPin className="w-4 h-4 mr-2 text-blue-600" />
                  <span>{facilityAddress}</span>
                </div>
              )}
            </div>
          </div>

          {/* Subscription Status - Hidden in demo mode */}
          {!isDemoMode && !isDemo && (
            <div className="hidden md:flex items-center">
              <SubscriptionBadge 
                subscription={subscription}
                onUpgrade={() => setShowSubscriptionModal(true)}
                loading={loading}
              />
            </div>
          )}

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
            <Link to={`/facility/${facilitySlug || 'demo'}/sds-documents`}>
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
              {/* Mobile Subscription Status - Hidden in demo mode */}
              {!isDemoMode && !isDemo && (
                <div className="px-3 py-2">
                  <SubscriptionBadge 
                    subscription={subscription}
                    onUpgrade={() => {
                      setIsMobileMenuOpen(false);
                      setShowSubscriptionModal(true);
                    }}
                    loading={loading}
                  />
                </div>
              )}
              
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
                to={`/facility/${facilitySlug || 'demo'}/sds-documents`}
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

      {/* Subscription Plans Modal - Hidden in demo mode */}
      {!isDemoMode && !isDemo && (
        <SubscriptionPlansModal
          isOpen={showSubscriptionModal}
          onClose={() => setShowSubscriptionModal(false)}
          facilityId={facilityId || ''}
          currentPlan={subscription?.subscription_status}
          facilitySlug={facilitySlug}
        />
      )}
    </nav>
  );
};

export default FacilityNavbar;
