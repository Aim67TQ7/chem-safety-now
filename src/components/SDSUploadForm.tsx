import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SDSUploadFormProps {
  facilityId?: string;
  onUploadSuccess?: (document: any) => void;
  onClose?: () => void;
}

const SDSUploadForm: React.FC<SDSUploadFormProps> = ({
  facilityId,
  onUploadSuccess,
  onClose
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationStatus, setValidationStatus] = useState<'pending' | 'validating' | 'valid' | 'invalid' | null>(null);
  const [validationMessage, setValidationMessage] = useState('');

  const validateFile = (file: File): string | null => {
    // Check file type
    if (file.type !== 'application/pdf') {
      return 'Only PDF files are allowed';
    }
    
    // Check file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      return 'File size must be less than 20MB';
    }
    
    return null;
  };

  const handleFileSelect = (selectedFile: File) => {
    const error = validateFile(selectedFile);
    if (error) {
      toast.error(error);
      return;
    }
    
    setFile(selectedFile);
    setValidationStatus('pending');
    setValidationMessage('');
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(10);
    setValidationStatus('validating');
    setValidationMessage('Uploading and validating SDS document...');

    try {
      // Upload file to temporary storage
      const fileName = `upload_${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('sds-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      setUploadProgress(40);
      setValidationMessage('File uploaded, validating SDS content...');

      // Validate the uploaded SDS document
      const { data: validationResult, error: validationError } = await supabase.functions.invoke('sds-upload-validation', {
        body: {
          file_path: uploadData.path,
          original_filename: file.name,
          facility_id: facilityId
        }
      });

      if (validationError) throw validationError;

      setUploadProgress(80);

      if (validationResult.is_valid) {
        setValidationStatus('valid');
        setValidationMessage('SDS document validated successfully');
        setUploadProgress(100);

        // Save validated document to database
        const { data: savedDoc, error: saveError } = await supabase
          .from('sds_documents')
          .insert([{
            product_name: validationResult.product_name,
            manufacturer: validationResult.manufacturer,
            source_url: `https://fwzgsiysdwsmmkgqmbsd.supabase.co/storage/v1/object/public/sds-documents/${uploadData.path}`,
            bucket_url: `sds-documents/${uploadData.path}`,
            file_name: file.name,
            file_type: 'application/pdf',
            document_type: 'sds',
            extraction_status: 'completed',
            is_readable: true,
            ai_extracted_data: validationResult.extracted_data || {},
            ai_extraction_confidence: validationResult.confidence_score || 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (saveError) throw saveError;

        toast.success('SDS document uploaded and validated successfully');
        
        if (onUploadSuccess) {
          onUploadSuccess(savedDoc);
        }

        // Reset form
        setFile(null);
        setValidationStatus(null);
        setUploadProgress(0);
        
      } else {
        setValidationStatus('invalid');
        setValidationMessage(validationResult.validation_errors?.join(', ') || 'Document is not a valid SDS');
        
        // Clean up uploaded file
        await supabase.storage.from('sds-documents').remove([uploadData.path]);
        
        toast.error('Uploaded file is not a valid SDS document');
      }

    } catch (error: any) {
      console.error('Upload error:', error);
      setValidationStatus('invalid');
      setValidationMessage(`Upload failed: ${error.message}`);
      toast.error('Failed to upload SDS document');
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setValidationStatus(null);
    setValidationMessage('');
    setUploadProgress(0);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload SDS Document
        </CardTitle>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Upload your own Safety Data Sheet (SDS) document if you can't find it in our database.
          Only PDF files up to 20MB are accepted.
        </div>

        {!file ? (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragging 
                ? 'border-primary bg-primary/10' 
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('sds-file-input')?.click()}
          >
            <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium">
                {isDragging ? 'Drop your SDS file here' : 'Drop your SDS file here or click to browse'}
              </p>
              <p className="text-sm text-muted-foreground">
                Supports PDF files up to 20MB
              </p>
            </div>
            <input
              id="sds-file-input"
              type="file"
              accept=".pdf"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-red-600" />
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={removeFile}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {validationStatus && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {validationStatus === 'valid' && <CheckCircle className="w-4 h-4 text-green-600" />}
                  {validationStatus === 'invalid' && <AlertCircle className="w-4 h-4 text-red-600" />}
                  {validationStatus === 'validating' && <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
                  <span className={`text-sm ${
                    validationStatus === 'valid' ? 'text-green-600' : 
                    validationStatus === 'invalid' ? 'text-red-600' : 
                    'text-muted-foreground'
                  }`}>
                    {validationMessage}
                  </span>
                </div>
                {isUploading && (
                  <Progress value={uploadProgress} className="w-full" />
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={handleUpload} 
                disabled={isUploading || validationStatus === 'valid'}
                className="flex-1"
              >
                {isUploading ? 'Uploading...' : 'Upload & Validate'}
              </Button>
              <Button variant="outline" onClick={removeFile}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SDSUploadForm;