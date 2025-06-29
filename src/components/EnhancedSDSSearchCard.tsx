
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Search, Zap, Shield, Clock } from "lucide-react";

interface EnhancedSDSSearchCardProps {
  children: React.ReactNode;
}

const EnhancedSDSSearchCard = ({ children }: EnhancedSDSSearchCardProps) => {
  return (
    <div className="relative">
      {/* Glowing Border Animation */}
      <div className="absolute -inset-1 bg-gradient-to-r from-orange-400 via-red-500 to-orange-400 rounded-3xl blur opacity-75 animate-pulse"></div>
      
      <Card className="relative w-full border-4 border-orange-400 bg-gradient-to-br from-orange-50 via-yellow-50 to-red-50 shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-[1.02]">
        <CardHeader className="pb-6 text-center bg-gradient-to-r from-orange-100 to-red-100 rounded-t-2xl">
          <div className="flex justify-center mb-6">
            <div className="relative">
              {/* Multiple animated rings */}
              <div className="absolute inset-0 bg-orange-500 rounded-full animate-ping opacity-30"></div>
              <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20 animation-delay-150"></div>
              <div className="relative bg-gradient-to-r from-orange-500 to-red-500 p-6 rounded-full shadow-xl">
                <FileText className="w-10 h-10 text-white" />
              </div>
            </div>
          </div>
          
          <CardTitle className="flex items-center justify-center gap-4 text-3xl md:text-4xl font-black text-gray-900 mb-4">
            <Search className="w-8 h-8 text-orange-600" />
            SAFETY DATA SHEET SEARCH
            <Search className="w-8 h-8 text-orange-600" />
          </CardTitle>
          
          <p className="text-gray-700 text-xl md:text-2xl font-semibold leading-relaxed">
            The <span className="text-orange-600 font-black">FASTEST</span> and <span className="text-red-600 font-black">SAFEST</span> way to find, process, and label your chemicals
          </p>
        </CardHeader>
        
        <CardContent className="space-y-8 p-8">
          {children}
          
          {/* Enhanced Feature highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 pt-8 border-t-4 border-orange-200">
            <div className="text-center bg-yellow-50 p-6 rounded-xl border-2 border-yellow-300 transform hover:scale-105 transition-all">
              <div className="flex justify-center mb-3">
                <div className="bg-yellow-500 p-3 rounded-full">
                  <Zap className="w-6 h-6 text-white" />
                </div>
              </div>
              <h4 className="font-black text-gray-900 text-lg">INSTANT PROCESSING</h4>
              <p className="text-sm text-gray-700 font-semibold">AI-powered extraction in seconds</p>
            </div>
            
            <div className="text-center bg-green-50 p-6 rounded-xl border-2 border-green-300 transform hover:scale-105 transition-all">
              <div className="flex justify-center mb-3">
                <div className="bg-green-500 p-3 rounded-full">
                  <Shield className="w-6 h-6 text-white" />
                </div>
              </div>
              <h4 className="font-black text-gray-900 text-lg">OSHA COMPLIANT</h4>
              <p className="text-sm text-gray-700 font-semibold">Meets all safety standards</p>
            </div>
            
            <div className="text-center bg-blue-50 p-6 rounded-xl border-2 border-blue-300 transform hover:scale-105 transition-all">
              <div className="flex justify-center mb-3">
                <div className="bg-blue-500 p-3 rounded-full">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
              <h4 className="font-black text-gray-900 text-lg">SAVE HOURS</h4>
              <p className="text-sm text-gray-700 font-semibold">No more manual label creation</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedSDSSearchCard;
