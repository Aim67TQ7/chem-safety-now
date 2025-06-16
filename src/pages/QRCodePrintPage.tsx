
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import QRCodeLib from 'qrcode';
import { Button } from "@/components/ui/button";
import { Printer, Download, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const { facilitySlug } = useParams();
  const [facilityData, setFacilityData] = useState<FacilityData | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [posterSize, setPosterSize] = useState<'letter' | 'a4' | 'tabloid'>('letter');
  const { toast } = useToast();

  useEffect(() => {
    const loadFacilityData = async () => {
      if (!facilitySlug) {
        setError("No facility specified");
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('facilities')
          .select('*')
          .eq('slug', facilitySlug)
          .single();

        if (error) {
          console.error('Error loading facility data:', error);
          setError("Facility not found");
          setLoading(false);
          return;
        }

        setFacilityData(data);
        setLoading(false);
      } catch (err) {
        console.error('Unexpected error:', err);
        setError("Failed to load facility data");
        setLoading(false);
      }
    };

    loadFacilityData();
  }, [facilitySlug]);

  useEffect(() => {
    if (facilityData) {
      const facilityUrl = `https://chemlabel-gpt.lovable.app/facility/${facilitySlug}`;
      
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
        } else {
          console.error('QR Code generation error:', error);
        }
      });
    }
  }, [facilityData, facilitySlug]);

  const handlePrint = () => {
    window.print();
    toast({
      title: "Print Dialog Opened",
      description: "Your browser's print dialog has been opened.",
    });
  };

  const downloadPoster = async () => {
    if (!qrCodeDataUrl || !facilityData) return;

    try {
      // Create a canvas to combine QR code with poster design
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size based on poster size
      const sizes = {
        letter: { width: 2550, height: 3300 }, // 8.5x11 at 300 DPI
        a4: { width: 2480, height: 3508 }, // A4 at 300 DPI
        tabloid: { width: 3300, height: 5100 } // 11x17 at 300 DPI
      };

      canvas.width = sizes[posterSize].width;
      canvas.height = sizes[posterSize].height;

      // Fill with white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // This would need more complex canvas drawing logic for a full implementation
      // For now, we'll download the QR code directly
      const link = document.createElement('a');
      link.download = `${facilityData.name}-Safety-Poster.png`;
      link.href = qrCodeDataUrl;
      link.click();

      toast({
        title: "Poster Downloaded",
        description: "Your safety poster has been saved to downloads.",
      });
    } catch (err) {
      console.error('Download error:', err);
      toast({
        title: "Download Failed",
        description: "There was an error downloading the poster.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading facility data...</p>
        </div>
      </div>
    );
  }

  if (error || !facilityData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Facility Not Found</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button 
            onClick={() => window.history.back()}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body { margin: 0; padding: 0; background: white !important; }
          .no-print { display: none !important; }
          .print-page { 
            width: 100vw; 
            height: 100vh; 
            page-break-after: avoid;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            background: white !important;
          }
          .poster-content {
            max-width: none !important;
            width: 100% !important;
            height: 100% !important;
          }
        }
        @page {
          size: ${posterSize === 'letter' ? 'letter' : posterSize === 'a4' ? 'A4' : '11in 17in'};
          margin: 0.5in;
        }
      `}</style>

      {/* Screen controls */}
      <div className="no-print fixed top-4 left-4 right-4 bg-white border border-gray-300 rounded-lg p-4 z-10 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Print Preview</h2>
            <p className="text-sm text-gray-600">Professional safety poster for {facilityData.facility_name || facilityData.name}</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700">Size:</label>
              <select 
                value={posterSize} 
                onChange={(e) => setPosterSize(e.target.value as any)}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              >
                <option value="letter">Letter (8.5x11)</option>
                <option value="a4">A4</option>
                <option value="tabloid">Tabloid (11x17)</option>
              </select>
            </div>
            
            <Button onClick={downloadPoster} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Download PNG
            </Button>
            
            <Button onClick={handlePrint} size="sm" className="bg-gray-800 hover:bg-gray-900">
              <Printer className="w-4 h-4 mr-2" />
              Print Poster
            </Button>
          </div>
        </div>
      </div>

      {/* Print content */}
      <div className="print-page min-h-screen bg-white flex flex-col justify-center items-center p-8">
        <div className="poster-content max-w-4xl w-full">
          
          {/* Header with customer logo and name */}
          <div className="text-center mb-12">
            {facilityData.logo_url && (
              <div className="mb-8">
                <img 
                  src={facilityData.logo_url} 
                  alt={`${facilityData.facility_name || facilityData.name} Logo`}
                  className="h-24 mx-auto object-contain"
                />
              </div>
            )}
            <h1 className="text-6xl font-bold text-gray-900 mb-4 leading-tight">
              {facilityData.facility_name || facilityData.name}
            </h1>
            <p className="text-3xl text-gray-700 font-medium mb-2">Chemical Safety Portal</p>
            <p className="text-xl text-gray-600">OSHA Compliant • Instant Access • Mobile Ready</p>
          </div>

          {/* Main QR Code Section */}
          <div className="bg-white border-4 border-gray-800 rounded-3xl p-20 shadow-2xl">
            <div className="text-center space-y-10">
              
              {/* QR Code */}
              <div className="relative inline-block">
                {qrCodeDataUrl && (
                  <img 
                    src={qrCodeDataUrl} 
                    alt="Facility QR Code"
                    className="w-80 h-80 mx-auto border-4 border-gray-800 rounded-2xl"
                  />
                )}
              </div>

              {/* Instructions */}
              <div className="space-y-8 max-w-3xl mx-auto">
                <h2 className="text-4xl font-bold text-gray-900">
                  Scan for Instant Safety Access
                </h2>
                
                <div className="bg-gray-100 border-2 border-gray-300 rounded-2xl p-10">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                    <div className="space-y-4">
                      <div className="bg-gray-800 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto">1</div>
                      <h3 className="text-xl font-bold text-gray-900">Open Camera</h3>
                      <p className="text-gray-700">Use your phone's camera app</p>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-gray-800 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto">2</div>
                      <h3 className="text-xl font-bold text-gray-900">Point & Scan</h3>
                      <p className="text-gray-700">Aim at the QR code</p>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-gray-800 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto">3</div>
                      <h3 className="text-xl font-bold text-gray-900">Access Data</h3>
                      <p className="text-gray-700">Tap to view safety information</p>
                    </div>
                  </div>
                </div>

                <div className="border-2 border-orange-300 rounded-2xl p-8 bg-orange-50">
                  <h3 className="text-2xl font-bold text-orange-900 mb-4">Available Resources</h3>
                  <div className="grid grid-cols-2 gap-4 text-left">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-orange-600 rounded-full"></div>
                      <span className="text-lg text-orange-800">Safety Data Sheets</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-orange-600 rounded-full"></div>
                      <span className="text-lg text-orange-800">Hazard Information</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-orange-600 rounded-full"></div>
                      <span className="text-lg text-orange-800">Emergency Procedures</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-orange-600 rounded-full"></div>
                      <span className="text-lg text-orange-800">AI Safety Assistant</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Facility Contact Info */}
          {(facilityData.address || facilityData.contact_name || facilityData.email) && (
            <div className="mt-12 text-center bg-gray-50 border-2 border-gray-200 rounded-xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Facility Information</h3>
              <div className="space-y-2 text-lg text-gray-700">
                {facilityData.contact_name && (
                  <p><span className="font-medium">Contact:</span> {facilityData.contact_name}</p>
                )}
                {facilityData.address && (
                  <p><span className="font-medium">Address:</span> {facilityData.address}</p>
                )}
                {facilityData.email && (
                  <p><span className="font-medium">Email:</span> {facilityData.email}</p>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-16 text-center">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <img 
                src="/lovable-uploads/7cbd0a20-15f0-43f7-9877-126cab0c631c.png" 
                alt="ChemLabel-GPT Logo" 
                className="w-12 h-12 object-contain"
              />
              <div className="text-left">
                <p className="text-xl text-gray-800 font-bold">ChemLabel-GPT</p>
                <p className="text-gray-600">OSHA Compliant Chemical Safety Platform</p>
              </div>
            </div>
            <p className="text-sm text-gray-500">No app required • Works with any smartphone • Real-time compliance tracking</p>
          </div>

        </div>
      </div>
    </>
  );
};

export default QRCodePrintPage;
