
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, Loader2 } from "lucide-react";

interface SDSDocumentDeleteButtonProps {
  document: {
    id: string;
    product_name: string;
    file_name: string;
    bucket_url?: string;
  };
  onDeleteSuccess: () => void;
}

const SDSDocumentDeleteButton: React.FC<SDSDocumentDeleteButtonProps> = ({ 
  document, 
  onDeleteSuccess 
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    
    try {
      console.log('🗑️ Deleting SDS document:', document.id, document.product_name);

      // Delete from storage if bucket_url exists
      if (document.bucket_url) {
        const filePath = document.bucket_url.replace('sds-documents/', '');
        console.log('🗑️ Deleting file from storage:', filePath);
        
        const { error: storageError } = await supabase.storage
          .from('sds-documents')
          .remove([filePath]);
        
        if (storageError) {
          console.warn('⚠️ Storage deletion warning:', storageError);
          // Don't fail the entire operation if storage deletion fails
        }
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('sds_documents')
        .delete()
        .eq('id', document.id);

      if (dbError) {
        throw dbError;
      }

      console.log('✅ Successfully deleted SDS document');
      toast.success(`Successfully deleted ${document.product_name}`);
      onDeleteSuccess();
      
    } catch (error) {
      console.error('❌ Error deleting SDS document:', error);
      toast.error(`Failed to delete document: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
          disabled={isDeleting}
        >
          {isDeleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete SDS Document</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this SDS document?
            <div className="mt-2 p-2 bg-gray-50 rounded">
              <strong>Product:</strong> {document.product_name}<br/>
              <strong>File:</strong> {document.file_name}
            </div>
            This action cannot be undone. The PDF file and database record will be permanently removed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Document'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SDSDocumentDeleteButton;
