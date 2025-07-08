import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, UserPlus, Clock, FileText, Smartphone, QrCode } from "lucide-react";
import { useNavigate } from "react-router-dom";
import QRCodeLib from 'qrcode';

const HeroSection = () => {
  const navigate = useNavigate();
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  
  const demoUrl = `https://qrsafetyapp.com/facility/demo`;

  useEffect(() => {
    generateQRCode();
  }, []);

  const generateQRCode = async () => {
    try {
      const dataUrl = await QRCodeLib.toDataURL(demoUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'H'
      });
      setQrCodeDataUrl(dataUrl);
    } catch (error) {
      console.error('QR Code generation failed:', error);
    }
  };

  const handleGetStarted = () => {
    navigate("/signup");
  };

  const handleDemoClick = () => {
    window.open(demoUrl, '_blank');
  };

  return (
    <section className="relative flex-1 flex items-center justify-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16 overflow-hidden">
      {/* Subtle Hero Background */}
      <div 
        className="absolute inset-0 opacity-[0.08] blur-2xl"
        style={{
          backgroundImage: 'url("/lovable-uploads/6e64701e-e92f-46b9-a9d7-53670d1b19b3.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      
      <div className="w-full max-w-4xl relative z-10">
        {/* Hero Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            Update your entire safety program in minutes, not months with one simple scan
          </h1>
          
          {/* Killer Statement */}
          <div className="bg-gradient-to-r from-primary/10 to-blue-600/10 border border-primary/20 rounded-lg p-6 mb-8 max-w-2xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-primary mb-2">
              See it in action — Try our live demo instantly
            </h2>
            <p className="text-muted-foreground">
              Scan the QR code with your phone camera to explore the full platform
            </p>
          </div>
          
          {/* Mobile First Badge */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              <Smartphone className="w-4 h-4 mr-2" />
              Mobile Optimized Demo
            </Badge>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>No app download required</span>
            </div>
          </div>
        </div>

        {/* QR Code Demo Section */}
        <div className="mb-8 relative">
          <div className="relative">
            {/* Glowing background for the QR area */}
            <div className="absolute -inset-6 bg-gradient-to-r from-blue-400 to-purple-400 rounded-3xl blur opacity-20 animate-pulse"></div>
            
            <div className="relative bg-gradient-to-r from-blue-50 to-purple-50 rounded-3xl border-4 border-blue-400 shadow-2xl p-8">
              <div className="text-center space-y-6">
                {/* QR Code */}
                <div className="flex justify-center">
                  {qrCodeDataUrl ? (
                    <div className="bg-white p-4 rounded-2xl shadow-xl border border-gray-200">
                      <img 
                        src={qrCodeDataUrl} 
                        alt="Demo QR Code"
                        className="w-64 h-64 mx-auto"
                      />
                    </div>
                  ) : (
                    <div className="w-64 h-64 bg-gray-100 border-2 border-dashed border-gray-300 rounded-2xl flex items-center justify-center">
                      <QrCode className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Mobile Instructions */}
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold text-primary">
                    📱 Point your phone camera at this code
                  </h3>
                  <p className="text-lg text-muted-foreground max-w-md mx-auto">
                    Experience our complete safety management platform instantly. No downloads, no signup required for the demo.
                  </p>
                </div>

                {/* Desktop Fallback */}
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-muted-foreground mb-3">
                    On desktop? Click here to open the demo:
                  </p>
                  <Button 
                    onClick={handleDemoClick}
                    variant="outline"
                    size="lg"
                    className="bg-white hover:bg-gray-50"
                  >
                    <QrCode className="w-5 h-5 mr-2" />
                    Open Live Demo
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground mt-4 text-center">
            Explore SDS search, incident reporting, and safety tools in our interactive demo
          </p>
        </div>

        {/* Value Props */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <div className="text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Smartphone className="w-6 h-6 text-primary" />
            </div>
            <h4 className="font-semibold mb-2">Mobile First</h4>
            <p className="text-sm text-muted-foreground">
              Access safety information instantly from any smartphone
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <h4 className="font-semibold mb-2">OSHA Compliant</h4>
            <p className="text-sm text-muted-foreground">
              Generate compliant chemical labels automatically
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6 text-primary" />
            </div>
            <h4 className="font-semibold mb-2">White-label Branding</h4>
            <p className="text-sm text-muted-foreground">
              Customize with your company's branding and logo
            </p>
          </div>
        </div>
        
        {/* Primary CTA */}
        <div className="text-center mt-12">
          <Button 
            onClick={handleGetStarted}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 py-6 text-xl font-bold"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            Create Your Own Site
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            Set up takes 2 minutes • No credit card required
          </p>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;