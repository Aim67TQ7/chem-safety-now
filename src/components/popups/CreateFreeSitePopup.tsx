import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Zap, Shield, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CreateFreeSitePopupProps {
  isOpen: boolean;
  onClose: () => void;
  actionType?: string;
}

export const CreateFreeSitePopup: React.FC<CreateFreeSitePopupProps> = ({
  isOpen,
  onClose,
  actionType = 'printing'
}) => {
  const navigate = useNavigate();

  const handleCreateSite = () => {
    navigate('/signup');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Printer className="h-5 w-5 text-primary" />
            Enable {actionType.charAt(0).toUpperCase() + actionType.slice(1)}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-muted-foreground">
            You're currently in demo mode. Create your own free site to enable full printing capabilities and access all features.
          </p>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <Zap className="h-4 w-4 text-green-600 shrink-0" />
              <div>
                <div className="font-medium text-green-800">Get Started</div>
                <div className="text-sm text-green-600">Create your safety site</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <Shield className="h-4 w-4 text-blue-600 shrink-0" />
              <div>
                <div className="font-medium text-blue-800">Safety Management</div>
                <div className="text-sm text-blue-600">Organize your safety data</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
              <Clock className="h-4 w-4 text-purple-600 shrink-0" />
              <div>
                <div className="font-medium text-purple-800">Setup in 2 Minutes</div>
                <div className="text-sm text-purple-600">Quick and easy to get started</div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 pt-2">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
            >
              Continue Demo
            </Button>
            <Button 
              onClick={handleCreateSite}
              className="flex-1"
            >
              Create Free Site
            </Button>
          </div>
          
          <p className="text-xs text-center text-muted-foreground">
            Get started with your own safety management site
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};