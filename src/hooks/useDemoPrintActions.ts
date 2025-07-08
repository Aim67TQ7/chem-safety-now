import { useDemoContext } from '@/contexts/DemoContext';

export const useDemoPrintActions = () => {
  const { isDemo, showDemoMessage } = useDemoContext();

  const handlePrintAction = (actionType: string, callback?: () => void) => {
    if (isDemo) {
      // Execute the callback to show print preview/dialog
      if (callback) callback();
      
      // Show demo message after a brief delay
      setTimeout(() => {
        showDemoMessage(
          'Print Action',
          `✅ In your real site, this ${actionType} would be sent to your printer. Create your own site to enable printing.`
        );
      }, 500);
      
      return false; // Prevent actual printing
    }
    
    return true; // Allow actual printing for non-demo
  };

  const handleDownloadAction = (actionType: string) => {
    if (isDemo) {
      showDemoMessage(
        'Download Action',
        `✅ In your real site, this ${actionType} would be downloaded to your device. Create your own site to enable downloads.`
      );
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