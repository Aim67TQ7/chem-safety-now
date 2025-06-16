
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, RefreshCw, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SetupFailureDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
  error?: string;
}

export const SetupFailureDialog = ({ isOpen, onClose, onRetry, error }: SetupFailureDialogProps) => {
  const getErrorMessage = (error?: string) => {
    if (error?.includes('duplicate key')) {
      return "A facility with this name already exists. Please choose a different facility name.";
    }
    if (error?.includes('network')) {
      return "There seems to be a connection issue. Please check your internet connection and try again.";
    }
    if (error?.includes('permission')) {
      return "There was an authentication issue. Please refresh the page and try again.";
    }
    return "An unexpected error occurred during setup. Our team has been notified and we're working to resolve this.";
  };

  const handleContactSupport = () => {
    window.open('mailto:support@nov8v.ai?subject=Facility Setup Failed&body=Hello, I encountered an issue during facility setup. Error details: ' + (error || 'Unknown error'), '_blank');
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <AlertDialogTitle className="text-xl font-semibold text-gray-900">
                Setup Failed
              </AlertDialogTitle>
            </div>
          </div>
          <AlertDialogDescription className="text-gray-600 mt-4">
            {getErrorMessage(error)}
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleContactSupport}
            className="flex items-center"
          >
            <Mail className="w-4 h-4 mr-2" />
            Contact Support
          </Button>
          <AlertDialogAction
            onClick={onRetry}
            className="bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-700 hover:to-blue-700 flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
