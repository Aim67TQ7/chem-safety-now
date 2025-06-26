
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

const ProblemStatementSection = () => {
  return (
    <section className="py-20 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-6">
            Stop Wasting Hours on Paperwork
          </h2>
          <p className="text-xl text-gray-200 mb-8 max-w-4xl mx-auto">
            Eliminate time-consuming searches through filing cabinets and paper binders. 
            Get instant smartphone access to safety data sheets and incident reporting, 
            automated compliance tracking, and save hours of manual paperwork — 
            all while improving safety response times and regulatory readiness.
          </p>

          <Alert className="max-w-4xl mx-auto bg-red-900/20 border-red-400/30 backdrop-blur-sm mb-8">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-200 font-medium">
              <strong>2,888 OSHA citations</strong> were issued last year under Hazard Communication — the #2 most-cited standard in the U.S.
              <br />
              Most violations involved <strong>missing SDSs, outdated paper files, lost incident reports, and inaccessible safety info</strong> during inspections.
              <br />
              <strong className="text-red-100">Paper-based systems cost facilities an average of 15+ hours per week in manual filing, searching, and compliance updates.</strong>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </section>
  );
};

export default ProblemStatementSection;
