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
  const [layoutMode, setLayoutMode] = useState<'single' | 'dual'>('single');
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
      const link = document.createElement('a');
      link.download = `${facilityData.name}-Safety-Poster-${layoutMode}.png`;
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

  const PosterContent = () => (
    <div className="poster-content w-full h-full">
      
      {/* Header with customer logo and name */}
      <div className="text-center mb-8">
        {facilityData.logo_url && (
          <div className="mb-6">
            <img 
              src={facilityData.logo_url} 
              alt={`${facilityData.facility_name || facilityData.name} Logo`}
              className="h-16 mx-auto object-contain"
            />
          </div>
        )}
        <h1 className="text-4xl font-bold text-gray-900 mb-3 leading-tight">
          {facilityData.facility_name || facilityData.name}
        </h1>
        <p className="text-2xl text-gray-700 font-medium mb-1">Chemical Safety Portal</p>
        <p className="text-lg text-gray-600">OSHA Compliant • Instant Access • Mobile Ready</p>
      </div>

      {/* Main QR Code Section */}
      <div className="bg-white border-4 border-gray-800 rounded-2xl p-12 shadow-2xl">
        <div className="text-center space-y-8">
          
          {/* QR Code with embedded logo */}
          <div className="relative inline-block">
            {qrCodeDataUrl && (
              <div className="relative">
                <img 
                  src={qrCodeDataUrl} 
                  alt="Facility QR Code"
                  className="w-64 h-64 mx-auto border-4 border-gray-800 rounded-xl"
                />
                {/* Company logo overlay in center of QR code */}
                {facilityData.logo_url && (
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-3 rounded-lg shadow-lg border-2 border-gray-800">
                    <img 
                      src={facilityData.logo_url} 
                      alt={`${facilityData.facility_name || facilityData.name} Logo`}
                      className="w-12 h-12 object-contain"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900">
              Scan for Instant Safety Access
            </h2>
            
            <div className="bg-gray-100 border-2 border-gray-300 rounded-xl p-8">
              <div className="grid grid-cols-3 gap-6 text-center">
                <div className="space-y-3">
                  <div className="bg-gray-800 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mx-auto">1</div>
                  <h3 className="text-lg font-bold text-gray-900">Open Camera</h3>
                  <p className="text-gray-700">Use your phone's camera app</p>
                </div>
                <div className="space-y-3">
                  <div className="bg-gray-800 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mx-auto">2</div>
                  <h3 className="text-lg font-bold text-gray-900">Point & Scan</h3>
                  <p className="text-gray-700">Aim at the QR code</p>
                </div>
                <div className="space-y-3">
                  <div className="bg-gray-800 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mx-auto">3</div>
                  <h3 className="text-lg font-bold text-gray-900">Access Data</h3>
                  <p className="text-gray-700">Tap to view safety information</p>
                </div>
              </div>
            </div>

            {/* Facility Information - moved inside main card */}
            {(facilityData.address || facilityData.contact_name || facilityData.email) && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                <h3 className="text-xl font-bold text-blue-900 mb-3">Facility Information</h3>
                <div className="space-y-1 text-lg text-blue-800">
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
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 text-center">
        <div className="flex items-center justify-center space-x-4 mb-3">
          <img 
            src="/lovable-uploads/7cbd0a20-15f0-43f7-9877-126cab0c631c.png" 
            alt="ChemLabel-GPT Logo" 
            className="w-8 h-8 object-contain"
          />
          <div className="text-left">
            <p className="text-lg text-gray-800 font-bold">ChemLabel-GPT</p>
            <p className="text-gray-600">OSHA Compliant Chemical Safety Platform</p>
          </div>
        </div>
        <p className="text-sm text-gray-500">No app required • Works with any smartphone • Real-time compliance tracking</p>
      </div>

    </div>
  );

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
            flex-direction: ${layoutMode === 'dual' ? 'row' : 'column'};
            justify-content: center;
            align-items: center;
            background: white !important;
            gap: ${layoutMode === 'dual' ? '1rem' : '0'};
          }
          .poster-content {
            max-width: none !important;
            width: ${layoutMode === 'dual' ? '48%' : '100%'} !important;
            height: ${layoutMode === 'dual' ? '100%' : '100%'} !important;
            ${layoutMode === 'dual' ? 'border-right: 2px dashed #ccc; padding-right: 1rem;' : ''}
          }
          .poster-content:last-child {
            border-right: none;
            padding-right: 0;
            padding-left: 1rem;
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
              <label className="text-sm text-gray-700">Layout:</label>
              <select 
                value={layoutMode} 
                onChange={(e) => setLayoutMode(e.target.value as any)}
                className="border border-gray-300 rounded px-2 py-1 text-sm"
              >
                <option value="single">Single Poster</option>
                <option value="dual">Two Posters (Cut in Half)</option>
              </select>
            </div>

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
      <div className="print-page min-h-screen bg-white flex justify-center items-center p-8">
        <PosterContent />
        {layoutMode === 'dual' && <PosterContent />}
      </div>
    </>
  );
};

export default QRCodePrintPage;
