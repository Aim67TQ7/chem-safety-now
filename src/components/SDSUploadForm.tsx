import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, CheckCircle, AlertCircle, X, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SDSUploadFormProps {
  facilityId?: string;
  onUploadSuccess?: (documents: any[]) => void;
  onClose?: () => void;
}

interface UploadFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  message?: string;
}

const SDSUploadForm: React.FC<SDSUploadFormProps> = ({
  facilityId,
  onUploadSuccess,
  onClose
}) => {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const validateFile = (file: File): string | null => {
    // Check file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      return 'File size must be less than 20MB';
    }
    
    // Recommend PDF but don't enforce
    if (file.type !== 'application/pdf') {
      return 'Warning: Only PDF files are recommended for SDS documents';
    }
    
    return null;
  };

  const handleFileSelect = (selectedFiles: FileList) => {
    const newFiles: UploadFile[] = [];
    const currentFileCount = files.length;
    
    // Check if adding these files would exceed the limit
    if (currentFileCount + selectedFiles.length > 5) {
      toast.error(`You can only upload up to 5 files at a time. Currently selected: ${currentFileCount}`);
      return;
    }
    
    Array.from(selectedFiles).forEach((file) => {
      const error = validateFile(file);
      if (error && !error.includes('Warning:')) {
        toast.error(`${file.name}: ${error}`);
        return;
      }
      
      if (error && error.includes('Warning:')) {
        toast.warning(`${file.name}: ${error}`);
      }
      
      newFiles.push({
        file,
        id: `${Date.now()}_${Math.random()}`,
        status: 'pending',
        progress: 0
      });
    });
    
    setFiles(prev => [...prev, ...newFiles]);
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
    
    if (e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, [files]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileSelect(e.target.files);
    }
  };

  const uploadSingleFile = async (uploadFile: UploadFile): Promise<any> => {
    try {
      // Update status
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'uploading', progress: 10, message: 'Uploading...' }
          : f
      ));

      // Upload file to storage
      const fileName = `upload_${Date.now()}_${uploadFile.file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('sds-documents')
        .upload(fileName, uploadFile.file);

      if (uploadError) throw uploadError;

      // Update progress
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, progress: 50, message: 'Saving to database...' }
          : f
      ));

      // Save document to database without validation
      const { data: savedDoc, error: saveError } = await supabase
        .from('sds_documents')
        .insert([{
          product_name: uploadFile.file.name.replace('.pdf', '').replace(/_/g, ' '),
          source_url: `https://fwzgsiysdwsmmkgqmbsd.supabase.co/storage/v1/object/public/sds-documents/${uploadData.path}`,
          bucket_url: `sds-documents/${uploadData.path}`,
          file_name: uploadFile.file.name,
          file_type: uploadFile.file.type,
          document_type: 'unknown_document', // Will be determined by extraction
          extraction_status: 'pending',
          is_readable: false, // Will be updated after extraction
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (saveError) throw saveError;

      // Update progress
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, progress: 80, message: 'Starting text extraction...' }
          : f
      ));

      // Trigger text extraction in background
      const { error: extractionError } = await supabase.functions.invoke('extract-sds-text', {
        body: {
          document_id: savedDoc.id,
          file_name: uploadFile.file.name,
          validate_only: false
        }
      });

      if (extractionError) {
        console.warn('Text extraction failed:', extractionError);
        // Don't fail the upload, just log the error
      }

      // Create interaction record to associate document with facility
      if (facilityId) {
        const { error: interactionError } = await supabase
          .from('sds_interactions')
          .insert({
            facility_id: facilityId,
            sds_document_id: savedDoc.id,
            action_type: 'upload',
            metadata: {
              upload_source: 'facility_upload',
              file_name: uploadFile.file.name
            }
          });

        if (interactionError) {
          console.warn('Failed to create interaction record:', interactionError);
        }
      }

      // Mark as successful
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'success', progress: 100, message: 'Upload complete!' }
          : f
      ));

      return savedDoc;

    } catch (error: any) {
      console.error('Upload error:', error);
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'error', message: `Failed: ${error.message}` }
          : f
      ));
      throw error;
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    const uploadedDocs: any[] = [];

    try {
      // Upload all files
      for (const file of files) {
        if (file.status === 'pending') {
          try {
            const doc = await uploadSingleFile(file);
            uploadedDocs.push(doc);
          } catch (error) {
            // Continue with other files even if one fails
            continue;
          }
        }
      }

      const successCount = files.filter(f => f.status === 'success').length;
      const errorCount = files.filter(f => f.status === 'error').length;

      if (successCount > 0) {
        toast.success(`${successCount} document${successCount > 1 ? 's' : ''} uploaded successfully${errorCount > 0 ? `, ${errorCount} failed` : ''}`);
        
        if (onUploadSuccess) {
          onUploadSuccess(uploadedDocs);
        }
      } else {
        toast.error('All uploads failed');
      }

    } catch (error: any) {
      console.error('Batch upload error:', error);
      toast.error('Upload process failed');
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const clearAllFiles = () => {
    setFiles([]);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload SDS Documents
        </CardTitle>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Warning Message */}
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-800 mb-1">Please upload Safety Data Sheet (SDS) documents only</p>
            <p className="text-amber-700">
              While we don't enforce file validation, uploading non-SDS documents may result in incomplete or incorrect hazard information extraction.
              Maximum file size: 20MB per file. Maximum files: 5 at a time.
            </p>
          </div>
        </div>

        {files.length === 0 ? (
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
                {isDragging ? 'Drop your SDS files here' : 'Drop your SDS files here or click to browse'}
              </p>
              <p className="text-sm text-muted-foreground">
                Upload up to 5 PDF files, max 20MB each
              </p>
            </div>
            <input
              id="sds-file-input"
              type="file"
              accept=".pdf"
              multiple
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>
        ) : (
          <div className="space-y-4">
            {/* File List */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {files.map((uploadFile) => (
                <div key={uploadFile.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3 flex-1">
                    <FileText className="w-6 h-6 text-red-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{uploadFile.file.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{(uploadFile.file.size / (1024 * 1024)).toFixed(2)} MB</span>
                        {uploadFile.status === 'success' && <CheckCircle className="w-4 h-4 text-green-600" />}
                        {uploadFile.status === 'error' && <AlertCircle className="w-4 h-4 text-red-600" />}
                        {uploadFile.status === 'uploading' && <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
                      </div>
                      {uploadFile.message && (
                        <p className={`text-xs mt-1 ${
                          uploadFile.status === 'success' ? 'text-green-600' : 
                          uploadFile.status === 'error' ? 'text-red-600' : 
                          'text-muted-foreground'
                        }`}>
                          {uploadFile.message}
                        </p>
                      )}
                      {uploadFile.status === 'uploading' && (
                        <Progress value={uploadFile.progress} className="w-full mt-2" />
                      )}
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => removeFile(uploadFile.id)}
                    disabled={uploadFile.status === 'uploading'}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Add More Files */}
            {files.length < 5 && (
              <Button
                variant="outline"
                onClick={() => document.getElementById('sds-file-input')?.click()}
                disabled={isUploading}
                className="w-full"
              >
                Add More Files ({files.length}/5)
              </Button>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button 
                onClick={handleUpload} 
                disabled={isUploading || files.every(f => f.status === 'success')}
                className="flex-1"
              >
                {isUploading ? 'Uploading...' : 'Upload All Files'}
              </Button>
              <Button variant="outline" onClick={clearAllFiles} disabled={isUploading}>
                Clear All
              </Button>
            </div>
          </div>
        )}

        {/* Hidden file input for additional files */}
        <input
          id="sds-file-input"
          type="file"
          accept=".pdf"
          multiple
          onChange={handleFileInputChange}
          className="hidden"
        />
      </CardContent>
    </Card>
  );
};

export default SDSUploadForm;