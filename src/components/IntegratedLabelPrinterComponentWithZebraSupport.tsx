import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Printer, Download, Desktop } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

import { SafetyLabel } from './SafetyLabel';
import { PrintPreview } from './PrintPreview';
import { ZebraPrintAdapter, ZebraPrintOptions } from './ZebraPrintAdapter';
import { useZebraPrintHandler } from './ZebraPrintHandler';

interface LabelPrinterProps {
  productName: string;
  manufacturer?: string;
  chemicalFormula?: string;
  chemicalCompound?: string;
  casNumber?: string;
  productId?: string;
  hmisHealth: string;
  hmisFlammability: string;
  hmisPhysical: string;
  hmisSpecial?: string;
  selectedPictograms: string[];
  selectedHazards: string[];
  ppeRequirements: string[];
  labelWidth?: number;
  labelHeight?: number;
}

export const IntegratedLabelPrinter: React.FC<LabelPrinterProps> = ({
  productName,
  manufacturer,
  chemicalFormula,
  chemicalCompound,
  casNumber,
  productId,
  hmisHealth,
  hmisFlammability,
  hmisPhysical,
  hmisSpecial,
  selectedPictograms,
  selectedHazards,
  ppeRequirements,
  labelWidth = 288,
  labelHeight = 192
}) => {
  const [activeTab, setActiveTab] = useState<string>('preview');
  const [physicalWidth, setPhysicalWidth] = useState<number>(2); // in inches
  const [physicalHeight, setPhysicalHeight] = useState<number>(1.33); // in inches
  const labelRef = useRef<HTMLDivElement>(null);
  
  // Initialize Zebra print handler
  const { handlePrint: handleZebraPrint, isPrinting, isAvailable } = useZebraPrintHandler({
    labelRef,
    onPrintComplete: () => toast.success('Print job sent to Zebra printer'),
    onPrintError: (error) => toast.error(`Print error: ${error.message}`)
  });
  
  // Calculate optimal physical dimensions based on the pixel dimensions
  useEffect(() => {
    // Standard DPI for Zebra thermal printers is 203 DPI
    const standardDPI = 203;
    const calculatedWidth = labelWidth / standardDPI;
    const calculatedHeight = labelHeight / standardDPI;
    
    // Round to nearest 0.25" for standard label sizes
    const roundToQuarter = (num: number) => Math.round(num * 4) / 4;
    setPhysicalWidth(roundToQuarter(calculatedWidth));
    setPhysicalHeight(roundToQuarter(calculatedHeight));
  }, [labelWidth, labelHeight]);
  
  // Standard print to desktop printer
  const handleDesktopPrint = async () => {
    if (!labelRef.current) {
      toast.error('Label element not found');
      return;
    }
    
    try {
      toast.info('Preparing print...');
      
      // Capture the label at high resolution
      const canvas = await html2canvas(labelRef.current, {
        backgroundColor: 'white',
        scale: 4, // Higher resolution for better print quality
        logging: false,
        useCORS: true,
      });
      
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Please allow pop-ups to print the label');
      }
      
      const imgData = canvas.toDataURL('image/png');
      
      // Write HTML with proper print dimensions
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Safety Label - ${productName}</title>
            <style>
              @page {
                size: ${physicalWidth}in ${physicalHeight}in;
                margin: 0;
              }
              body {
                margin: 0;
                padding: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                background: white;
              }
              img {
                width: ${physicalWidth}in;
                height: ${physicalHeight}in;
                object-fit: contain;
              }
              @media print {
                img {
                  width: 100%;
                  height: 100%;
                }
              }
            </style>
          </head>
          <body>
            <img src="${imgData}" alt="Safety Label" />
            <script>
              // Auto print when ready
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                  setTimeout(function() {
                    window.close();
                  }, 500);
                }, 200);
              };
            </script>
          </body>
        </html>
      `);
      
      printWindow.document.close();
      toast.success('Print prepared successfully');
    } catch (error) {
      console.error('Print error:', error);
      toast.error(`Print error: ${(error as Error).message}`);
    }
  };
  
  // PDF download
  const handleDownloadPDF = async () => {
    if (!labelRef.current) {
      toast.error('Label element not found');
      return;
    }
    
    try {
      toast.info('Generating PDF...');
      
      // Capture the label at high resolution
      const canvas = await html2canvas(labelRef.current, {
        backgroundColor: 'white',
        scale: 4, // Higher resolution for better PDF quality
        logging: false,
        useCORS: true,
      });
      
      // Convert to PDF with exact physical dimensions
      const pdf = new jsPDF({
        orientation: physicalWidth > physicalHeight ? 'landscape' : 'portrait',
        unit: 'in',
        format: [physicalWidth, physicalHeight]
      });
      
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, physicalWidth, physicalHeight);
      
      // Download the PDF
      pdf.save(`safety-label-${productName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error(`PDF error: ${(error as Error).message}`);
    }
  };
  
  // Handle Zebra print options
  const handleZebraPrintRequest = (options: ZebraPrintOptions) => {
    handleZebraPrint(options);
  };
  
  return (
    <div className="w-full flex flex-col space-y-4">
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-500" />
            GHS Secondary Container Label
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="mb-3 bg-blue-50 text-blue-800 border-blue-200">
            <AlertDescription>
              This label contains safety information required by OSHA for secondary chemical containers.
              Print it at the exact specified dimensions for compliance.
            </AlertDescription>
          </Alert>
          
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="outline">
              Size: {physicalWidth}" × {physicalHeight}"
            </Badge>
            <Badge variant="outline">
              Resolution: {labelWidth} × {labelHeight}px
            </Badge>
            <Badge variant="outline">
              DPI: {Math.round(labelWidth / physicalWidth)}
            </Badge>
          </div>
          
          <div ref={labelRef} className="mb-6 mx-auto" style={{ width: 'fit-content' }}>
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
        </CardContent>
      </Card>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="preview">
            <Printer className="h-4 w-4 mr-2" />
            Desktop Printer
          </TabsTrigger>
          <TabsTrigger value="zebra">
            <Desktop className="h-4 w-4 mr-2" />
            Zebra Thermal
          </TabsTrigger>
          <TabsTrigger value="download">
            <Download className="h-4 w-4 mr-2" />
            Download
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="preview" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Desktop Printer Options</CardTitle>
            </CardHeader>
            <CardContent>
              <PrintPreview
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
                physicalWidth={physicalWidth}
                physicalHeight={physicalHeight}
              />
              
              <div className="mt-4">
                <Button 
                  onClick={handleDesktopPrint} 
                  className="w-full"
                  size="lg"
                >
                  <Printer className="mr-2 h-4 w-4" /> 
                  Print to Desktop Printer
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="zebra" className="mt-4">
          <ZebraPrintAdapter
            onPrint={handleZebraPrintRequest}
            defaultLabelWidth={physicalWidth}
            defaultLabelHeight={physicalHeight}
            showAdvancedOptions={true}
          />
          
          {!isAvailable && (
            <Alert className="mt-4 bg-yellow-50 border-yellow-200">
              <AlertDescription className="text-yellow-800">
                <strong>Zebra Browser Print not detected.</strong> For actual thermal printing, 
                install the Zebra Browser Print utility from the 
                <a 
                  href="https://www.zebra.com/us/en/support-downloads/printer-software/printer-setup-utilities.html" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline mx-1"
                >
                  Zebra website
                </a>
                and connect your printer.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
        
        <TabsContent value="download" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Download Options</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="p-4 border rounded-md">
                  <h3 className="text-lg font-medium mb-2">PDF Document</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Download the label as a PDF document with exact physical dimensions for printing.
                  </p>
                  <Button 
                    onClick={handleDownloadPDF} 
                    className="w-full"
                  >
                    <Download className="mr-2 h-4 w-4" /> 
                    Download PDF
                  </Button>
                </div>
                
                <div className="p-4 border rounded-md">
                  <h3 className="text-lg font-medium mb-2">Image Export</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Download the label as a high-resolution PNG image.
                  </p>
                  <Button 
                    onClick={async () => {
                      if (!labelRef.current) return;
                      
                      try {
                        const canvas = await html2canvas(labelRef.current, {
                          backgroundColor: 'white',
                          scale: 4,
                          logging: false,
                          useCORS: true,
                        });
                        
                        const link = document.createElement('a');
                        link.download = `safety-label-${productName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
                        link.href = canvas.toDataURL('image/png');
                        link.click();
                        
                        toast.success('PNG image downloaded successfully');
                      } catch (error) {
                        toast.error(`Image export error: ${(error as Error).message}`);
                      }
                    }} 
                    variant="outline"
                    className="w-full"
                  >
                    <Download className="mr-2 h-4 w-4" /> 
                    Download PNG
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
