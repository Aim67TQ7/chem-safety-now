import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import FacilityDashboard from "@/components/FacilityDashboard";
import SubscriptionPlansModal from "@/components/SubscriptionPlansModal";
import AIAssistantPopup from "@/components/popups/AIAssistantPopup";
import LabelPrinterPopup from "@/components/popups/LabelPrinterPopup";
import QRCodePopup from "@/components/popups/QRCodePopup";
import SDSViewerPopup from "@/components/popups/SDSViewerPopup";
import SDSSelectionDialog from "@/components/SDSSelectionDialog";
import SDSSearch from "@/components/SDSSearch";
import { SetupFailureDialog } from "@/components/SetupFailureDialog";

interface FacilityData {
  id: string;
  slug: string;
  facility_name: string | null;
  contact_name: string | null;
  email: string | null;
  address: string | null;
  logo_url?: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
}

interface SubscriptionInfo {
  subscription_status: 'trial' | 'basic' | 'premium' | 'expired';
  trial_days_remaining?: number;
}

const FacilityPage = () => {
  const { facilitySlug } = useParams<{ facilitySlug: string }>();
  const [facilityData, setFacilityData] = useState<FacilityData | null>(null);
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showLabelPrinter, setShowLabelPrinter] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showSDSViewer, setShowSDSViewer] = useState(false);
  const [showSDSSearch, setShowSDSSearch] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [sdsSearchResults, setSdsSearchResults] = useState<any[]>([]);
  const [showSDSSelection, setShowSDSSelection] = useState(false);
  const [isSetupMode, setIsSetupMode] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleQuickAction = async (action: string) => {
    console.log('Quick action triggered:', action);
    
    switch (action) {
      case 'settings':
        navigate(`/facility/${facilitySlug}/settings`);
        break;
      case 'sds_search':
        // Show the SDS search interface directly
        setShowSDSSearch(true);
        break;
      case 'incidents':
        navigate(`/facility/${facilitySlug}/incidents`);
        break;
      case 'label_printing':
        if (selectedDocument) {
          setShowLabelPrinter(true);
        } else {
          toast({
            title: "No SDS Selected",
            description: "Please select an SDS document first.",
            variant: "destructive"
          });
        }
        break;
      case 'access-tools':
        setShowQRCode(true);
        break;
      default:
        toast({
          title: "Action Unavailable",
          description: `The action "${action}" is not yet implemented.`,
        });
    }
  };

  const handleUpgrade = () => {
    setShowUpgradeModal(true);
  };

  useEffect(() => {
    const fetchFacilityData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (!facilitySlug) {
          setError('Facility slug is missing.');
          return;
        }

        // Fetch facility data
        const { data: facility, error: facilityError } = await supabase
          .from('facilities')
          .select('*')
          .eq('slug', facilitySlug)
          .single();

        if (facilityError) {
          console.error('Error fetching facility:', facilityError);
          setError('Failed to load facility data.');
          return;
        }

        if (!facility) {
          setError('Facility not found.');
          return;
        }

        setFacilityData(facility);

        // Calculate subscription info from facility data
        const trialEndDate = new Date(facility.trial_end_date);
        const now = new Date();
        const timeDiff = trialEndDate.getTime() - now.getTime();
        const daysRemaining = Math.max(0, Math.ceil(timeDiff / (1000 * 3600 * 24)));

        setSubscriptionInfo({
          subscription_status: facility.subscription_status as 'trial' | 'basic' | 'premium' | 'expired',
          trial_days_remaining: daysRemaining
        });

        // Check if setup is required
        if (!facility.contact_name || !facility.address) {
          setIsSetupMode(true);
        }

      } catch (err: any) {
        console.error('Error:', err);
        setError(err.message || 'Failed to load data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFacilityData();
  }, [facilitySlug]);

  const handleDocumentSelect = (document: any) => {
    setSelectedDocument(document);
    setShowSDSSelection(false);
    setShowSDSViewer(true);
    setShowSDSSearch(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading facility dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !facilityData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Access Error</h2>
          <p className="text-gray-600 mb-4">{error || 'Facility not found'}</p>
          <Button onClick={() => navigate('/')}>Return Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-red-50 p-6">
      <div className="max-w-7xl mx-auto">
        {isSetupMode ? (
          <SetupFailureDialog
            isOpen={true}
            onClose={() => setIsSetupMode(false)}
            onRetry={() => navigate(`/facility/${facilitySlug}/settings`)}
            error="Facility setup is incomplete. Please complete your facility information."
          />
        ) : (
          <FacilityDashboard
            facilityData={facilityData}
            subscriptionInfo={subscriptionInfo}
            onQuickAction={handleQuickAction}
            onUpgrade={handleUpgrade}
          />
        )}

        {/* Subscription Plans Modal */}
        <SubscriptionPlansModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          facilityId={facilityData?.id || ''}
          facilitySlug={facilityData?.slug || ''}
        />

        {/* AI Assistant Popup */}
        <AIAssistantPopup
          isOpen={showAIAssistant}
          onClose={() => setShowAIAssistant(false)}
          facilityData={facilityData}
          selectedDocument={selectedDocument}
          onGenerateLabel={(doc) => {
            setSelectedDocument(doc);
            setShowLabelPrinter(true);
            setShowAIAssistant(false);
          }}
        />

        {/* Label Printer Popup */}
        <LabelPrinterPopup
          isOpen={showLabelPrinter}
          onClose={() => setShowLabelPrinter(false)}
          selectedDocument={selectedDocument}
        />

        {/* QR Code Popup */}
        <QRCodePopup
          isOpen={showQRCode}
          onClose={() => setShowQRCode(false)}
          facilityData={facilityData}
          facilityUrl={`${window.location.origin}/facility/${facilityData?.slug}`}
        />

        {/* SDS Search Dialog */}
        {showSDSSearch && facilityData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold">Search Safety Data Sheets</h2>
                  <Button variant="ghost" onClick={() => setShowSDSSearch(false)}>
                    ✕
                  </Button>
                </div>
                <SDSSearch
                  facilityId={facilityData.id}
                  onDocumentSelect={handleDocumentSelect}
                />
              </div>
            </div>
          </div>
        )}

        {/* SDS Viewer Popup */}
        <SDSViewerPopup
          isOpen={showSDSViewer}
          onClose={() => setShowSDSViewer(false)}
          sdsDocument={selectedDocument}
        />

        {/* SDS Selection Dialog */}
        <SDSSelectionDialog
          isOpen={showSDSSelection}
          onClose={() => setShowSDSSelection(false)}
          sdsDocuments={sdsSearchResults}
          onSaveSelected={handleDocumentSelect}
        />
      </div>
    </div>
  );
};

export default FacilityPage;
