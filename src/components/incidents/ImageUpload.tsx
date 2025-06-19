
import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, Upload, X, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  uploaded?: boolean;
  url?: string;
}

interface ImageUploadProps {
  onImagesChange: (images: UploadedImage[]) => void;
  maxImages?: number;
  disabled?: boolean;
}

// Create a ref type for the component
export type ImageUploadRef = {
  uploadImages: () => Promise<string[]>;
};

const ImageUpload = forwardRef<ImageUploadRef, ImageUploadProps>(({ 
  onImagesChange, 
  maxImages = 4, 
  disabled = false 
}, ref) => {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const generateUniqueFileName = (file: File) => {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substr(2, 9);
    const extension = file.name.split('.').pop();
    return `incident_${timestamp}_${randomId}.${extension}`;
  };

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        const maxWidth = 1920;
        const maxHeight = 1080;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        }, 'image/jpeg', 0.8);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (files: FileList) => {
    if (disabled) return;
    
    const remainingSlots = maxImages - images.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);
    
    const newImages: UploadedImage[] = [];
    
    for (const file of filesToProcess) {
      if (file.type.startsWith('image/')) {
        const compressedFile = await compressImage(file);
        const preview = URL.createObjectURL(compressedFile);
        
        newImages.push({
          id: Math.random().toString(36).substr(2, 9),
          file: compressedFile,
          preview,
          uploaded: false,
        });
      }
    }
    
    const updatedImages = [...images, ...newImages];
    setImages(updatedImages);
    onImagesChange(updatedImages);
  };

  const removeImage = (id: string) => {
    if (disabled) return;
    
    const updatedImages = images.filter(img => {
      if (img.id === id) {
        URL.revokeObjectURL(img.preview);
        return false;
      }
      return true;
    });
    
    setImages(updatedImages);
    onImagesChange(updatedImages);
  };

  const uploadImages = async (): Promise<string[]> => {
    if (images.length === 0) return [];
    
    setUploading(true);
    const uploadedUrls: string[] = [];
    
    try {
      for (const image of images) {
        if (!image.uploaded) {
          const fileName = generateUniqueFileName(image.file);
          
          const { data, error } = await supabase.storage
            .from('incident-images')
            .upload(fileName, image.file, {
              cacheControl: '3600',
              upsert: false
            });
          
          if (error) {
            console.error('Error uploading image:', error);
            continue;
          }
          
          const { data: { publicUrl } } = supabase.storage
            .from('incident-images')
            .getPublicUrl(fileName);
          
          uploadedUrls.push(publicUrl);
          image.uploaded = true;
          image.url = publicUrl;
        } else if (image.url) {
          uploadedUrls.push(image.url);
        }
      }
    } catch (error) {
      console.error('Error during image upload:', error);
    } finally {
      setUploading(false);
    }
    
    return uploadedUrls;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Expose uploadImages method to parent component
  useImperativeHandle(ref, () => ({
    uploadImages
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <ImageIcon className="w-5 h-5 text-gray-600" />
        <label className="text-sm font-medium text-gray-900">
          Attach Photos (Optional - Up to {maxImages} images)
        </label>
      </div>
      
      {/* Upload Area */}
      {images.length < maxImages && !disabled && (
        <Card 
          className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <CardContent className="py-8">
            <div className="text-center space-y-4">
              <div className="flex justify-center space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex items-center space-x-2"
                >
                  <Camera className="w-4 h-4" />
                  <span>Camera</span>
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center space-x-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload</span>
                </Button>
              </div>
              
              <p className="text-sm text-gray-500">
                Or drag and drop images here
              </p>
              
              <p className="text-xs text-gray-400">
                {images.length} of {maxImages} images added
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
      />
      
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
      />
      
      {/* Image Previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {images.map((image) => (
            <div key={image.id} className="relative">
              <img
                src={image.preview}
                alt="Preview"
                className="w-full h-24 object-cover rounded-lg border"
              />
              {!disabled && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                  onClick={() => removeImage(image.id)}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
              {image.uploaded && (
                <div className="absolute bottom-1 right-1 bg-green-500 text-white text-xs px-1 rounded">
                  ✓
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {uploading && (
        <div className="text-center text-sm text-gray-500">
          Uploading images...
        </div>
      )}
    </div>
  );
});

ImageUpload.displayName = 'ImageUpload';

export default ImageUpload;
