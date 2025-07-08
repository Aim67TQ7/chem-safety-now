import React from 'react';
import { useNavigate } from 'react-router-dom';

const GlobalHeader = () => {
  const navigate = useNavigate();

  const handleLogoClick = () => {
    navigate('/');
  };

  return (
    <header className="bg-background border-b border-border relative z-50 sticky top-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div 
          className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={handleLogoClick}
        >
          <img 
            src="/lovable-uploads/18c1efed-2e96-48a0-a62a-d5887c53ac30.png" 
            alt="QRSafetyApp Logo" 
            className="h-10 w-10 object-contain"
          />
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-foreground">QRSafetyApp</h1>
            <p className="text-sm text-muted-foreground">Digital Safety Management</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default GlobalHeader;