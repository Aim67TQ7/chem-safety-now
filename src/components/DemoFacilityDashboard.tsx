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
  Ban,
  Printer
} from 'lucide-react';
import FacilityDashboard from './FacilityDashboard';
import SafetyLabel from './SafetyLabel';

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

      {/* Wrap the original dashboard with demo restrictions */}
      <div className="demo-mode-wrapper">
        <FacilityDashboard 
          facility={{
            ...facility,
            facility_name: "Demo Mfg",
            logo_url: "/lovable-uploads/e693ee78-a165-4208-819b-4972673e4366.png"
          }}
        />
      </div>

      {/* Label Printer Preview Card */}
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Printer className="w-5 h-5" />
              <span>Safety Label Generator Preview</span>
              <Badge variant="secondary">Demo Feature</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6 items-start">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Professional Safety Labels</h3>
                <p className="text-muted-foreground">
                  Generate OSHA-compliant safety labels with GHS pictograms, HMIS ratings, 
                  and hazard information directly from your SDS documents.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>Automatic data extraction from SDS documents</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>GHS pictograms and HMIS color coding</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>Multiple label sizes and formats</span>
                  </li>
                </ul>
                <Button 
                  onClick={() => navigate('/facility/demo/label-printer')}
                  className="w-full"
                >
                  Try Label Generator
                </Button>
              </div>
              <div className="flex justify-center">
                <SafetyLabel
                  productName="Acetone"
                  manufacturer="Demo Chemical Co."
                  chemicalFormula="C₃H₆O"
                  casNumber="67-64-1"
                  hmisHealth="1"
                  hmisFlammability="3"
                  hmisPhysical="0"
                  hmisSpecial="A"
                  selectedPictograms={["flame", "exclamation"]}
                  selectedHazards={["H225: Highly flammable liquid and vapor", "H319: Causes serious eye irritation", "H336: May cause drowsiness or dizziness"]}
                  ppeRequirements={["Safety glasses", "Chemical resistant gloves", "Adequate ventilation"]}
                  signalWord="DANGER"
                  labelWidth={288}
                  labelHeight={192}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>


      {/* Enhanced Interactive CTA */}
      <div className="fixed bottom-6 right-6 z-50">
        <Card className="shadow-2xl border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 max-w-xs">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="text-lg font-bold text-blue-900">
                Ready to get started?
              </div>
              <div className="text-sm text-gray-700 space-y-2">
                <p className="font-medium">Test all functions with your branded SDS site:</p>
                <ul className="text-xs space-y-1 text-left">
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                    <span>AI-powered SDS search & extraction</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                    <span>Professional safety label printing</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                    <span>Incident reporting & tracking</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                    <span>QR code generation & access tools</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                    <span>Custom facility branding</span>
                  </li>
                </ul>
              </div>
              
              <Button 
                onClick={handleCreateSite}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 font-semibold py-3"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Create Your Site
              </Button>
              
              <div className="space-y-1">
                <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">
                  7-Day Free Trial
                </Badge>
                <div className="text-xs text-gray-600">
                  No credit card required • 2-minute setup
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DemoFacilityDashboard;