
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

const ProblemStatementSection = () => {
  return (
    <section className="py-20 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-6">
            Still digging through filing cabinets when OSHA calls?
          </h2>
          <p className="text-xl text-gray-200 mb-8 max-w-4xl mx-auto">
            Most small facilities rely on paper binders and hope OSHA never shows up. When they do, you're scrambling.
          </p>

          <Alert className="max-w-4xl mx-auto bg-red-900/20 border-red-400/30 backdrop-blur-sm mb-8">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-200 font-medium">
              <div className="space-y-3">
                <div className="flex items-center">
                  <span className="text-red-300 mr-3">×</span>
                  <span><strong>15 minutes to find the right SDS</strong></span>
                </div>
                <div className="flex items-center">
                  <span className="text-red-300 mr-3">×</span>
                  <span><strong>Outdated safety data sheets</strong></span>
                </div>
                <div className="flex items-center">
                  <span className="text-red-300 mr-3">×</span>
                  <span><strong>Missing incident reports</strong></span>
                </div>
                <div className="flex items-center">
                  <span className="text-red-300 mr-3">×</span>
                  <span><strong>Compliance violations start at $15,000</strong></span>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          <p className="text-xl text-gray-200 max-w-3xl mx-auto font-medium">
            You know you need a safety program. You just don't know where to start.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ProblemStatementSection;
