
import { useParams, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import LabelPrinter from '@/components/LabelPrinter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const LabelPrinterPage = () => {
  const { facilitySlug } = useParams();
  const [searchParams] = useSearchParams();
  const documentId = searchParams.get('documentId');
  
  const [document, setDocument] = useState<any>(null);
  const [facility, setFacility] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!facilitySlug || !documentId) {
        setError('Missing facility or document information');
        setIsLoading(false);
        return;
      }

      try {
        // Load facility data
        const { data: facilityData, error: facilityError } = await supabase
          .from('facilities')
          .select('*')
          .eq('slug', facilitySlug)
          .single();

        if (facilityError) {
          console.error('Failed to load facility:', facilityError);
          setError('Failed to load facility information');
          setIsLoading(false);
          return;
        }

        setFacility(facilityData);

        // Load document data
        const { data: documentData, error: documentError } = await supabase
          .from('sds_documents')
          .select('*')
          .eq('id', documentId)
          .single();

        if (documentError) {
          console.error('Failed to load document:', documentError);
          setError('Failed to load document information');
          setIsLoading(false);
          return;
        }

        setDocument(documentData);
      } catch (error) {
        console.error('Error loading data:', error);
        setError('An unexpected error occurred');
        toast.error('Failed to load label data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [facilitySlug, documentId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading label data...</p>
        </div>
      </div>
    );
  }

  if (error || !facility || !document) {
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
            <p className="text-sm text-gray-500">
              Please try again or contact support if the problem persists.
            </p>
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
              <h1 className="text-2xl font-bold text-gray-900">GHS Label Printer</h1>
              <p className="text-gray-600">
                {facility.facility_name} - {document.product_name}
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

export default LabelPrinterPage;
