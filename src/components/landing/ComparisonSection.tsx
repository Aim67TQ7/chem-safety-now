
import { Clock, AlertTriangle, TrendingUp, Award } from "lucide-react";

const ComparisonSection = () => {
  return (
    <section className="py-20 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center text-white mb-16">
          The Real Cost of Paper Systems
        </h2>
        
        <div className="grid md:grid-cols-2 gap-12">
          <div className="bg-red-900/20 border-2 border-red-400/30 backdrop-blur-sm rounded-lg p-8">
            <h3 className="text-2xl font-bold text-red-400 mb-6 flex items-center">
              <Clock className="w-6 h-6 mr-3" />
              Paper-Based Problems
            </h3>
            <ul className="space-y-4 text-red-200">
              <li className="flex items-start">
                <AlertTriangle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                <span><strong>15+ hours weekly</strong> spent filing, searching, and updating paper documents</span>
              </li>
              <li className="flex items-start">
                <AlertTriangle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                <span><strong>Lost documents</strong> during critical safety incidents</span>
              </li>
              <li className="flex items-start">
                <AlertTriangle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                <span><strong>Outdated information</strong> creating compliance risks</span>
              </li>
              <li className="flex items-start">
                <AlertTriangle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                <span><strong>Manual compliance reports</strong> taking hours to compile</span>
              </li>
              <li className="flex items-start">
                <AlertTriangle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                <span><strong>Inspection panic</strong> when documents can't be found</span>
              </li>
            </ul>
          </div>

          <div className="bg-green-900/20 border-2 border-green-400/30 backdrop-blur-sm rounded-lg p-8">
            <h3 className="text-2xl font-bold text-green-400 mb-6 flex items-center">
              <TrendingUp className="w-6 h-6 mr-3" />
              Digital Advantages
            </h3>
            <ul className="space-y-4 text-green-200">
              <li className="flex items-start">
                <Award className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                <span><strong>Seconds to access</strong> any safety document or incident report</span>
              </li>
              <li className="flex items-start">
                <Award className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                <span><strong>Always available</strong> information from any smartphone</span>
              </li>
              <li className="flex items-start">
                <Award className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                <span><strong>Auto-updated data</strong> ensures current information</span>
              </li>
              <li className="flex items-start">
                <Award className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                <span><strong>Automatic compliance tracking</strong> and report generation</span>
              </li>
              <li className="flex items-start">
                <Award className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                <span><strong>Audit-ready documentation</strong> at the click of a button</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ComparisonSection;
