import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

interface SalesPartnerSuccessPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const SalesPartnerSuccessPopup: React.FC<SalesPartnerSuccessPopupProps> = ({
  isOpen,
  onClose
}) => {
  const navigate = useNavigate();

  const handleContinue = () => {
    onClose();
    navigate('/');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
          <DialogTitle className="text-xl font-semibold">
            Application Submitted Successfully!
          </DialogTitle>
        </DialogHeader>
        
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">
            Thank you for your interest in becoming a QRSafetyApp sales partner. 
            We've received your application and will review it within 2-3 business days.
          </p>
          
          <p className="text-sm text-muted-foreground">
            Our team will contact you at the email address you provided with next steps.
          </p>
          
          <Button onClick={handleContinue} className="w-full">
            Continue to Home
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SalesPartnerSuccessPopup;