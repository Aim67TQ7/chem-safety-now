import React, { createContext, useContext, useState, useEffect } from 'react';

interface FreeSdsTrialContextType {
  hasUsedFreeTrial: boolean;
  remainingViews: number;
  useFreeTrial: () => void;
  resetTrial: () => void;
}

const FreeSdsTrialContext = createContext<FreeSdsTrialContextType | undefined>(undefined);

export const useFreeSdsTrial = () => {
  const context = useContext(FreeSdsTrialContext);
  if (!context) {
    throw new Error('useFreeSdsTrial must be used within a FreeSdsTrialProvider');
  }
  return context;
};

export const FreeSdsTrialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasUsedFreeTrial, setHasUsedFreeTrial] = useState(false);
  const [remainingViews, setRemainingViews] = useState(1);

  useEffect(() => {
    // Check localStorage for trial status
    const trialUsed = localStorage.getItem('sds-free-trial-used');
    const viewsUsed = localStorage.getItem('sds-free-trial-views');
    
    if (trialUsed === 'true') {
      setHasUsedFreeTrial(true);
      setRemainingViews(0);
    } else if (viewsUsed) {
      const used = parseInt(viewsUsed, 10);
      setRemainingViews(Math.max(0, 1 - used));
      setHasUsedFreeTrial(used >= 1);
    }
  }, []);

  const useFreeTrial = () => {
    if (remainingViews > 0) {
      const newRemaining = remainingViews - 1;
      setRemainingViews(newRemaining);
      
      if (newRemaining === 0) {
        setHasUsedFreeTrial(true);
        localStorage.setItem('sds-free-trial-used', 'true');
      }
      
      localStorage.setItem('sds-free-trial-views', '1');
    }
  };

  const resetTrial = () => {
    setHasUsedFreeTrial(false);
    setRemainingViews(1);
    localStorage.removeItem('sds-free-trial-used');
    localStorage.removeItem('sds-free-trial-views');
  };

  return (
    <FreeSdsTrialContext.Provider
      value={{
        hasUsedFreeTrial,
        remainingViews,
        useFreeTrial,
        resetTrial
      }}
    >
      {children}
    </FreeSdsTrialContext.Provider>
  );
};