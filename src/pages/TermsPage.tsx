
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const TermsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8">
                <img 
                  src="/lovable-uploads/7cbd0a20-15f0-43f7-9877-126cab0c631c.png" 
                  alt="ChemLabel-GPT Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-lg font-bold text-gray-900">ChemLabel-GPT</span>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms of Service</h1>
          
          <p className="text-sm text-gray-600 mb-8">
            <strong>Last Updated:</strong> December 19, 2024
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 mb-4">
              By accessing and using ChemLabel-GPT ("Service"), you accept and agree to be bound by the terms and provision of this agreement. 
              If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Service Description</h2>
            <p className="text-gray-700 mb-4">
              ChemLabel-GPT is an AI-powered chemical safety management platform that provides:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Safety Data Sheet (SDS) management and access via QR codes</li>
              <li>Digital incident reporting and tracking</li>
              <li>Compliance monitoring and reporting tools</li>
              <li>Chemical safety information and guidance</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Responsibilities</h2>
            <p className="text-gray-700 mb-4">
              You are responsible for:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Providing accurate and complete facility information</li>
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>Ensuring compliance with all applicable safety regulations</li>
              <li>Properly training staff on the use of the Service</li>
              <li>Regularly reviewing and updating safety protocols</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Data and Privacy</h2>
            <p className="text-gray-700 mb-4">
              We take data security seriously. Your facility data, incident reports, and safety information are:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Encrypted in transit and at rest</li>
              <li>Used solely for providing the Service to you</li>
              <li>Not shared with third parties without your consent</li>
              <li>Subject to our Privacy Policy</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Limitation of Liability</h2>
            <p className="text-gray-700 mb-4">
              ChemLabel-GPT is a tool to assist with safety management but does not replace professional safety expertise or regulatory compliance obligations. 
              You remain solely responsible for:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Compliance with OSHA and other applicable regulations</li>
              <li>Accuracy of safety data and incident information</li>
              <li>Implementation of appropriate safety measures</li>
              <li>Training and safety protocols at your facility</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Subscription and Payment</h2>
            <p className="text-gray-700 mb-4">
              Subscription fees are billed in advance on a monthly or annual basis. 
              You may cancel your subscription at any time through your account settings or by contacting support.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Termination</h2>
            <p className="text-gray-700 mb-4">
              We may terminate or suspend your account immediately if you violate these terms. 
              Upon termination, your right to use the Service will cease immediately.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Changes to Terms</h2>
            <p className="text-gray-700 mb-4">
              We reserve the right to modify these terms at any time. 
              We will notify users of significant changes via email or through the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Contact Information</h2>
            <p className="text-gray-700 mb-4">
              If you have any questions about these Terms of Service, please contact us at:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700">
                <strong>Email:</strong> legal@chemlabel-gpt.com<br />
                <strong>Address:</strong> ChemLabel-GPT Legal Department<br />
                123 Safety Boulevard, Suite 100<br />
                Industrial City, IC 12345
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default TermsPage;
