
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Search, Zap, Shield, Clock } from "lucide-react";

interface EnhancedSDSSearchCardProps {
  children: React.ReactNode;
}

const EnhancedSDSSearchCard = ({ children }: EnhancedSDSSearchCardProps) => {
  return (
    <Card className="w-full border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-xl hover:shadow-2xl transition-all duration-300">
      <CardHeader className="pb-4 text-center">
        <div className="flex justify-center mb-4">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-20"></div>
            <div className="relative bg-blue-500 p-4 rounded-full">
              <FileText className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
        <CardTitle className="flex items-center justify-center gap-3 text-2xl font-bold text-gray-900">
          <Search className="w-6 h-6 text-blue-600" />
          Safety Data Sheet Search
        </CardTitle>
        <p className="text-gray-600 mt-2 text-lg">
          The fastest way to find, process, and label your chemicals safely
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {children}
        
        {/* Feature highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-blue-200">
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <Zap className="w-5 h-5 text-yellow-500" />
            </div>
            <h4 className="font-semibold text-gray-900">Instant Processing</h4>
            <p className="text-sm text-gray-600">AI-powered extraction in seconds</p>
          </div>
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <Shield className="w-5 h-5 text-green-500" />
            </div>
            <h4 className="font-semibold text-gray-900">OSHA Compliant</h4>
            <p className="text-sm text-gray-600">Meets all safety standards</p>
          </div>
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <Clock className="w-5 h-5 text-blue-500" />
            </div>
            <h4 className="font-semibold text-gray-900">Save Hours</h4>
            <p className="text-sm text-gray-600">No more manual label creation</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedSDSSearchCard;
