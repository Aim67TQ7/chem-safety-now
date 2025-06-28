
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import QRCodeGenerator from "@/components/QRCodeGenerator";

interface QRCodePopupProps {
  isOpen: boolean;
  onClose: () => void;
  facilityData: {
    id: string;
    slug: string;
    facility_name: string | null;
    contact_name: string | null;
    email: string | null;
    address: string | null;
    logo_url?: string;
  };
  facilityUrl: string;
}

const QRCodePopup = ({ isOpen, onClose, facilityData, facilityUrl }: QRCodePopupProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            QR Code Generator
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          <QRCodeGenerator 
            facilityData={facilityData}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRCodePopup;
