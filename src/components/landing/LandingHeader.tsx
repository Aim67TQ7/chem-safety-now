
import { Button } from "@/components/ui/button";

const LandingHeader = () => {
  return (
    <>
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
