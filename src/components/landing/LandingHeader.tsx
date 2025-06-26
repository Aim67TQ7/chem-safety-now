
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
          companyName="ChemLabel-GPT"
          industry="Chemical Safety"
          customInstructions="You are Safety Stan, helping users understand how ChemLabel-GPT can save their facility hours of paperwork and improve safety compliance. Be enthusiastic about the benefits of digital safety management over paper systems."
        />
      )}

      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md shadow-lg border-b border-white/20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10">
                <img 
                  src="/lovable-uploads/7cbd0a20-15f0-43f7-9877-126cab0c631c.png" 
                  alt="ChemLabel-GPT Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">ChemLabel-GPT</h1>
                <p className="text-sm text-gray-200">AI-Powered Chemical Safety</p>
              </div>
            </div>
            <Button 
              onClick={onTalkWithStanley}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold"
            >
              Talk with Stanley
            </Button>
          </div>
        </div>
      </header>
    </>
  );
};

export default LandingHeader;
