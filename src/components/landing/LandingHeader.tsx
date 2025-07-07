
import { Button } from "@/components/ui/button";
import GlobalSafetyStanWidget from "@/components/GlobalSafetyStanWidget";

interface LandingHeaderProps {
  showStanley: boolean;
  onTalkWithStanley: () => void;
}

const LandingHeader = ({ showStanley, onTalkWithStanley }: LandingHeaderProps) => {
  return (
    <>
      {/* GlobalSafetyStanWidget - Conditionally render Stanley */}
      {showStanley && (
        <GlobalSafetyStanWidget 
          companyName="QRsafetyapp.com"
          industry="Chemical Safety"
          customInstructions="You are Safety Stan, helping users understand how QRsafetyapp.com can save their facility hours of paperwork and improve safety compliance. Be enthusiastic about the benefits of digital safety management over paper systems."
        />
      )}

      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md shadow-lg border-b border-white/20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div>
                <h1 className="text-2xl font-bold text-white">QRsafetyapp.com</h1>
                <p className="text-sm text-gray-200">Digital Safety Management</p>
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default LandingHeader;
