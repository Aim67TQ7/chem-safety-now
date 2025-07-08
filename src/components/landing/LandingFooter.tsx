const LandingFooter = () => {
  return (
    <footer className="bg-black/50 backdrop-blur-sm text-white py-12 relative z-10 border-t border-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8">
              <img 
                src="/lovable-uploads/18c1efed-2e96-48a0-a62a-d5887c53ac30.png" 
                alt="QRsafetyapp.com Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-xl font-bold">QRsafetyapp.com</span>
          </div>
          <div className="flex items-center space-x-6">
            <a 
              href="/sales-partner" 
              className="text-gray-300 hover:text-white transition-colors text-sm"
            >
              Sales Partner Program
            </a>
            <p className="text-gray-300">
              © 2025 QRsafetyapp.com. OSHA Compliant Chemical Safety Solutions.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;