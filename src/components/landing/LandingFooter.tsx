
const LandingFooter = () => {
  return (
    <footer className="bg-black/50 backdrop-blur-sm text-white py-12 relative z-10 border-t border-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8">
              <img 
                src="/lovable-uploads/7cbd0a20-15f0-43f7-9877-126cab0c631c.png" 
                alt="ChemLabel-GPT Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-xl font-bold">ChemLabel-GPT</span>
          </div>
          <div className="flex items-center space-x-6">
            <a 
              href="/sales-partner" 
              className="text-gray-300 hover:text-white transition-colors text-sm"
            >
              Sales Partner Program
            </a>
            <p className="text-gray-300">
              © 2025 ChemLabel-GPT. OSHA Compliant Chemical Safety Solutions.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
