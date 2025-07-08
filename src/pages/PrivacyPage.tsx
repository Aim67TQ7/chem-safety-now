
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const PrivacyPage = () => {
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
                  alt="QRsafetyapp.com Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-lg font-bold text-gray-900">QRsafetyapp.com</span>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
          
          <p className="text-sm text-gray-600 mb-8">
            <strong>Last Updated:</strong> December 19, 2024
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 mb-4">
              QRSafetyApp ("we," "our," or "us") is committed to protecting your privacy. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Service.
            </p>
            <p className="text-gray-700 mb-4">
              This policy complies with the General Data Protection Regulation (GDPR) and other applicable privacy laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-medium text-gray-900 mb-3">Personal Information</h3>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Contact information (name, email address, phone number)</li>
              <li>Facility information (company name, address, industry type)</li>
              <li>Account credentials and preferences</li>
              <li>Payment information (processed securely through third-party providers)</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-900 mb-3">Usage Data</h3>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>QR code scans and SDS access logs</li>
              <li>Incident reports and safety data</li>
              <li>Platform usage patterns and preferences</li>
              <li>Device information and IP addresses</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-700 mb-4">We use your information to:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Provide and maintain the QRSafetyApp Service</li>
              <li>Process transactions and manage subscriptions</li>
              <li>Generate compliance reports and safety analytics</li>
              <li>Improve our Service and develop new features</li>
              <li>Communicate with you about updates and support</li>
              <li>Ensure security and prevent fraud</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Cookie Policy</h2>
            <p className="text-gray-700 mb-4">
              We use cookies and similar technologies to enhance your experience. Here's what you need to know:
            </p>

            <h3 className="text-xl font-medium text-gray-900 mb-3">Essential Cookies</h3>
            <div className="bg-green-50 p-4 rounded-lg mb-4">
              <p className="text-gray-700 mb-2"><strong>Purpose:</strong> Required for basic functionality</p>
              <ul className="list-disc pl-6 text-gray-700">
                <li>Authentication and session management</li>
                <li>Security protection</li>
                <li>Load balancing and performance</li>
              </ul>
              <p className="text-sm text-gray-600 mt-2"><em>These cookies are necessary and cannot be disabled.</em></p>
            </div>

            <h3 className="text-xl font-medium text-gray-900 mb-3">Analytics Cookies</h3>
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <p className="text-gray-700 mb-2"><strong>Purpose:</strong> Help us understand usage patterns</p>
              <ul className="list-disc pl-6 text-gray-700">
                <li>Page views and feature usage</li>
                <li>Performance monitoring</li>
                <li>Error tracking and debugging</li>
              </ul>
              <p className="text-sm text-gray-600 mt-2"><em>You can opt out of these cookies in your browser settings.</em></p>
            </div>

            <h3 className="text-xl font-medium text-gray-900 mb-3">Functional Cookies</h3>
            <div className="bg-yellow-50 p-4 rounded-lg mb-4">
              <p className="text-gray-700 mb-2"><strong>Purpose:</strong> Remember your preferences</p>
              <ul className="list-disc pl-6 text-gray-700">
                <li>Language and region settings</li>
                <li>Dashboard customizations</li>
                <li>Notification preferences</li>
              </ul>
              <p className="text-sm text-gray-600 mt-2"><em>You can manage these in your account settings.</em></p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Your GDPR Rights</h2>
            <p className="text-gray-700 mb-4">Under GDPR, you have the following rights:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li><strong>Right to Access:</strong> Request copies of your personal data</li>
              <li><strong>Right to Rectification:</strong> Correct inaccurate personal data</li>
              <li><strong>Right to Erasure:</strong> Request deletion of your personal data</li>
              <li><strong>Right to Restrict Processing:</strong> Limit how we use your data</li>
              <li><strong>Right to Data Portability:</strong> Transfer your data to another service</li>
              <li><strong>Right to Object:</strong> Object to our processing of your data</li>
            </ul>
            <p className="text-gray-700 mb-4">
              To exercise these rights, contact us at <strong>privacy@qrsafetyapp.com</strong>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Data Security</h2>
            <p className="text-gray-700 mb-4">We implement appropriate security measures including:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Encryption of data in transit and at rest</li>
              <li>Regular security audits and monitoring</li>
              <li>Access controls and authentication</li>
              <li>Secure data centers and backup systems</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Data Retention</h2>
            <p className="text-gray-700 mb-4">
              We retain your data only as long as necessary for the purposes outlined in this policy or as required by law. 
              When you cancel your account, we will delete your personal data within 30 days, except where retention is required for legal compliance.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Third-Party Services</h2>
            <p className="text-gray-700 mb-4">We may use third-party services for:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Payment processing (Stripe)</li>
              <li>Email communications</li>
              <li>Analytics and monitoring</li>
              <li>Cloud hosting and storage</li>
            </ul>
            <p className="text-gray-700 mb-4">
              These services have their own privacy policies and are bound by data processing agreements.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. International Data Transfers</h2>
            <p className="text-gray-700 mb-4">
              Your data may be transferred to and processed in countries other than your own. 
              We ensure appropriate safeguards are in place for international transfers in compliance with GDPR.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Changes to This Policy</h2>
            <p className="text-gray-700 mb-4">
              We may update this Privacy Policy from time to time. We will notify you of significant changes via email or through the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Contact Us</h2>
            <p className="text-gray-700 mb-4">
              For questions about this Privacy Policy or to exercise your rights, contact us:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700">
                <strong>Data Protection Officer:</strong> privacy@qrsafetyapp.com<br />
                <strong>General Contact:</strong> support@qrsafetyapp.com<br />
                <strong>Address:</strong> QRsafetyapp.com Privacy Department<br />
                539 W Commerce- Suite 6144<br />
                Dallas, TX 75208<br />
                <strong>EU Representative:</strong> Available upon request for EU residents
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPage;
