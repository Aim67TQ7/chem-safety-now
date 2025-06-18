
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
  const [isUploading, setIsUploading] = useState(false);
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

    console.log('Starting logo upload process...', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      facilityId: facilityData.id
    });

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.error('Invalid file type:', file.type);
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      console.error('File too large:', file.size);
      toast.error("File size must be less than 2MB");
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${facilityData.id}-${Date.now()}.${fileExt}`;
      const filePath = `facility-logos/${fileName}`;

      console.log('Uploading to Supabase Storage...', {
        filePath,
        bucketName: 'facility-logos'
      });

      // First, try to remove the old logo if it exists
      if (formData.logo_url) {
        try {
          const oldPath = formData.logo_url.split('/').pop();
          if (oldPath) {
            const { error: deleteError } = await supabase.storage
              .from('facility-logos')
              .remove([oldPath]);
            
            if (deleteError) {
              console.warn('Could not delete old logo:', deleteError);
            } else {
              console.log('Old logo deleted successfully');
            }
          }
        } catch (deleteErr) {
          console.warn('Error deleting old logo:', deleteErr);
        }
      }

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('facility-logos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error details:', uploadError);
        toast.error(`Failed to upload logo: ${uploadError.message}`);
        return;
      }

      console.log('Upload successful:', uploadData);

      const { data: urlData } = supabase.storage
        .from('facility-logos')
        .getPublicUrl(filePath);

      console.log('Generated public URL:', urlData.publicUrl);

      setFormData(prev => ({
        ...prev,
        logo_url: urlData.publicUrl
      }));

      toast.success("Logo uploaded successfully! Don't forget to save your changes.");
    } catch (error) {
      console.error('Unexpected error during upload:', error);
      toast.error(`Failed to upload logo: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
      // Reset the file input
      event.target.value = '';
    }
  };

  const handleSave = async () => {
    console.log('Starting save process...', {
      facilityId: facilityData.id,
      formData,
      hasChanges
    });

    if (!formData.facility_name || !formData.contact_name || !formData.email) {
      toast.error("Please fill in all required fields (marked with *)");
      return;
    }

    setIsLoading(true);
    try {
      const updateData = {
        facility_name: formData.facility_name,
        contact_name: formData.contact_name,
        email: formData.email,
        address: formData.address,
        logo_url: formData.logo_url,
        updated_at: new Date().toISOString()
      };

      console.log('Updating facility with data:', updateData);

      const { data, error } = await supabase
        .from('facilities')
        .update(updateData)
        .eq('id', facilityData.id)
        .select()
        .single();

      if (error) {
        console.error('Database update error:', error);
        toast.error(`Failed to update facility: ${error.message}`);
        return;
      }

      console.log('Update successful:', data);
      onFacilityUpdate(data);
      toast.success("Facility information updated successfully!");
    } catch (error) {
      console.error('Unexpected error during save:', error);
      toast.error(`Failed to save changes: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
                  <Button 
                    variant="outline" 
                    className="cursor-pointer" 
                    disabled={isUploading || isLoading}
                    type="button"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {isUploading ? "Uploading..." : "Upload New Logo"}
                  </Button>
                </Label>
                <Input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  disabled={isUploading || isLoading}
                />
                <p className="text-xs text-gray-500">
                  Recommended: Square image, max 2MB (JPG, PNG)
                </p>
                {formData.logo_url && (
                  <p className="text-xs text-green-600">
                    Logo ready - remember to save changes
                  </p>
                )}
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
                disabled={isLoading}
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
                disabled={isLoading}
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
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Facility Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Enter facility address"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-between items-center pt-4 border-t">
            {hasChanges && (
              <p className="text-sm text-orange-600">
                You have unsaved changes
              </p>
            )}
            <div className="ml-auto">
              <Button 
                onClick={handleSave}
                disabled={!hasChanges || isLoading || isUploading}
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FacilitySettings;
