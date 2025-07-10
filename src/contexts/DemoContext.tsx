import React, { createContext, useContext, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { CreateFreeSitePopup } from '@/components/popups/CreateFreeSitePopup';

interface DemoContextType {
  isDemo: boolean;
  showDemoMessage: (action: string, description?: string) => void;
  showCreateSitePopup: (actionType?: string) => void;
  handleDemoAction: (action: string, callback?: () => void) => void;
  navigateToSignup: () => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export const useDemoContext = () => {
  const context = useContext(DemoContext);
  if (!context) {
    // Return default context for non-demo pages
    return {
      isDemo: false,
      showDemoMessage: () => {},
      showCreateSitePopup: () => {},
      handleDemoAction: () => true,
      navigateToSignup: () => {},
    };
  }
  return context;
};

interface DemoProviderProps {
  children: React.ReactNode;
}

export const DemoProvider: React.FC<DemoProviderProps> = ({ children }) => {
  const { facilitySlug } = useParams();
  const navigate = useNavigate();
  const isDemo = facilitySlug === 'demo';
  
  const [showPopup, setShowPopup] = useState(false);
  const [currentActionType, setCurrentActionType] = useState('printing');

  const showDemoMessage = (action: string, description?: string) => {
    toast({
      title: `Demo Mode - ${action}`,
      description: description || `In your real site, this ${action.toLowerCase()} would work fully. Create your own site to enable all features.`,
      duration: 4000,
    });
  };

  const showCreateSitePopup = (actionType: string = 'printing') => {
    setCurrentActionType(actionType);
    setShowPopup(true);
  };

  const handleDemoAction = (action: string, callback?: () => void) => {
    if (isDemo) {
      showDemoMessage(action);
      // Execute callback for demo UI updates (like showing previews)
      if (callback) callback();
      return false; // Prevent actual action
    }
    return true; // Allow action for non-demo
  };

  const navigateToSignup = () => {
    navigate('/signup');
  };

  const value: DemoContextType = {
    isDemo,
    showDemoMessage,
    showCreateSitePopup,
    handleDemoAction,
    navigateToSignup,
  };

  return (
    <DemoContext.Provider value={value}>
      {children}
      <CreateFreeSitePopup 
        isOpen={showPopup}
        onClose={() => setShowPopup(false)}
        actionType={currentActionType}
      />
    </DemoContext.Provider>
  );
};

export default DemoProvider;