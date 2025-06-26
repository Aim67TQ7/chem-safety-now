
import { Card } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

const BenefitsSection = () => {
  return (
    <section className="py-20 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-4">
            📱 Why Smart Facilities Are Replacing Paper Systems
          </h2>
          <p className="text-xl text-gray-200 font-semibold mb-16">
            ChemLabel-GPT eliminates the time drain and compliance risks of paper-based safety management.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card className="p-6 text-center hover:shadow-lg transition-shadow bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-400 mr-2" />
              <h3 className="text-xl font-semibold">Instant SDS Access</h3>
            </div>
            <p className="text-gray-200">
              Scan QR codes for instant safety data — no more wasting time digging through filing cabinets or outdated binders.
            </p>
          </Card>

          <Card className="p-6 text-center hover:shadow-lg transition-shadow bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-400 mr-2" />
              <h3 className="text-xl font-semibold">Digital Incident Reports</h3>
            </div>
            <p className="text-gray-200">
              Submit and track incidents digitally — eliminate paperwork delays and improve response times with automated workflows.
            </p>
          </Card>

          <Card className="p-6 text-center hover:shadow-lg transition-shadow bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-400 mr-2" />
              <h3 className="text-xl font-semibold">Automated Compliance</h3>
            </div>
            <p className="text-gray-200">
              Auto-generate compliance reports — no more manual tracking or scrambling to find documents during inspections.
            </p>
          </Card>

          <Card className="p-6 text-center hover:shadow-lg transition-shadow bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-400 mr-2" />
              <h3 className="text-xl font-semibold">Real-Time Updates</h3>
            </div>
            <p className="text-gray-200">
              Always current information — eliminate outdated paper documents and ensure teams access the latest safety data.
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
