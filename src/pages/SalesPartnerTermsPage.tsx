
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const SalesPartnerTermsPage = () => {
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
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Sales Partner Terms and Conditions</h1>
          
          <p className="text-sm text-gray-600 mb-8">
            <strong>Last Updated:</strong> December 20, 2024
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Agreement Acceptance</h2>
            <p className="text-gray-700 mb-4">
              By applying to become a ChemLabel-GPT Sales Partner ("Partner"), you accept and agree to be bound by these terms and conditions. 
              This agreement governs your relationship with ChemLabel-GPT as an independent sales representative.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Commission Structure</h2>
            <p className="text-gray-700 mb-4">
              <strong>Commission Rate:</strong> Partners earn 30% commission on all customer payments at the customer's selected plan price.
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Commission applies to initial payments and all recurring monthly payments</li>
              <li>No hidden fees or deductions from commission payments</li>
              <li>Automatic payment splitting through Stripe at time of customer payment</li>
              <li>Commission payments are processed within 2-7 business days after customer payment</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Payment Processing</h2>
            <p className="text-gray-700 mb-4">
              <strong>Stripe Integration:</strong> All commission payments are processed through Stripe's automatic payment splitting system.
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Partners must provide a valid Stripe-associated email address</li>
              <li>Partners are responsible for their own Stripe account setup and compliance</li>
              <li>Commission payments are subject to Stripe's standard processing fees on the partner's end</li>
              <li>Tax reporting and compliance are the partner's responsibility</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Sales Requirements and Conduct</h2>
            <p className="text-gray-700 mb-4">
              Partners must adhere to the following standards:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li><strong>Ethical Sales Practices:</strong> Honest and transparent representation of ChemLabel-GPT services</li>
              <li><strong>Professional Conduct:</strong> Maintain professional standards in all customer interactions</li>
              <li><strong>Platform Knowledge:</strong> Complete the required 20-30 minute platform demonstration and training</li>
              <li><strong>Accurate Information:</strong> Provide only accurate, up-to-date information about features and pricing</li>
              <li><strong>No Misleading Claims:</strong> Prohibited from making false or exaggerated claims about the platform</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Confidentiality and Non-Disclosure</h2>
            <p className="text-gray-700 mb-4">
              Partners agree to maintain strict confidentiality regarding:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>ChemLabel-GPT's business information, strategies, and proprietary data</li>
              <li>Customer information and data accessed during the sales process</li>
              <li>Pricing structures, commission rates, and internal business processes</li>
              <li>Identity and personal information of all persons associated with ChemLabel-GPT</li>
              <li>Technical specifications and platform details not publicly available</li>
            </ul>
            <p className="text-gray-700 mb-4">
              This confidentiality obligation continues indefinitely, even after termination of the partnership.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Independent Contractor Status</h2>
            <p className="text-gray-700 mb-4">
              Partners are independent contractors, not employees of ChemLabel-GPT. This means:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>No employee benefits, insurance, or employment protections apply</li>
              <li>Partners are responsible for their own taxes and business expenses</li>
              <li>No exclusive territory or customer assignment guarantees</li>
              <li>Partners may represent other non-competing products or services</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibent text-gray-900 mb-4">7. Termination</h2>
            <p className="text-gray-700 mb-4">
              Either party may terminate this agreement at any time with or without cause by providing 30 days written notice. 
              ChemLabel-GPT reserves the right to terminate immediately for:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Violation of ethical standards or professional conduct requirements</li>
              <li>Breach of confidentiality or non-disclosure obligations</li>
              <li>Misrepresentation of ChemLabel-GPT services or capabilities</li>
              <li>Fraudulent or illegal activities</li>
            </ul>
            <p className="text-gray-700 mb-4">
              Upon termination, partners forfeit rights to future commissions but retain earned commissions for completed sales.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Limitation of Liability</h2>
            <p className="text-gray-700 mb-4">
              ChemLabel-GPT's liability to partners is limited to unpaid commission amounts. 
              Partners acknowledge that commission payments depend on customer payments and platform performance.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Changes to Terms</h2>
            <p className="text-gray-700 mb-4">
              ChemLabel-GPT reserves the right to modify these terms with 30 days written notice to active partners. 
              Continued participation in the program constitutes acceptance of modified terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Contact Information</h2>
            <p className="text-gray-700 mb-4">
              For questions regarding these Sales Partner Terms and Conditions:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700">
                <strong>Email:</strong> partners@chemlabel-gpt.com<br />
                <strong>Address:</strong> ChemLabel-GPT Sales Partnership Department<br />
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

export default SalesPartnerTermsPage;
