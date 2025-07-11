
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { UserCheck, HandshakeIcon, TrendingUp, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import SalesPartnerSuccessPopup from "@/components/popups/SalesPartnerSuccessPopup";

const SalesPartnerPage = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    email: '',
    phone: '',
    businessDescription: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.companyName.trim()) {
      toast({
        title: "Validation Error",
        description: "Company name is required",
        variant: "destructive"
      });
      return false;
    }
    
    if (!formData.contactName.trim()) {
      toast({
        title: "Validation Error", 
        description: "Contact name is required",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.email.trim()) {
      toast({
        title: "Validation Error",
        description: "Email address is required", 
        variant: "destructive"
      });
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.businessDescription.trim()) {
      toast({
        title: "Validation Error",
        description: "Business description is required",
        variant: "destructive"
      });
      return false;
    }

    if (formData.businessDescription.trim().length < 20) {
      toast({
        title: "Validation Error", 
        description: "Please provide a more detailed business description (minimum 20 characters)",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('sales_partner_applications')
        .insert([
          {
            company_name: formData.companyName.trim(),
            contact_name: formData.contactName.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim() || null,
            business_description: formData.businessDescription.trim()
          }
        ]);

      if (error) {
        throw error;
      }

      // Reset form
      setFormData({
        companyName: '',
        contactName: '',
        email: '',
        phone: '',
        businessDescription: ''
      });

      // Show success popup
      setShowSuccessPopup(true);

    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        title: "Submission Error",
        description: "Failed to submit application. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-red-50">
      <div className="container mx-auto p-6">
        <div className="text-center mb-8">
          <HandshakeIcon className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Sales Partner Program</h1>
          <p className="text-gray-600">Join our partner network and grow your business with QRSafetyApp</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Partner Benefits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                <li>• Competitive commission structure</li>
                <li>• Dedicated partner support</li>
                <li>• Marketing materials and resources</li>
                <li>• Training and certification programs</li>
                <li>• Co-marketing opportunities</li>
                <li>• Priority technical support</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="w-5 h-5" />
                Apply Now
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input 
                    id="companyName"
                    placeholder="Company Name" 
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contactName">Contact Name *</Label>
                  <Input 
                    id="contactName"
                    placeholder="Contact Name" 
                    value={formData.contactName}
                    onChange={(e) => handleInputChange('contactName', e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input 
                    id="email"
                    placeholder="Email Address" 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone"
                    placeholder="Phone Number" 
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="businessDescription">Business Description *</Label>
                  <Textarea 
                    id="businessDescription"
                    placeholder="Tell us about your business and why you'd like to partner with us (minimum 20 characters)" 
                    value={formData.businessDescription}
                    onChange={(e) => handleInputChange('businessDescription', e.target.value)}
                    disabled={isLoading}
                    rows={4}
                  />
                </div>
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <SalesPartnerSuccessPopup 
        isOpen={showSuccessPopup}
        onClose={() => setShowSuccessPopup(false)}
      />
    </div>
  );
};

export default SalesPartnerPage;
