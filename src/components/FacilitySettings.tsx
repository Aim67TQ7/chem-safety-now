
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Settings, Upload, Save, Building2 } from "lucide-react";

interface FacilityData {
  id: string;
  slug: string;
  facility_name: string | null;
  contact_name: string | null;
  email: string | null;
  address: string | null;
  logo_url?: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
}

interface FacilitySettingsProps {
  facilityData: FacilityData;
  onFacilityUpdate: (updatedData: FacilityData) => void;
}

const FacilitySettings = ({ facilityData, onFacilityUpdate }: FacilitySettingsProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    facility_name: facilityData.facility_name || "",
    contact_name: facilityData.contact_name || "",
    email: facilityData.email || "",
    address: facilityData.address || "",
    logo_url: facilityData.logo_url || ""
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be less than 2MB");
      return;
    }

    setIsLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${facilityData.id}-${Date.now()}.${fileExt}`;
      const filePath = `facility-logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('facility-logos')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.error("Failed to upload logo");
        return;
      }

      const { data: urlData } = supabase.storage
        .from('facility-logos')
        .getPublicUrl(filePath);

      setFormData(prev => ({
        ...prev,
        logo_url: urlData.publicUrl
      }));

      toast.success("Logo uploaded successfully");
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error("Failed to upload logo");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('facilities')
        .update({
          facility_name: formData.facility_name,
          contact_name: formData.contact_name,
          email: formData.email,
          address: formData.address,
          logo_url: formData.logo_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', facilityData.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating facility:', error);
        toast.error("Failed to update facility information");
        return;
      }

      onFacilityUpdate(data);
      toast.success("Facility information updated successfully");
    } catch (error) {
      console.error('Error saving facility data:', error);
      toast.error("Failed to save changes");
    } finally {
      setIsLoading(false);
    }
  };

  const hasChanges = 
    formData.facility_name !== (facilityData.facility_name || "") ||
    formData.contact_name !== (facilityData.contact_name || "") ||
    formData.email !== (facilityData.email || "") ||
    formData.address !== (facilityData.address || "") ||
    formData.logo_url !== (facilityData.logo_url || "");

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <Settings className="w-6 h-6 text-gray-600" />
        <h2 className="text-2xl font-bold text-gray-900">Facility Settings</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="w-5 h-5" />
            <span>Facility Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo Section */}
          <div className="space-y-4">
            <Label>Facility Logo</Label>
            <div className="flex items-center space-x-4">
              <Avatar className="w-20 h-20">
                <AvatarImage 
                  src={formData.logo_url} 
                  alt={formData.facility_name || "Facility Logo"} 
                />
                <AvatarFallback className="text-lg font-semibold bg-blue-100 text-blue-600">
                  {formData.facility_name?.charAt(0)?.toUpperCase() || "F"}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <Label htmlFor="logo-upload" className="cursor-pointer">
                  <Button variant="outline" className="cursor-pointer" disabled={isLoading}>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload New Logo
                  </Button>
                </Label>
                <Input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <p className="text-xs text-gray-500">
                  Recommended: Square image, max 2MB (JPG, PNG)
                </p>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="facility_name">Facility Name *</Label>
              <Input
                id="facility_name"
                value={formData.facility_name}
                onChange={(e) => handleInputChange('facility_name', e.target.value)}
                placeholder="Enter facility name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_name">Contact Person *</Label>
              <Input
                id="contact_name"
                value={formData.contact_name}
                onChange={(e) => handleInputChange('contact_name', e.target.value)}
                placeholder="Enter contact person name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter email address"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Facility Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Enter facility address"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t">
            <Button 
              onClick={handleSave}
              disabled={!hasChanges || isLoading}
              className="min-w-24"
            >
              {isLoading ? (
                "Saving..."
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FacilitySettings;
