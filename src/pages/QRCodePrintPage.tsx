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
  facility_name: string | null;
  contact_name: string | null;
  email: string | null;
  address: string | null;
  logo_url?: string;
  created_at: string;
}

const QRCodePrintPage = () => {
  const { facilitySlug } = useParams();
  const [facilityData, setFacilityData] = useState<FacilityData | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [posterSize, setPosterSize] = useState<'letter' | 'a4'>('letter');
  const [layoutMode, setLayoutMode] = useState<'single' | 'dual' | 'stacked'>('single');
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
      const facilityUrl = `https://chemlabel-gpt.com/facility/${facilitySlug}`;
      
      QRCodeLib.toDataURL(facilityUrl, {
        width: 1200, // Increased from 400 to 1200 for 300x300px display
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
      const facilityDisplayName = facilityData.facility_name || 'Facility';
      const link = document.createElement('a');
      link.download = `${facilityDisplayName}-Safety-Poster-${layoutMode}.png`;
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

  const facilityDisplayName = facilityData.facility_name || 'Facility';

  const PosterContent = () => (
    <div className="bg-white border-2 border-gray-300 rounded-lg p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Chemical Safety Portal
        </h1>
        <p className="text-sm text-gray-600">OSHA Compliant • Instant Access • Mobile Ready</p>
      </div>

      {/* Main Content Box */}
      <div className="bg-white border-2 border-gray-800 rounded-lg p-6">
        {/* Company name */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {facilityDisplayName}
          </h2>
        </div>

        {/* QR Code with logo overlay - Much Larger */}
        <div className="text-center mb-6">
          <div className="relative inline-block">
            {qrCodeDataUrl && (
              <div className="relative">
                <img 
                  src={qrCodeDataUrl} 
                  alt="Facility QR Code"
                  className="w-80 h-80 mx-auto border-2 border-gray-800 rounded" // Increased from w-32 h-32 to w-80 h-80 (320px)
                  style={{ width: '300px', height: '300px' }} // Force exact 300x300px size
                />
                {/* Company logo overlay */}
                {facilityData.logo_url && (
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-2 rounded border border-gray-800">
                    <img 
                      src={facilityData.logo_url} 
                      alt={`${facilityDisplayName} Logo`}
                      className="w-12 h-12 object-contain" // Increased logo size proportionally
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="text-center mb-4">
          <h3 className="text-lg font-bold text-gray-900 mb-3">
            Scan for Instant Safety Access
          </h3>
          
          <div className="bg-gray-100 border border-gray-300 rounded p-4 text-sm">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="bg-gray-800 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mx-auto mb-2">1</div>
                <p className="font-medium text-gray-900">Open Camera</p>
                <p className="text-gray-700">Use phone's camera</p>
              </div>
              <div className="text-center">
                <div className="bg-gray-800 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mx-auto mb-2">2</div>
                <p className="font-medium text-gray-900">Point & Scan</p>
                <p className="text-gray-700">Aim at QR code</p>
              </div>
              <div className="text-center">
                <div className="bg-gray-800 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mx-auto mb-2">3</div>
                <p className="font-medium text-gray-900">Access Data</p>
                <p className="text-gray-700">Tap to view info</p>
              </div>
            </div>
          </div>
        </div>

        {/* Facility Info */}
        {(facilityData.address || facilityData.contact_name || facilityData.email) && (
          <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
            <h4 className="text-sm font-bold text-blue-900 mb-2">Facility Information</h4>
            <div className="space-y-1 text-sm text-blue-800">
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

        {/* ChemLabel-GPT branding */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <img 
              src="/lovable-uploads/7cbd0a20-15f0-43f7-9877-126cab0c631c.png" 
              alt="ChemLabel-GPT Logo" 
              className="w-4 h-4 object-contain"
            />
            <p className="text-sm text-gray-800 font-bold">ChemLabel-GPT</p>
          </div>
          <p className="text-sm text-gray-500">No app required • Works with any smartphone</p>
        </div>
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
            gap: ${layoutMode === 'dual' ? '1rem' : layoutMode === 'stacked' ? '1rem' : '0'};
            padding: 0.5in;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .poster-wrapper {
            width: ${layoutMode === 'dual' ? '48%' : '100%'} !important;
            height: ${layoutMode === 'stacked' ? '45%' : 'auto'} !important;
            ${layoutMode === 'dual' ? 'border-right: 2px dashed #ccc; padding-right: 0.5rem;' : ''}
            ${layoutMode === 'stacked' ? 'border-bottom: 2px dashed #ccc; padding-bottom: 0.5rem; margin-bottom: 0.5rem;' : ''}
          }
          .poster-wrapper:last-child {
            ${layoutMode === 'dual' ? 'border-right: none; padding-right: 0; padding-left: 0.5rem;' : ''}
            ${layoutMode === 'stacked' ? 'border-bottom: none; padding-bottom: 0; margin-bottom: 0;' : ''}
          }
          /* Ensure QR code prints at full size */
          img[alt="Facility QR Code"] {
            width: 300px !important;
            height: 300px !important;
            max-width: 300px !important;
            max-height: 300px !important;
          }
        }
        @page {
          size: ${posterSize === 'letter' ? 'letter' : 'A4'} ${layoutMode === 'dual' ? 'landscape' : 'portrait'};
          margin: 0.3in;
        }
      `}</style>

      {/* Screen controls */}
      <div className="no-print fixed top-4 left-4 right-4 bg-white border border-gray-300 rounded-lg p-4 z-10 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Print Preview</h2>
            <p className="text-sm text-gray-600">Professional safety poster for {facilityDisplayName}</p>
            <p className="text-xs text-green-600 font-medium">QR Code: 300x300px for optimal scanning</p>
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
                <option value="dual">Two Side-by-Side</option>
                <option value="stacked">Two Stacked</option>
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

      {/* Print content with larger QR code */}
      <div className={`print-page min-h-screen bg-white flex justify-center items-center p-8 ${
        layoutMode === 'dual' ? 'flex-row' : layoutMode === 'stacked' ? 'flex-col' : 'flex-col'
      } mx-auto gap-4`}>
        <div className="poster-wrapper">
          <PosterContent />
        </div>
        {(layoutMode === 'dual' || layoutMode === 'stacked') && (
          <div className="poster-wrapper">
            <PosterContent />
          </div>
        )}
      </div>
    </>
  );
};

export default QRCodePrintPage;
