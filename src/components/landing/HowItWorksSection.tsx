
const HowItWorksSection = () => {
  return (
    <section className="py-20 relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center text-white mb-16">
          From Hours of Filing to Seconds of Access
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl font-bold text-white">1</span>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-white">Scan & Access Instantly</h3>
            <p className="text-gray-200">
              Workers scan QR codes with their phones — instantly access safety information instead of searching through filing systems for 10+ minutes.
            </p>
          </div>

          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl font-bold text-white">2</span>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-white">Report Digitally</h3>
            <p className="text-gray-200">
              Submit incident reports and access procedures digitally — eliminate paper forms and speed up response times from hours to minutes.
            </p>
          </div>

          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl font-bold text-white">3</span>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-white">Auto-Track Compliance</h3>
            <p className="text-gray-200">
              All activity auto-logs for compliance — eliminate manual documentation and be audit-ready without hours of preparation.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
