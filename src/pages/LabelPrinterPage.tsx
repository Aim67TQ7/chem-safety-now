
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import LabelPrinter from '@/components/LabelPrinter';
import ProductSelector from '@/components/ProductSelector';
import FacilityNavbar from '@/components/FacilityNavbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const LabelPrinterPage = () => {
  const { facilitySlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const documentId = searchParams.get('documentId');
  
  const [document, setDocument] = useState<any>(null);
  const [facility, setFacility] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDocumentLoading, setIsDocumentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!facilitySlug) {
        console.error('Missing facilitySlug:', { facilitySlug });
        setError('Missing facility information');
        setIsLoading(false);
        return;
      }

      try {
        console.log('Loading facility with slug:', facilitySlug);
        
        // Load facility data
        const { data: facilityData, error: facilityError } = await supabase
          .from('facilities')
          .select('*')
          .eq('slug', facilitySlug)
          .maybeSingle();

        if (facilityError) {
          console.error('Failed to load facility:', facilityError);
          setError(`Failed to load facility information: ${facilityError.message}`);
          setIsLoading(false);
          return;
        }

        if (!facilityData) {
          console.error('Facility not found with slug:', facilitySlug);
          
          // Try to find any facilities to debug
          const { data: allFacilities } = await supabase
            .from('facilities')
            .select('id, slug, facility_name')
            .limit(5);
          
          console.log('Available facilities:', allFacilities);
          setError(`Facility not found with slug: ${facilitySlug}`);
          setIsLoading(false);
          return;
        }

        console.log('Facility loaded successfully:', facilityData);
        setFacility(facilityData);

        // Only load document if documentId is provided
        if (documentId) {
          await loadDocument(documentId);
        }
      } catch (error: any) {
        console.error('Error loading data:', error);
        setError(`An unexpected error occurred: ${error.message}`);
        toast.error('Failed to load label data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [facilitySlug, documentId]);

  const loadDocument = async (docId: string) => {
    try {
      setIsDocumentLoading(true);
      setError(null);
      
      const { data: documentData, error: documentError } = await supabase
        .from('sds_documents')
        .select('*')
        .eq('id', docId)
        .maybeSingle();

      if (documentError) {
        console.error('Failed to load document:', documentError);
        setError(`Failed to load document: ${documentError.message}`);
        return;
      }

      if (!documentData) {
        console.error('Document not found with ID:', docId);
        setError(`Document not found with ID: ${docId}`);
        return;
      }

      console.log('Document loaded successfully:', documentData);
      setDocument(documentData);
      
      // Update URL to reflect selected document
      setSearchParams({ documentId: docId });
    } catch (error: any) {
      console.error('Error loading document:', error);
      setError(`An unexpected error occurred: ${error.message}`);
    } finally {
      setIsDocumentLoading(false);
    }
  };

  const handleDocumentSelect = (selectedDoc: any) => {
    if (selectedDoc) {
      loadDocument(selectedDoc.id);
    } else {
      setDocument(null);
      setSearchParams({});
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading label data...</p>
          <p className="text-sm text-gray-500 mt-2">
            Facility: {facilitySlug} | Document: {documentId?.slice(0, 8)}...
          </p>
        </div>
      </div>
    );
  }

  if (error || !facility) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              Error Loading Page
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              {error || 'Unable to load the requested page.'}
            </p>
            <div className="text-sm text-gray-500 space-y-1">
              <p><strong>Facility Slug:</strong> {facilitySlug}</p>
              <p><strong>Document ID:</strong> {documentId || 'None'}</p>
              <p><strong>Facility Found:</strong> {facility ? 'Yes' : 'No'}</p>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Please try again or contact support if the problem persists.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Facility Navigation */}
      <FacilityNavbar 
        facilityName={facility?.facility_name}
        facilityLogo={facility?.logo_url}
        facilityAddress={facility?.address}
      />
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">GHS Label Printer</h1>
              <p className="text-gray-600">
                {facility.facility_name} {document && `- ${document.product_name}`}
              </p>
            </div>
            {document && (
              <div className="text-sm text-gray-500">
                Document ID: {document.id.slice(0, 8)}...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product Selection */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Select Product for Label Printing
              {isDocumentLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ProductSelector
              selectedDocumentId={documentId || undefined}
              onDocumentSelect={handleDocumentSelect}
            />
          </CardContent>
        </Card>

        {/* Label Printer Component */}
        {document && (
          <LabelPrinter
            initialProductName={document.product_name || ''}
            initialManufacturer={document.manufacturer || ''}
            selectedDocument={document}
          />
        )}

        {!document && !isLoading && !error && (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-600 mb-4">Select a product from the dropdown above to start printing labels.</p>
              <p className="text-sm text-gray-500">
                The label printer will load with all the product information from our SDS database.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default LabelPrinterPage;
