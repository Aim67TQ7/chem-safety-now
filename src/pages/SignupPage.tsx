
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Shield, Upload, CreditCard, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
      
      // Store facility data (in real app, this would be database)
      const facilityData = {
        ...formData,
        slug: facilitySlug,
        createdAt: new Date().toISOString(),
        subscription: {
          status: 'active',
          expiresAt: new Date(Date.now() + 18 * 30 * 24 * 60 * 60 * 1000).toISOString() // 18 months
        }
      };
      
      localStorage.setItem(`facility_${facilitySlug}`, JSON.stringify(facilityData));
      
      toast({
        title: "Welcome to CHEMLABEL-GPT!",
        description: "Your facility has been set up successfully.",
      });
      
      // Redirect to facility page
      navigate(`/facility/${facilitySlug}?setup=true`);
      
    } catch (error) {
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
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">CHEMLABEL-GPT</h1>
                <p className="text-sm text-gray-600">AI-Powered Chemical Safety</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
              Setup in Progress
            </Badge>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Set Up Your Facility
          </h1>
          <p className="text-lg text-gray-600">
            Get your chemical safety platform ready in minutes
          </p>
        </div>

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
    </div>
  );
};

export default SignupPage;
