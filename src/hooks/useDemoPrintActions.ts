import { useDemoContext } from '@/contexts/DemoContext';

export const useDemoPrintActions = () => {
  const { isDemo, showCreateSitePopup } = useDemoContext();

  const handlePrintAction = (actionType: string, callback?: () => void) => {
    if (isDemo) {
      // Execute the callback to show print preview/dialog
      if (callback) callback();
      
      // Show create site popup after a brief delay
      setTimeout(() => {
        showCreateSitePopup('printing');
      }, 500);
      
      return false; // Prevent actual printing
    }
    
    return true; // Allow actual printing for non-demo
  };

  const handleDownloadAction = (actionType: string) => {
    if (isDemo) {
      showCreateSitePopup('download');
      return false;
    }
    
    return true;
  };

  return {
    handlePrintAction,
    handleDownloadAction,
    isDemo,
  };
};