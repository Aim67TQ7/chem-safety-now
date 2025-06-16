
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Shield, Upload, CreditCard, CheckCircle, Bot, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const SignupPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    email: searchParams.get('email') || '',
    facilityName: '',
    contactName: '',
    address: '',
    logo: null as File | null
  });
  
  const [isProcessing, setIsProcessing] = useState(false);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, logo: file });
    }
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      + '-' + Math.random().toString(36).substring(2, 8);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const facilitySlug = generateSlug(formData.facilityName);
      
      // Save facility data to Supabase
      const { data: facility, error } = await supabase
        .from('facilities')
        .insert({
          slug: facilitySlug,
          facility_name: formData.facilityName,
          contact_name: formData.contactName,
          email: formData.email,
          address: formData.address,
          subscription_status: 'active',
          subscription_expires_at: new Date(Date.now() + 18 * 30 * 24 * 60 * 60 * 1000).toISOString() // 18 months
        })
        .select()
        .single();

      if (error) {
        throw new Error('Failed to create facility: ' + error.message);
      }
      
      toast({
        title: "Welcome to ChemLabel-GPT!",
        description: "Your facility has been set up successfully.",
      });
      
      // Redirect to facility page
      navigate(`/facility/${facilitySlug}?setup=true`);
      
    } catch (error) {
      console.error('Signup error:', error);
      toast({
        title: "Setup Failed",
        description: "Please try again or contact support.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-red-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-10 h-10">
                <img 
                  src="/lovable-uploads/7cbd0a20-15f0-43f7-9877-126cab0c631c.png" 
                  alt="ChemLabel-GPT Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">ChemLabel-GPT</h1>
                <p className="text-sm text-gray-600">AI-Powered Chemical Safety</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
              Setup in Progress
            </Badge>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Set Up Your Facility
          </h1>
          <p className="text-lg text-gray-600">
            Get your chemical safety platform ready in minutes
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Signup Form */}
          <div className="lg:col-span-2">
            <Card className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    Contact Information
                  </h3>
                  
                  <div>
                    <Label htmlFor="email">Work Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="contactName">Contact Person Full Name *</Label>
                    <Input
                      id="contactName"
                      type="text"
                      value={formData.contactName}
                      onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                      required
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Facility Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    Facility Details
                  </h3>
                  
                  <div>
                    <Label htmlFor="facilityName">Facility/Company Name *</Label>
                    <Input
                      id="facilityName"
                      type="text"
                      value={formData.facilityName}
                      onChange={(e) => setFormData({ ...formData, facilityName: e.target.value })}
                      required
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="address">Facility Address *</Label>
                    <Input
                      id="address"
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      required
                      className="mt-1"
                      placeholder="123 Industrial Blvd, City, State 12345"
                    />
                  </div>

                  <div>
                    <Label htmlFor="logo">Company Logo (Optional)</Label>
                    <div className="mt-1">
                      <div className="flex items-center space-x-4">
                        <Button
                          type="button"
                          variant="outline"
                          className="relative overflow-hidden"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Logo
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                        </Button>
                        {formData.logo && (
                          <span className="text-sm text-green-600">
                            ✓ {formData.logo.name}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        PNG or JPG format recommended. Will be displayed on QR codes and facility site.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Payment Summary */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
                    <CreditCard className="w-5 h-5 text-blue-600 mr-2" />
                    Payment Summary
                  </h3>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Facility License (18 months)</span>
                      <span className="font-semibold">$500.00</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Includes unlimited worker access</span>
                      <span>$0.00</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Custom branding & QR codes</span>
                      <span>$0.00</span>
                    </div>
                    <div className="border-t border-blue-200 pt-2 flex justify-between font-bold">
                      <span>Total</span>
                      <span>$500.00</span>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isProcessing || !formData.email || !formData.facilityName || !formData.contactName || !formData.address}
                  className="w-full bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-700 hover:to-blue-700 text-white py-4 text-lg font-semibold"
                >
                  {isProcessing ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processing Payment...
                    </div>
                  ) : (
                    "Complete Setup & Pay $500"
                  )}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  By completing setup, you agree to our Terms of Service and Privacy Policy.
                  Your 18-month license begins immediately upon payment.
                </p>
              </form>
            </Card>
          </div>

          {/* Custom GPT Advertisement Card */}
          <div className="lg:col-span-1">
            <Card className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto">
                  <Bot className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-xl font-bold text-gray-900">
                  Free Custom GPT Integration
                </h3>
                
                <p className="text-sm text-gray-600">
                  We can include this chemical safety app for free in a custom GPT that learns your company's specific data and processes.
                </p>
                
                <div className="space-y-3 text-sm text-gray-700">
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Custom RAG system with your company data</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Integration with your existing business apps</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Dedicated AI assistant for your business needs</span>
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
                  onClick={() => window.open('mailto:support@nov8v.ai?subject=Custom GPT Integration Inquiry', '_blank')}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Contact support@nov8v.ai
                </Button>
                
                <p className="text-xs text-gray-500">
                  Free with any ChemLabel-GPT subscription
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
