import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  FileText, 
  AlertTriangle, 
  UserPlus,
  Play,
  Eye,
  Ban
} from 'lucide-react';
import FacilityDashboard from './FacilityDashboard';

interface DemoFacilityDashboardProps {
  facility: {
    id: string;
    slug: string;
    facility_name: string;
    contact_name: string;
    email: string;
    address: string;
    logo_url: string;
    created_at: string;
    updated_at: string;
  };
}

const DemoFacilityDashboard: React.FC<DemoFacilityDashboardProps> = ({ facility }) => {
  const navigate = useNavigate();

  const handleCreateSite = () => {
    navigate('/signup');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Demo Mode Banner */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Play className="w-5 h-5" />
            <span className="font-semibold">DEMO MODE</span>
            <Badge variant="secondary" className="bg-white/20 text-white">
              Interactive Preview
            </Badge>
          </div>
          <Button 
            onClick={handleCreateSite}
            variant="secondary"
            size="sm"
            className="bg-white text-blue-600 hover:bg-gray-100"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Create Your Own Site
          </Button>
        </div>
      </div>

      {/* Demo Notice */}
      <div className="max-w-7xl mx-auto p-4">
        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <Eye className="h-4 w-4" />
          <AlertDescription className="text-blue-800">
            <strong>You're viewing a live demo.</strong> Feel free to explore all features! 
            Data modifications, printing, and downloads are disabled in demo mode.
          </AlertDescription>
        </Alert>
      </div>

      {/* Wrap the original dashboard with demo restrictions */}
      <div className="demo-mode-wrapper">
        <FacilityDashboard facility={facility} />
      </div>

      {/* Demo Override Styles */}
      <style>{`
        .demo-mode-wrapper .upgrade-button,
        .demo-mode-wrapper [data-testid="upgrade-button"] {
          display: none !important;
        }
        
        .demo-mode-wrapper button[type="submit"],
        .demo-mode-wrapper .print-button,
        .demo-mode-wrapper .download-button {
          position: relative;
          cursor: not-allowed;
          opacity: 0.6;
        }
        
        .demo-mode-wrapper button[type="submit"]::after,
        .demo-mode-wrapper .print-button::after,
        .demo-mode-wrapper .download-button::after {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.1);
          pointer-events: all;
        }
      `}</style>

      {/* Floating CTA */}
      <div className="fixed bottom-6 right-6 z-50">
        <Card className="shadow-2xl border-blue-200">
          <CardContent className="p-4">
            <div className="text-center space-y-3">
              <div className="text-sm font-medium text-blue-800">
                Ready to get started?
              </div>
              <Button 
                onClick={handleCreateSite}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Create Your Site
              </Button>
              <div className="text-xs text-gray-500">
                2-minute setup • No credit card required
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DemoFacilityDashboard;