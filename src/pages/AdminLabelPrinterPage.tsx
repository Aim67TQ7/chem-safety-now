import { useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import LabelPrinter from '@/components/LabelPrinter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const AdminLabelPrinterPage = () => {
  const [searchParams] = useSearchParams();
  const documentId = searchParams.get('documentId');
  const navigate = useNavigate();
  
  const [document, setDocument] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!documentId) {
        setError('No document ID provided');
        setIsLoading(false);
        return;
      }

      try {
        console.log('Loading document with ID:', documentId);
        
        // Load document data
        const { data: documentData, error: documentError } = await supabase
          .from('sds_documents')
          .select('*')
          .eq('id', documentId)
          .maybeSingle();

        if (documentError) {
          console.error('Failed to load document:', documentError);
          setError(`Failed to load document information: ${documentError.message}`);
          setIsLoading(false);
          return;
        }

        if (!documentData) {
          console.error('Document not found with ID:', documentId);
          setError(`Document not found with ID: ${documentId}`);
          setIsLoading(false);
          return;
        }

        console.log('Document loaded successfully:', documentData);
        setDocument(documentData);
      } catch (error: any) {
        console.error('Error loading data:', error);
        setError(`An unexpected error occurred: ${error.message}`);
        toast.error('Failed to load label data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [documentId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading label data...</p>
          <p className="text-sm text-gray-500 mt-2">
            Document: {documentId?.slice(0, 8)}...
          </p>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              Error Loading Label
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              {error || 'Unable to load the requested label data.'}
            </p>
            <div className="text-sm text-gray-500 space-y-1">
              <p><strong>Document ID:</strong> {documentId}</p>
              <p><strong>Document Found:</strong> {document ? 'Yes' : 'No'}</p>
            </div>
            <Button 
              onClick={() => navigate('/admin/sds-documents')}
              className="mt-4 w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Documents
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/admin/sds-documents')}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Documents
                </Button>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Admin GHS Label Printer</h1>
              <p className="text-gray-600">
                {document.product_name} {document.manufacturer && `- ${document.manufacturer}`}
              </p>
            </div>
            <div className="text-sm text-gray-500">
              Document ID: {document.id.slice(0, 8)}...
            </div>
          </div>
        </div>
      </div>

      {/* Label Printer Component */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <LabelPrinter
          initialProductName={document.product_name}
          initialManufacturer={document.manufacturer}
          selectedDocument={document}
        />
      </div>
    </div>
  );
};

export default AdminLabelPrinterPage;