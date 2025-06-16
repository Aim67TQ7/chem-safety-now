
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import QRCodeLib from 'qrcode';

interface FacilityData {
  id: string;
  slug: string;
  name: string;
  facility_name: string;
  contact_name: string;
  email: string;
  address: string;
  logo_url?: string;
  created_at: string;
}

const QRCodePrintPage = () => {
  const { slug } = useParams();
  const [facilityData, setFacilityData] = useState<FacilityData | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");

  useEffect(() => {
    const loadFacilityData = async () => {
      if (!slug) return;

      const { data, error } = await supabase
        .from('facilities')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) {
        console.error('Error loading facility data:', error);
        return;
      }

      setFacilityData(data);
    };

    loadFacilityData();
  }, [slug]);

  useEffect(() => {
    if (facilityData) {
      const facilityUrl = `https://chemlabel-gpt.lovable.app/facility/${slug}`;
      
      // Generate QR code as data URL
      QRCodeLib.toDataURL(facilityUrl, {
        width: 400,
        margin: 3,
        color: {
          dark: '#000000',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'M'
      }, (error, url) => {
        if (!error && url) {
          setQrCodeDataUrl(url);
        }
      });
    }
  }, [facilityData, slug]);

  useEffect(() => {
    // Auto-trigger print dialog when page loads
    const timer = setTimeout(() => {
      window.print();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (!facilityData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p>Loading facility data...</p>
      </div>
    );
  }

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body { margin: 0; padding: 0; }
          .no-print { display: none !important; }
          .print-page { 
            width: 100vw; 
            height: 100vh; 
            page-break-after: avoid;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
          }
        }
        @page {
          size: letter;
          margin: 0.5in;
        }
      `}</style>

      {/* Screen instructions */}
      <div className="no-print fixed top-4 left-4 bg-gray-100 border border-gray-300 rounded-lg p-4 z-10">
        <p className="text-gray-800 font-medium">Print Preview</p>
        <p className="text-gray-600 text-sm">This page will automatically trigger your browser's print dialog.</p>
        <button 
          onClick={() => window.print()} 
          className="mt-2 bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
        >
          Print Again
        </button>
      </div>

      {/* Print content */}
      <div className="print-page min-h-screen bg-white flex flex-col justify-center items-center p-8">
        
        {/* Header with customer logo and name */}
        <div className="text-center mb-8">
          {facilityData.logo_url && (
            <div className="mb-6">
              <img 
                src={facilityData.logo_url} 
                alt={`${facilityData.facility_name || facilityData.name} Logo`}
                className="h-20 mx-auto object-contain"
              />
            </div>
          )}
          <h1 className="text-5xl font-bold text-gray-900 mb-3">
            {facilityData.facility_name || facilityData.name}
          </h1>
          <p className="text-2xl text-gray-700 font-medium">Chemical Safety Portal</p>
        </div>

        {/* Main QR Code Section */}
        <div className="bg-white border-4 border-gray-800 rounded-2xl p-16 shadow-2xl max-w-3xl">
          <div className="text-center space-y-8">
            
            {/* QR Code with embedded customer logo */}
            <div className="relative inline-block">
              {qrCodeDataUrl && (
                <>
                  <img 
                    src={qrCodeDataUrl} 
                    alt="Facility QR Code"
                    className="w-96 h-96 mx-auto border-4 border-gray-800 rounded-xl"
                  />
                  {/* Customer logo overlay in center of QR code */}
                  {facilityData.logo_url && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-4 rounded-xl shadow-lg border-4 border-gray-800">
                      <img 
                        src={facilityData.logo_url} 
                        alt={`${facilityData.facility_name || facilityData.name} Logo`}
                        className="w-20 h-20 object-contain"
                      />
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Instructions */}
            <div className="space-y-6 max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900">
                Scan for Chemical Safety Information
              </h2>
              
              <div className="bg-gray-100 border-2 border-gray-300 rounded-xl p-8">
                <div className="space-y-4 text-left">
                  <div className="flex items-start space-x-4">
                    <div className="bg-gray-800 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold">1</div>
                    <p className="text-gray-900 text-lg font-medium">Open your phone's camera app</p>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="bg-gray-800 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold">2</div>
                    <p className="text-gray-900 text-lg font-medium">Point camera at QR code</p>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="bg-gray-800 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold">3</div>
                    <p className="text-gray-900 text-lg font-medium">Tap the notification to access safety data</p>
                  </div>
                </div>
              </div>

              <div className="border-2 border-gray-300 rounded-xl p-6 bg-gray-50">
                <p className="text-lg text-gray-700 font-medium">
                  Instant access to Safety Data Sheets, hazard information, and compliance documentation
                </p>
                <p className="text-gray-600 mt-2">
                  No app download required • Works with any smartphone camera
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <div className="flex items-center justify-center space-x-3 mb-3">
            <img 
              src="/lovable-uploads/7cbd0a20-15f0-43f7-9877-126cab0c631c.png" 
              alt="ChemLabel-GPT Logo" 
              className="w-10 h-10 object-contain"
            />
            <p className="text-lg text-gray-600 font-medium">Powered by ChemLabel-GPT</p>
          </div>
          <p className="text-gray-500">OSHA Compliant Chemical Safety Platform</p>
        </div>

      </div>
    </>
  );
};

export default QRCodePrintPage;
