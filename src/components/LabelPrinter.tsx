
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Printer, Download, AlertTriangle, CheckCircle, Shield } from "lucide-react";
import { SafetyLabel } from './SafetyLabel';
import { extractEnhancedSDSData } from './utils/enhancedSdsDataExtractor';
import { toast } from 'sonner';

interface LabelPrinterProps {
  initialProductName?: string;
  initialManufacturer?: string;
  selectedDocument?: any;
}

const LabelPrinter = ({ 
  initialProductName = '', 
  initialManufacturer = '',
  selectedDocument
}: LabelPrinterProps) => {
  // Extract SDS data automatically
  const sdsData = selectedDocument ? extractEnhancedSDSData(selectedDocument) : null;
  
  // State for label customization (non-safety critical fields only)
  const [labelWidth, setLabelWidth] = useState(288);
  const [labelHeight, setLabelHeight] = useState(192);
  const [productId, setProductId] = useState(sdsData?.productId || '');
  const [labelPrintDate] = useState(sdsData?.labelPrintDate || new Date().toISOString().split('T')[0]);

  // Safety-critical data (read-only from SDS)
  const productName = sdsData?.productName || initialProductName;
  const manufacturer = sdsData?.manufacturer || initialManufacturer;
  const casNumber = sdsData?.casNumber || '';
  const chemicalFormula = sdsData?.chemicalFormula || '';
  const chemicalCompound = sdsData?.chemicalCompound || '';
  const hmisHealth = sdsData?.hmisRatings?.health || '2';
  const hmisFlammability = sdsData?.hmisRatings?.flammability || '1';
  const hmisPhysical = sdsData?.hmisRatings?.physical || '0';
  const hmisSpecial = sdsData?.hmisRatings?.special || 'A';
  const selectedPictograms = sdsData?.pictograms || [];
  const selectedHazards = sdsData?.hazardCodes || [];
  const ppeRequirements = sdsData?.ppeRequirements || [];

  // Update productId when SDS data changes
  useEffect(() => {
    if (sdsData?.productId && !productId) {
      setProductId(sdsData.productId);
    }
  }, [sdsData?.productId, productId]);

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

  const handlePrint = () => {
    window.print();
    toast.success('Label sent to printer');
  };

  const handleDownloadPDF = () => {
    // Create a new window with just the label for PDF generation
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const labelElement = document.getElementById('safety-label-preview');
      if (labelElement) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Safety Label - ${productName}</title>
              <style>
                body { margin: 0; padding: 20px; font-family: monospace; }
                @media print { body { margin: 0; padding: 0; } }
              </style>
            </head>
            <body>
              ${labelElement.outerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
    toast.success('Label PDF generated');
  };

  const compliance = getComplianceStatus();
  const ComplianceIcon = compliance.icon;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header with Compliance Status */}
      <div className="flex-shrink-0 p-4 border-b bg-gray-50">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">GHS Secondary Container Label</h3>
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
          
          <div className="flex gap-2 ml-4">
            <Button onClick={handlePrint} size="sm" className="text-xs">
              <Printer className="w-3 h-3 mr-1" />
              Print
            </Button>
            <Button onClick={handleDownloadPDF} variant="outline" size="sm" className="text-xs">
              <Download className="w-3 h-3 mr-1" />
              PDF
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 h-full">
          {/* Label Preview */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Label Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center space-y-4">
                  <div 
                    id="safety-label-preview" 
                    className="border-2 border-dashed border-gray-300 p-4 bg-white"
                    style={{ 
                      width: 'fit-content',
                      transform: 'scale(1.2)',
                      transformOrigin: 'center'
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
                      labelWidth={labelWidth}
                      labelHeight={labelHeight}
                    />
                  </div>
                  
                  <div className="text-center text-sm text-gray-600">
                    <p>Size: {labelWidth} × {labelHeight} pixels</p>
                    <p className="text-xs mt-1">Scale: 120% (for preview)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Configuration Panel */}
          <div className="space-y-4">
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

                <Separator />

                <div className="space-y-3">
                  <Label className="text-sm font-medium">Label Dimensions (pixels)</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="width" className="text-xs text-gray-600">Width</Label>
                      <Input
                        id="width"
                        type="number"
                        value={labelWidth}
                        onChange={(e) => setLabelWidth(Number(e.target.value))}
                        min="200"
                        max="500"
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="height" className="text-xs text-gray-600">Height</Label>
                      <Input
                        id="height"
                        type="number"
                        value={labelHeight}
                        onChange={(e) => setLabelHeight(Number(e.target.value))}
                        min="150"
                        max="400"
                        className="text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  <strong>Standard Sizes:</strong><br />
                  • 2" × 1.33" = 288 × 192px<br />
                  • 3" × 2" = 432 × 288px<br />
                  • 4" × 2.67" = 576 × 384px
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
                  <div>
                    <span className="font-medium">Print Date:</span> {labelPrintDate}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LabelPrinter;
