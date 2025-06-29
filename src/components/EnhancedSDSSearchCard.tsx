
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Search } from "lucide-react";

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
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedSDSSearchCard;
