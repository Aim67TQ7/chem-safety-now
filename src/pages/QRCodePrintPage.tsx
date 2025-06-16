
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import QRCodeLib from 'qrcode';

interface FacilityData {
  email: string;
  facilityName: string;
  contactName: string;
  address: string;
  logo: File | null;
  slug: string;
  createdAt: string;
}

const QRCodePrintPage = () => {
  const { slug } = useParams();
  const [facilityData, setFacilityData] = useState<FacilityData | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");

  useEffect(() => {
    // Load facility data
    const data = localStorage.getItem(`facility_${slug}`);
    if (data) {
      setFacilityData(JSON.parse(data));
    }
  }, [slug]);

  useEffect(() => {
    if (facilityData) {
      const facilityUrl = `https://chemlabel-gpt.com/facility/${slug}`;
      
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
      <div className="no-print fixed top-4 left-4 bg-blue-100 border border-blue-300 rounded-lg p-4 z-10">
        <p className="text-blue-800 font-medium">Print Preview</p>
        <p className="text-blue-600 text-sm">This page will automatically trigger your browser's print dialog.</p>
        <button 
          onClick={() => window.print()} 
          className="mt-2 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
        >
          Print Again
        </button>
      </div>

      {/* Print content */}
      <div className="print-page min-h-screen bg-white flex flex-col justify-center items-center p-8">
        
        {/* Header with customer logo and name */}
        <div className="text-center mb-8">
          {facilityData.logo && (
            <div className="mb-4">
              <img 
                src={URL.createObjectURL(facilityData.logo)} 
                alt={`${facilityData.facilityName} Logo`}
                className="h-16 mx-auto object-contain"
              />
            </div>
          )}
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {facilityData.facilityName}
          </h1>
          <p className="text-xl text-gray-600">Chemical Safety Portal</p>
        </div>

        {/* Main QR Code Section */}
        <div className="bg-white border-4 border-gray-300 rounded-2xl p-12 shadow-lg max-w-2xl">
          <div className="text-center space-y-6">
            
            {/* QR Code with embedded logo */}
            <div className="relative inline-block">
              {qrCodeDataUrl && (
                <>
                  <img 
                    src={qrCodeDataUrl} 
                    alt="Facility QR Code"
                    className="w-80 h-80 mx-auto border-2 border-gray-200 rounded-lg"
                  />
                  {/* Customer logo overlay in center of QR code */}
                  {facilityData.logo && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-3 rounded-lg shadow-md border-2 border-gray-300">
                      <img 
                        src={URL.createObjectURL(facilityData.logo)} 
                        alt={`${facilityData.facilityName} Logo`}
                        className="w-16 h-16 object-contain"
                      />
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Instructions */}
            <div className="space-y-4 max-w-lg mx-auto">
              <h2 className="text-2xl font-bold text-gray-900">
                Scan for Chemical Safety Information
              </h2>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="space-y-3 text-left">
                  <div className="flex items-start space-x-3">
                    <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</div>
                    <p className="text-blue-900">Open your phone's camera app</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</div>
                    <p className="text-blue-900">Point camera at QR code</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</div>
                    <p className="text-blue-900">Tap the notification to access safety data</p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600">
                No app download required • Works with any smartphone camera
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <div className="flex items-center justify-center space-x-3 mb-2">
            <img 
              src="/lovable-uploads/7cbd0a20-15f0-43f7-9877-126cab0c631c.png" 
              alt="ChemLabel-GPT Logo" 
              className="w-8 h-8 object-contain"
            />
            <p className="text-sm text-gray-500">Powered by ChemLabel-GPT</p>
          </div>
          <p className="text-xs text-gray-400">OSHA Compliant Chemical Safety Platform</p>
        </div>

      </div>
    </>
  );
};

export default QRCodePrintPage;
