import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import FacilityDashboard from "@/components/FacilityDashboard";
import SubscriptionPlansModal from "@/components/modals/SubscriptionPlansModal";
import AIAssistantPopup from "@/components/popups/AIAssistantPopup";
import LabelPrinterPopup from "@/components/popups/LabelPrinterPopup";
import QRCodePopup from "@/components/popups/QRCodePopup";
import SDSViewerPopup from "@/components/popups/SDSViewerPopup";
import SDSSelectionDialog from "@/components/dialogs/SDSSelectionDialog";
import SetupFailureDialog from "@/components/dialogs/SetupFailureDialog";

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
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [sdsSearchResults, setSdsSearchResults] = useState<any[]>([]);
  const [showSDSSelection, setShowSDSSelection] = useState(false);
  const [isSetupMode, setIsSetupMode] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'settings':
        navigate(`/facility/${facilitySlug}/settings`);
        break;
      case 'sds_search':
      case 'search':
        setShowAIAssistant(true);
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

        // Fetch subscription info
        const { data: subscription, error: subscriptionError } = await supabase
          .from('facility_subscriptions')
          .select('*')
          .eq('facility_id', facility.id)
          .single();

        if (subscriptionError) {
          console.error('Error fetching subscription:', subscriptionError);
          // Do not block loading for subscription errors, just log it
        }

        setSubscriptionInfo(subscription || null);

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
            facilityData={facilityData}
            subscriptionInfo={subscriptionInfo}
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
          facilitySlug={facilityData.slug}
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
          facilityData={facilityData}
          selectedDocument={selectedDocument}
        />

        {/* QR Code Popup */}
        <QRCodePopup
          isOpen={showQRCode}
          onClose={() => setShowQRCode(false)}
          facilityData={facilityData}
        />

        {/* SDS Viewer Popup */}
        <SDSViewerPopup
          isOpen={showSDSViewer}
          onClose={() => setShowSDSViewer(false)}
          document={selectedDocument}
        />

        {/* SDS Selection Dialog */}
        <SDSSelectionDialog
          isOpen={showSDSSelection}
          onClose={() => setShowSDSSelection(false)}
          searchResults={sdsSearchResults}
          onDocumentSelect={handleDocumentSelect}
          facilityData={facilityData}
        />
      </div>
      {facilityData && (
        <FacilityDashboard
          facilityData={facilityData}
          subscriptionInfo={subscriptionInfo}
          onQuickAction={handleQuickAction}
          onUpgrade={handleUpgrade}
        />
      )}
    </div>
  );
};

export default FacilityPage;
