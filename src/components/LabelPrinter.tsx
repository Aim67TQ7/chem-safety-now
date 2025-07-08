
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
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { PrintAlignmentFix } from './PrintPreviewWithAlignmentFixes';
import { AuditService } from '@/services/auditService';
import { interactionLogger } from '@/services/interactionLogger';
import { useDemoPrintActions } from '@/hooks/useDemoPrintActions';

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
  const { handlePrintAction, handleDownloadAction } = useDemoPrintActions();
  
  // State for label customization (non-safety critical fields only)
  const [labelWidth, setLabelWidth] = useState(288);
  const [labelHeight, setLabelHeight] = useState(192);
  const [productId, setProductId] = useState(sdsData?.productId || '');
  const [labelPrintDate] = useState(sdsData?.labelPrintDate || new Date().toISOString().split('T')[0]);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

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

  const handlePrintPreview = () => {
    if (!productName.trim()) {
      toast.error('Product name is required');
      return;
    }
    
    const canShowPreview = handlePrintAction('Print Preview', () => {
      setShowPrintPreview(true);
    });
    
    if (canShowPreview) {
      // Log label preview generation for real facilities
      interactionLogger.logLabelGeneration({
        productName,
        manufacturer,
        actionType: 'generate',
        labelType: 'secondary_container',
        hazardCodes: selectedHazards,
        pictograms: selectedPictograms,
        metadata: {
          sdsDocumentId: selectedDocument?.id,
          labelDimensions: `${labelWidth}x${labelHeight}`
        }
      });
    }
  };

  const handleDownloadPDF = async () => {
    const canDownload = handleDownloadAction('PDF Poster Download');
    if (!canDownload) return;
    
    const labelElement = document.getElementById('safety-label-preview');
    if (!labelElement) {
      toast.error('Label element not found');
      return;
    }

    try {
      toast.info('Generating PDF...');
      
      // Create a poster-style container with the label
      const posterContainer = document.createElement('div');
      posterContainer.style.cssText = `
        width: 816px;
        height: 1056px;
        background: white;
        padding: 60px;
        box-sizing: border-box;
        font-family: Arial, sans-serif;
        display: flex;
        flex-direction: column;
        align-items: center;
        position: absolute;
        left: -10000px;
        top: 0;
      `;

      // Add title
      const title = document.createElement('h1');
      title.textContent = 'CHEMICAL SAFETY LABEL';
      title.style.cssText = `
        font-size: 32px;
        font-weight: bold;
        margin: 0 0 40px 0;
        text-align: center;
        color: #000;
        letter-spacing: 2px;
      `;
      posterContainer.appendChild(title);

      // Clone and scale the label
      const labelClone = labelElement.cloneNode(true) as HTMLElement;
      labelClone.style.cssText = `
        transform: scale(2.5);
        transform-origin: center center;
        margin: 60px 0;
      `;
      posterContainer.appendChild(labelClone);

      // Add facility info
      const facilityInfo = document.createElement('div');
      facilityInfo.style.cssText = `
        margin-top: 60px;
        text-align: center;
        font-size: 16px;
        color: #333;
      `;
      facilityInfo.innerHTML = `
        <div style="margin-bottom: 10px;"><strong>Generated by:</strong> ${selectedDocument?.manufacturer || 'Chemical Safety System'}</div>
        <div><strong>Date:</strong> ${new Date().toLocaleDateString()}</div>
      `;
      posterContainer.appendChild(facilityInfo);

      // Add to DOM temporarily
      document.body.appendChild(posterContainer);

      // Capture the poster as canvas
      const canvas = await html2canvas(posterContainer, {
        backgroundColor: 'white',
        scale: 2,
        logging: false,
        useCORS: true,
        width: 816,
        height: 1056
      });

      // Remove from DOM
      document.body.removeChild(posterContainer);

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'letter'
      });

      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, 612, 792);

      // Download the PDF
      const fileName = `safety-label-poster-${productName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
      pdf.save(fileName);
      
      // Log label download for audit trail
      interactionLogger.logLabelGeneration({
        productName,
        manufacturer,
        actionType: 'download',
        labelType: 'poster_pdf',
        hazardCodes: selectedHazards,
        pictograms: selectedPictograms,
        metadata: {
          sdsDocumentId: selectedDocument?.id,
          fileName,
          downloadType: 'poster_pdf'
        }
      });
      
      toast.success('Poster PDF downloaded successfully');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF');
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
            <Button onClick={handlePrintPreview} size="sm" className="text-xs">
              <Printer className="w-3 h-3 mr-1" />
              Preview & Print
            </Button>
            <Button onClick={handleDownloadPDF} variant="outline" size="sm" className="text-xs">
              <Download className="w-3 h-3 mr-1" />
              Poster Download
            </Button>
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

          {/* Label Preview - Right Side */}
          <div className="flex flex-col justify-center items-center space-y-4">
            <Card className="w-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-center">Label Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center space-y-6">
                  <div 
                    id="safety-label-preview" 
                    className="border-2 border-dashed border-gray-300 p-6 bg-white shadow-lg"
                    style={{ 
                      width: 'fit-content',
                      transform: 'scale(1.5)',
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
                      signalWord={signalWord}
                    />
                  </div>
                  
                  <div className="text-center text-sm text-gray-600">
                    <p className="font-medium">Actual Size: {labelWidth} × {labelHeight} pixels</p>
                    <p className="text-xs mt-1">Preview Scale: 150% (for visibility)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Print Preview with Alignment Fixes */}
      {showPrintPreview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-7xl w-full max-h-[95vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Print Preview - {productName}</h2>
                <Button variant="outline" onClick={() => setShowPrintPreview(false)}>
                  Close
                </Button>
              </div>
              <PrintAlignmentFix
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
                signalWord={signalWord}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );

};

export default LabelPrinter;
