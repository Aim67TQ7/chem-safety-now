import React, { useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, Shield, AlertTriangle, CheckCircle, Image as ImageIcon } from "lucide-react";
import { SafetyLabel } from './SafetyLabel';
import { extractEnhancedSDSData } from './utils/enhancedSdsDataExtractor';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import { interactionLogger } from '@/services/interactionLogger';
import { useDemoPrintActions } from '@/hooks/useDemoPrintActions';

interface SimplifiedLabelPrinterProps {
  initialProductName?: string;
  initialManufacturer?: string;
  selectedDocument?: any;
}

const SimplifiedLabelPrinter = ({ 
  initialProductName = '', 
  initialManufacturer = '',
  selectedDocument
}: SimplifiedLabelPrinterProps) => {
  const labelRef = useRef<HTMLDivElement>(null);
  const [productId, setProductId] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const { handleDownloadAction } = useDemoPrintActions();
  
  // Extract SDS data automatically
  const sdsData = selectedDocument ? extractEnhancedSDSData(selectedDocument) : null;
  
  // Safety-critical data (read-only from SDS)
  const productName = sdsData?.productName || initialProductName;
  const manufacturer = sdsData?.manufacturer || initialManufacturer;
  const casNumber = sdsData?.casNumber || '';
  const signalWord = sdsData?.signalWord || '';
  const chemicalFormula = sdsData?.chemicalFormula || '';
  const chemicalCompound = sdsData?.chemicalCompound || '';
  const hmisHealth = sdsData?.hmisRatings?.health || '2';
  const hmisFlammability = sdsData?.hmisRatings?.flammability || '1';
  const hmisPhysical = sdsData?.hmisRatings?.physical || '0';
  const hmisSpecial = sdsData?.hmisRatings?.special || 'A';
  const selectedPictograms = sdsData?.pictograms || [];
  const selectedHazards = sdsData?.hazardCodes || [];
  const ppeRequirements = sdsData?.ppeRequirements || [];

  const getComplianceStatus = () => {
    if (!selectedDocument) {
      return { 
        status: 'no_document', 
        message: 'No SDS document selected', 
        icon: AlertTriangle, 
        color: 'text-red-600' 
      };
    }

    if (sdsData?.oshaCompliant) {
      return { 
        status: 'osha_compliant', 
        message: 'OSHA Compliant - All safety data automatically extracted', 
        icon: Shield, 
        color: 'text-green-600' 
      };
    }

    if (sdsData?.extractionConfidence && sdsData.extractionConfidence >= 80) {
      return { 
        status: 'high_confidence', 
        message: 'High confidence extraction - Safety data automatically applied', 
        icon: CheckCircle, 
        color: 'text-blue-600' 
      };
    }

    return { 
      status: 'basic', 
      message: 'Basic extraction - Verify safety information manually', 
      icon: AlertTriangle, 
      color: 'text-yellow-600' 
    };
  };

  const downloadPNG = async (resolution: 'standard' | 'high' | 'print') => {
    const canDownload = handleDownloadAction('PNG Download');
    if (!canDownload) return;

    if (!labelRef.current) {
      toast.error('Label not found');
      return;
    }

    if (!productName.trim()) {
      toast.error('Product name is required');
      return;
    }

    setIsDownloading(true);
    
    try {
      const resolutionSettings = {
        standard: { scale: 2, width: 300, height: 225, suffix: 'standard' },
        high: { scale: 4, width: 600, height: 450, suffix: 'high-res' },
        print: { scale: 8, width: 1200, height: 900, suffix: 'print-quality' }
      };

      const settings = resolutionSettings[resolution];
      
      toast.info(`Generating ${resolution} resolution PNG...`);

      const canvas = await html2canvas(labelRef.current, {
        backgroundColor: 'white',
        scale: settings.scale,
        logging: false,
        useCORS: true,
        width: 300,
        height: 225,
        windowWidth: 300,
        windowHeight: 225
      });

      // Create download link
      const link = document.createElement('a');
      link.download = `safety-label-${productName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${settings.suffix}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      // Log the download
      interactionLogger.logLabelGeneration({
        productName,
        manufacturer,
        actionType: 'download',
        labelType: 'png_image',
        hazardCodes: selectedHazards,
        pictograms: selectedPictograms,
        metadata: {
          sdsDocumentId: selectedDocument?.id,
          fileName: link.download,
          resolution: `${settings.width}x${settings.height}`,
          downloadType: 'png'
        }
      });

      toast.success(`${resolution} resolution PNG downloaded successfully`);
    } catch (error) {
      console.error('PNG generation error:', error);
      toast.error('Failed to generate PNG');
    } finally {
      setIsDownloading(false);
    }
  };

  const compliance = getComplianceStatus();
  const ComplianceIcon = compliance.icon;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header with Compliance Status */}
      <div className="flex-shrink-0 p-4 border-b bg-gray-50">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">GHS Safety Label Generator</h3>
            <Alert className="mb-3">
              <ComplianceIcon className={`h-4 w-4 ${compliance.color}`} />
              <AlertDescription className={compliance.color}>
                <strong>{compliance.status.replace(/_/g, ' ').toUpperCase()}:</strong> {compliance.message}
              </AlertDescription>
            </Alert>
            
            {selectedDocument && (
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge variant="outline" className="text-xs">
                  Confidence: {sdsData?.extractionConfidence || 0}%
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Source: {sdsData?.dataSource?.replace(/_/g, ' ') || 'Unknown'}
                </Badge>
                {sdsData?.oshaCompliant && (
                  <Badge className="text-xs bg-green-600 text-white">
                    OSHA Compliant
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 h-full">
          {/* Configuration Panel - Left Side */}
          <div className="space-y-4 overflow-y-auto">
            {/* Safety Information (Read-Only) */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center">
                  <Shield className="w-4 h-4 mr-2" />
                  Safety Information (From SDS)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Safety data is automatically extracted from the SDS document and cannot be modified to ensure compliance.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <Label className="text-xs font-medium text-gray-600">HMIS Health</Label>
                    <div className="bg-gray-100 px-2 py-1 rounded text-center font-bold">
                      {hmisHealth}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-600">HMIS Flammability</Label>
                    <div className="bg-gray-100 px-2 py-1 rounded text-center font-bold">
                      {hmisFlammability}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-600">HMIS Physical</Label>
                    <div className="bg-gray-100 px-2 py-1 rounded text-center font-bold">
                      {hmisPhysical}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-gray-600">HMIS PPE</Label>
                    <div className="bg-gray-100 px-2 py-1 rounded text-center font-bold">
                      {hmisSpecial}
                    </div>
                  </div>
                </div>

                {selectedPictograms.length > 0 && (
                  <div>
                    <Label className="text-xs font-medium text-gray-600 mb-2 block">
                      GHS Pictograms ({selectedPictograms.length})
                    </Label>
                    <div className="flex flex-wrap gap-1">
                      {selectedPictograms.map((pictogram, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {pictogram.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {casNumber && (
                  <div>
                    <Label className="text-xs font-medium text-gray-600">CAS Number</Label>
                    <div className="bg-gray-100 px-2 py-1 rounded text-sm">
                      {casNumber}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Customizable Fields */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Label Customization</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="product-id" className="text-sm font-medium">
                    Product ID (Optional)
                  </Label>
                  <Input
                    id="product-id"
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                    placeholder="Enter product identifier"
                    className="text-sm"
                  />
                </div>

                <Alert>
                  <ImageIcon className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    <strong>Fixed Size:</strong> Labels are generated at 300×225 pixels (4:3 ratio) for universal compatibility.
                    Download different resolutions below for your specific printer needs.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Download Options */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center">
                  <Download className="w-4 h-4 mr-2" />
                  Download PNG Label
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-3">
                  <Button 
                    onClick={() => downloadPNG('standard')} 
                    variant="outline" 
                    className="w-full justify-between" 
                    disabled={isDownloading || !productName.trim()}
                  >
                    <span>Standard (300×225)</span>
                    <span className="text-xs text-gray-500">General use</span>
                  </Button>
                  
                  <Button 
                    onClick={() => downloadPNG('high')} 
                    variant="outline" 
                    className="w-full justify-between"
                    disabled={isDownloading || !productName.trim()}
                  >
                    <span>High-Res (600×450)</span>
                    <span className="text-xs text-gray-500">Screen display</span>
                  </Button>
                  
                  <Button 
                    onClick={() => downloadPNG('print')} 
                    className="w-full justify-between"
                    disabled={isDownloading || !productName.trim()}
                  >
                    <span>Print Quality (1200×900)</span>
                    <span className="text-xs text-gray-500">Professional printing</span>
                  </Button>
                </div>

                <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                  <strong>How to use:</strong><br />
                  1. Download the PNG file<br />
                  2. Import into your label software (Zebra Designer, Avery templates, etc.)<br />
                  3. Resize to fit your label stock<br />
                  4. Print on any printer
                </div>
              </CardContent>
            </Card>

            {/* Document Information */}
            {selectedDocument && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Source Document</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Product:</span> {selectedDocument.product_name}
                  </div>
                  {selectedDocument.manufacturer && (
                    <div>
                      <span className="font-medium">Manufacturer:</span> {selectedDocument.manufacturer}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Extraction Date:</span>{' '}
                    {selectedDocument.ai_extraction_date 
                      ? new Date(selectedDocument.ai_extraction_date).toLocaleDateString()
                      : new Date(selectedDocument.created_at).toLocaleDateString()
                    }
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Label Preview - Right Side */}
          <div className="flex flex-col justify-center items-center space-y-4">
            <Card className="w-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-center">Label Preview (300×225px)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center space-y-4">
                  <div 
                    ref={labelRef}
                    className="border-2 border-gray-300 rounded p-2 bg-white"
                    style={{ 
                      width: 'fit-content',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                    }}
                  >
                    <SafetyLabel
                      productName={productName}
                      manufacturer={manufacturer}
                      chemicalFormula={chemicalFormula}
                      chemicalCompound={chemicalCompound}
                      casNumber={casNumber}
                      productId={productId}
                      hmisHealth={hmisHealth}
                      hmisFlammability={hmisFlammability}
                      hmisPhysical={hmisPhysical}
                      hmisSpecial={hmisSpecial}
                      selectedPictograms={selectedPictograms}
                      selectedHazards={selectedHazards}
                      ppeRequirements={ppeRequirements}
                      labelWidth={300}
                      labelHeight={225}
                      signalWord={signalWord}
                    />
                  </div>
                  
                  <div className="text-center space-y-2">
                    <p className="text-sm text-gray-600">
                      Universal 300×225 pixel label - perfect 4:3 aspect ratio
                    </p>
                    <p className="text-xs text-gray-500">
                      Compatible with all label printing software and printer types
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimplifiedLabelPrinter;