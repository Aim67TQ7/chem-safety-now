
import { Button } from "@/components/ui/button";

const LandingHeader = () => {
  return (
    <>
      {/* Header */}
      <header className="bg-background shadow-lg border-b border-border relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div>
                <h1 className="text-2xl font-bold text-foreground">QRSafetyApp</h1>
                <p className="text-sm text-muted-foreground">Digital Safety Management</p>
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default LandingHeader;
