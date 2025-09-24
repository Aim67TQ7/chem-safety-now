import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, AlertTriangle, CheckCircle, Shield, Image as ImageIcon, Printer } from "lucide-react";
import { SafetyLabel } from './SafetyLabel';
import { extractEnhancedSDSData } from './utils/enhancedSdsDataExtractor';
import { ZebraPrintAdapter, ZebraPrintOptions } from './ZebraPrinterIntegration';
import { useZebraPrintHandler } from './ZebraPrinterHandlerImplementation';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import { useDemoPrintActions } from '@/hooks/useDemoPrintActions';

interface UniversalLabelPrinterProps {
  initialProductName?: string;
  initialManufacturer?: string;
  selectedDocument?: any;
}

const UniversalLabelPrinter = ({ 
  initialProductName = '', 
  initialManufacturer = '',
  selectedDocument
}: UniversalLabelPrinterProps) => {
  const labelRef = useRef<HTMLDivElement>(null);
  const sdsData = selectedDocument ? extractEnhancedSDSData(selectedDocument) : null;
  const { handleDownloadAction } = useDemoPrintActions();
  
  // State for label customization
  const [productId, setProductId] = useState(sdsData?.productId || '');
  const [labelWidth, setLabelWidth] = useState(300);
  const [labelHeight, setLabelHeight] = useState(225);
  
  // Initialize Zebra print handler
  const { handlePrint: handleZebraPrint, isPrinting, isAvailable } = useZebraPrintHandler({
    labelRef,
    onPrintComplete: () => toast.success('Print job sent to Zebra printer'),
    onPrintError: (error) => toast.error(`Print failed: ${error}`)
  });
  
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

    if (sdsData?.requiresManualReview) {
      return { 
        status: 'manual_review', 
        message: 'Manual Review Required - Use with caution for labeling', 
        icon: AlertTriangle, 
        color: 'text-orange-600' 
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

  const captureHighResolutionPNG = async (scale: number = 1, filename: string) => {
    if (!labelRef.current) {
      toast.error('Label not found for capture');
      return;
    }

    if (!productName.trim()) {
      toast.error('Product name is required');
      return;
    }

    const canDownload = handleDownloadAction(`PNG Download (${scale}x)`);
    if (!canDownload) return;

    try {
      toast.info(`Generating ${scale}x resolution PNG...`);

      const target = labelRef.current;
      
      // Preserve existing styles and set dimensions properly
      const originalWidth = target.style.width;
      const originalHeight = target.style.height;
      
      target.style.width = `${labelWidth}px`;
      target.style.height = `${labelHeight}px`;

      // Enhanced html2canvas options for perfect quality
      const canvas = await html2canvas(target, {
        backgroundColor: '#ffffff',
        scale: scale,
        logging: false,
        useCORS: true,
        allowTaint: false,
        width: labelWidth,
        height: labelHeight,
        windowWidth: labelWidth,
        windowHeight: labelHeight,
        // High quality rendering options
        foreignObjectRendering: false,
        imageTimeout: 15000,
        removeContainer: true
      });

      // Restore original styles
      target.style.width = originalWidth;
      target.style.height = originalHeight;

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (!blob) {
          toast.error('Failed to generate image');
          return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast.success(`${scale}x PNG downloaded successfully`);
      }, 'image/png', 1.0);

    } catch (error) {
      console.error('PNG generation error:', error);
      toast.error('Failed to generate PNG');
    }
  };

  const downloadOptions = [
    {
      label: 'Draft Quality',
      description: `${labelWidth}×${labelHeight} - Quick preview`,
      scale: 1,
      variant: 'outline' as const,
      filename: `safety-label-draft-${labelWidth}x${labelHeight}-${productName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`
    },
    {
      label: 'Standard Print',
      description: `${labelWidth * 2}×${labelHeight * 2} - Most printers`,
      scale: 2,
      variant: 'outline' as const,
      filename: `safety-label-standard-${labelWidth}x${labelHeight}-${productName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`
    },
    {
      label: 'High Quality',
      description: `${labelWidth * 4}×${labelHeight * 4} - Professional`,
      scale: 4,
      variant: 'default' as const,
      filename: `safety-label-hq-${labelWidth}x${labelHeight}-${productName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`
    },
    {
      label: 'Maximum',
      description: `${labelWidth * 8}×${labelHeight * 8} - Ultra HD`,
      scale: 8,
      variant: 'outline' as const,
      filename: `safety-label-max-${labelWidth}x${labelHeight}-${productName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`
    }
  ];

  // Handle Zebra print request
  const handleZebraPrintRequest = (options: ZebraPrintOptions) => {
    handleZebraPrint(options);
  };

  // Preset label sizes (pixels)
  const presetSizes = [
    { name: '2" × 1.33"', width: 288, height: 192 },
    { name: '3" × 2"', width: 432, height: 288 },
    { name: '4" × 2.67"', width: 576, height: 384 },
  ];

  const handlePresetSize = (width: number, height: number) => {
    setLabelWidth(width);
    setLabelHeight(height);
  };

  const compliance = getComplianceStatus();
  const ComplianceIcon = compliance.icon;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header with Compliance Status */}
      <div className="flex-shrink-0 p-4 border-b bg-gray-50">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">Universal GHS Label Printer</h3>
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

            {/* Label Customization */}
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

                <Separator />

                <div className="space-y-3">
                  <Label className="text-sm font-medium">Label Dimensions (pixels)</Label>
                  
                  {/* Preset Size Buttons */}
                  <div className="grid grid-cols-3 gap-2">
                    {presetSizes.map((preset) => (
                      <Button
                        key={preset.name}
                        variant="outline"
                        size="sm"
                        onClick={() => handlePresetSize(preset.width, preset.height)}
                        className="text-xs p-2 h-auto"
                      >
                        {preset.name}
                      </Button>
                    ))}
                  </div>
                  
                  {/* Custom Size Inputs */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="width" className="text-xs text-gray-600">Width (px)</Label>
                      <Input
                        id="width"
                        type="number"
                        value={labelWidth}
                        onChange={(e) => setLabelWidth(Number(e.target.value))}
                        min="200"
                        max="800"
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="height" className="text-xs text-gray-600">Height (px)</Label>
                      <Input
                        id="height"
                        type="number"
                        value={labelHeight}
                        onChange={(e) => setLabelHeight(Number(e.target.value))}
                        min="150"
                        max="600"
                        className="text-sm"
                      />
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                    <strong>Physical Size:</strong> ~{(labelWidth / 144).toFixed(2)}" × {(labelHeight / 144).toFixed(2)}" @ 144 DPI<br />
                    <strong>Aspect Ratio:</strong> {(labelWidth / labelHeight).toFixed(2)}:1
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Printing and Download Options */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center">
                  <Printer className="w-4 h-4 mr-2" />
                  Printing & Download Options
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="png" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="png">PNG Download</TabsTrigger>
                    <TabsTrigger value="zebra">Zebra Printer</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="png" className="space-y-3 mt-4">
                    <div className="grid grid-cols-1 gap-2">
                      {downloadOptions.map((option) => (
                        <Button
                          key={option.scale}
                          variant={option.variant}
                          size="sm"
                          onClick={() => captureHighResolutionPNG(option.scale, option.filename)}
                          className="justify-start"
                        >
                          <Download className="w-3 h-3 mr-2" />
                          <div className="text-left flex-1">
                            <div className="font-medium">{option.label}</div>
                            <div className="text-xs opacity-75">{option.description}</div>
                          </div>
                        </Button>
                      ))}
                    </div>
                    
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        <strong>Universal Compatibility:</strong> PNG files work with any label software, 
                        printer driver, or professional print service.
                      </AlertDescription>
                    </Alert>
                  </TabsContent>
                  
                  <TabsContent value="zebra" className="mt-4">
                    {!isAvailable && (
                      <Alert className="mb-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Zebra Browser Print utility not detected. Please install it for direct thermal printing.
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    <ZebraPrintAdapter
                      onPrint={handleZebraPrintRequest}
                      defaultLabelWidth={labelWidth / 203} // Convert pixels to inches (203 DPI)
                      defaultLabelHeight={labelHeight / 203}
                      showAdvancedOptions={false}
                    />
                  </TabsContent>
                </Tabs>
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
                <CardTitle className="text-lg text-center">Perfect Preview (What You Print)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center space-y-6">
                  <div className="border-2 border-dashed border-gray-300 p-4 rounded-lg bg-gray-50">
                    <div ref={labelRef} className="bg-white rounded shadow-sm">
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
                        signalWord={signalWord}
                        labelWidth={labelWidth}
                        labelHeight={labelHeight}
                      />
                    </div>
                  </div>
                  
                  <Alert className="w-full">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      <strong>What you see is exactly what prints.</strong> Current size: {labelWidth}×{labelHeight}px 
                      (~{(labelWidth / 144).toFixed(2)}" × {(labelHeight / 144).toFixed(2)}"). Adjust dimensions above 
                      and download PNG files for any printer.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UniversalLabelPrinter;