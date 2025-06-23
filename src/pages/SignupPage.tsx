import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Shield, Upload, CheckCircle, Bot, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SetupFailureDialog } from "@/components/SetupFailureDialog";
import GlobalSafetyStanWidget from "@/components/GlobalSafetyStanWidget";

const SignupPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    email: searchParams.get('email') || '',
    facilityName: '',
    contactName: '',
    address: '',
    salesPerson: '',
    logo: null as File | null
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);

  // List of sales people - starting with Rob C as requested
  const salesPeople = [
    { value: "rob-c", label: "Rob C" },
    // Additional sales people can be added here
  ];

  const handleFormDataUpdate = (field: string, value: string) => {
    console.log('Stan is updating form field:', field, value);
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Show feedback to user
    toast({
      title: "Form Updated",
      description: `${field.charAt(0).toUpperCase() + field.slice(1)} has been filled in by Stan!`,
    });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, logo: file });
    }
  };

  const generateSlug = (name: string) => {
    const baseSlug = name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    
    // Add timestamp and random string for better uniqueness
    const timestamp = Date.now().toString().slice(-6);
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    
    return `${baseSlug}-${timestamp}-${randomSuffix}`;
  };

  const uploadLogo = async (file: File, facilitySlug: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${facilitySlug}-logo.${fileExt}`;
    const filePath = `${fileName}`;

    const { data, error } = await supabase.storage
      .from('facility-logos')
      .upload(filePath, file);

    if (error) {
      console.error('Error uploading logo:', error);
      throw new Error('Failed to upload logo');
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('facility-logos')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setSetupError(null);

    try {
      // Simulate setup processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const facilitySlug = generateSlug(formData.facilityName);
      
      // Upload logo if provided
      let logoUrl = null;
      if (formData.logo) {
        logoUrl = await uploadLogo(formData.logo, facilitySlug);
      }
      
      // Save facility data to Supabase with updated column names
      const { data: facility, error } = await supabase
        .from('facilities')
        .insert({
          slug: facilitySlug,
          facility_name: formData.facilityName,
          contact_name: formData.contactName,
          email: formData.email,
          address: formData.address,
          logo_url: logoUrl,
          // Note: sales_person field would need to be added to the facilities table
          // For now, we'll store it in a metadata field or handle separately
        })
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        
        // Handle specific constraint violations with user-friendly messages
        if (error.code === '23505') {
          if (error.message.includes('slug')) {
            throw new Error('A facility with a similar name already exists. Please try a different facility name.');
          } else if (error.message.includes('email')) {
            throw new Error('This email address is already registered. Please use a different email or contact support.');
          } else {
            throw new Error('This facility information conflicts with an existing registration. Please try different details.');
          }
        } else if (error.code === '23514') {
          throw new Error('Invalid facility name format. Please use only letters, numbers, and spaces.');
        } else {
          throw new Error(`Failed to create facility: ${error.message}`);
        }
      }
      
      toast({
        title: "Welcome to ChemLabel-GPT!",
        description: "Your facility has been set up successfully.",
      });
      
      // Redirect to facility page with setup mode
      navigate(`/facility/${facilitySlug}?setup=true`);
      
    } catch (error) {
      console.error('Setup error:', error);
      setSetupError(error instanceof Error ? error.message : 'Unknown error occurred');
      setShowErrorDialog(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetrySetup = () => {
    setShowErrorDialog(false);
    setSetupError(null);
    // Retry the form submission
    handleSubmit(new Event('submit') as any);
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
                  src="/lovable-uploads/7cb0a20-15f0-43f7-9877-126cab0c631c.png" 
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Set Up Your Facility
          </h1>
          <p className="text-lg text-gray-600">
            Get your chemical safety platform ready in minutes
          </p>
        </div>

        {/* Main Signup Form */}
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

              <div>
                <Label htmlFor="salesPerson">Select Sales Representative *</Label>
                <Select value={formData.salesPerson} onValueChange={(value) => setFormData({ ...formData, salesPerson: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Choose your sales representative..." />
                  </SelectTrigger>
                  <SelectContent>
                    {salesPeople.map((person) => (
                      <SelectItem key={person.value} value={person.value}>
                        {person.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isProcessing || !formData.email || !formData.facilityName || !formData.contactName || !formData.address || !formData.salesPerson}
              className="w-full bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-700 hover:to-blue-700 text-white py-4 text-lg font-semibold"
            >
              {isProcessing ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Setting up facility...
                </div>
              ) : (
                "Complete Facility Setup"
              )}
            </Button>

            <p className="text-xs text-gray-500 text-center">
              By completing setup, you agree to our{" "}
              <a 
                href="/terms" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Terms of Service
              </a>
              {" "}and{" "}
              <a 
                href="/privacy" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Privacy Policy
              </a>
              .
            </p>
          </form>
        </Card>
      </div>

      {/* Stan Widget */}
      <GlobalSafetyStanWidget 
        onFormDataUpdate={handleFormDataUpdate}
        formData={formData}
      />

      {/* Setup Failure Dialog */}
      <SetupFailureDialog
        isOpen={showErrorDialog}
        onClose={() => setShowErrorDialog(false)}
        onRetry={handleRetrySetup}
        error={setupError || undefined}
      />
    </div>
  );
};

export default SignupPage;
