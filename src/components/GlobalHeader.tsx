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
          className="cursor-pointer hover:opacity-80 transition-opacity"
          onClick={handleLogoClick}
        >
          {/* Logo removed for white-label flexibility */}
        </div>
      </div>
    </header>
  );
};

export default GlobalHeader;