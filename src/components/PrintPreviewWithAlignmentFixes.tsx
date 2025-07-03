import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Printer, Download, Grid2X2, AlertTriangle, ZoomIn, ZoomOut } from "lucide-react";
import { useImprovedPrintHandler } from './ImprovedPrintHandler';
import { SafetyLabel } from './SafetyLabel';

interface PrintAlignmentFixProps {
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
  signalWord?: string;
}

export const PrintAlignmentFix: React.FC<PrintAlignmentFixProps> = ({
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
  labelHeight = 192,
  signalWord
}) => {
  const [activeTab, setActiveTab] = useState<string>('preview');
  const [zoom, setZoom] = useState<number>(1.5);
  const [rows, setRows] = useState<number>(3);
  const [columns, setColumns] = useState<number>(3);
  const [margins, setMargins] = useState<number>(0.125);
  const [selectedPaperSize, setSelectedPaperSize] = useState<string>('letter');
  
  // Convert pixel dimensions to physical inches (assuming 96 DPI for screen)
  const physicalWidth = labelWidth / 96;
  const physicalHeight = labelHeight / 96;
  
  // Reference to the actual label element for capturing
  const labelRef = useRef<HTMLDivElement>(null);
  
  // Use the improved print handler
  const { 
    printToDesktop, 
    downloadPDF,
    createTiledPDF,
    printWithSystemDialog
  } = useImprovedPrintHandler({
    labelRef,
    productName,
    physicalWidth,
    physicalHeight
  });
  
  // Common paper sizes in inches
  const paperSizes = {
    'letter': { width: 8.5, height: 11, name: 'Letter (8.5" × 11")' },
    'legal': { width: 8.5, height: 14, name: 'Legal (8.5" × 14")' },
    'a4': { width: 8.27, height: 11.69, name: 'A4 (8.27" × 11.69")' },
    'a5': { width: 5.83, height: 8.27, name: 'A5 (5.83" × 8.27")' },
  };
  
  // Calculate max rows and columns for current paper size
  const getMaxRowsColumns = () => {
    const paper = paperSizes[selectedPaperSize as keyof typeof paperSizes];
    const printableWidth = paper.width - (margins * 2);
    const printableHeight = paper.height - (margins * 2);
    
    const maxColumns = Math.floor(printableWidth / (physicalWidth + margins));
    const maxRows = Math.floor(printableHeight / (physicalHeight + margins));
    
    return { maxRows, maxColumns };
  };
  
  const { maxRows, maxColumns } = getMaxRowsColumns();
  
  return (
    <div className="w-full flex flex-col space-y-4">
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Safety Label Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">
                Size: {physicalWidth.toFixed(2)}" × {physicalHeight.toFixed(2)}"
              </Badge>
              <Badge variant="outline">
                Resolution: {labelWidth} × {labelHeight}px
              </Badge>
              <Badge variant="outline">
                Print Scale: 100%
              </Badge>
            </div>
            
            <div className="flex items-center gap-2 bg-gray-100 rounded-md p-1">
              <button 
                onClick={() => setZoom(prev => Math.max(0.5, prev - 0.25))}
                className="p-1 hover:bg-gray-200 rounded"
                aria-label="Zoom out"
              >
                <ZoomOut size={16} />
              </button>
              <span className="text-sm font-medium mx-1">{Math.round(zoom * 100)}%</span>
              <button 
                onClick={() => setZoom(prev => Math.min(3, prev + 0.25))}
                className="p-1 hover:bg-gray-200 rounded"
                aria-label="Zoom in"
              >
                <ZoomIn size={16} />
              </button>
            </div>
          </div>
          
          <div className="flex justify-center items-center p-4 border rounded-md bg-gray-50 mb-4">
            <div 
              style={{ 
                transform: `scale(${zoom})`,
                transformOrigin: 'center',
                transition: 'transform 0.2s ease'
              }}
            >
              <div ref={labelRef}>
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
            </div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md text-sm">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800">Print Alignment Note</p>
                <p className="mt-1 text-yellow-700">
                  For consistent alignment and color printing, use the "Download as PDF" option 
                  and then print the PDF at 100% scale (no resizing). This ensures what you see 
                  is exactly what prints.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="preview">Single Label</TabsTrigger>
          <TabsTrigger value="tiled">Multiple Labels</TabsTrigger>
          <TabsTrigger value="advanced">Advanced Options</TabsTrigger>
        </TabsList>
        
        <TabsContent value="preview" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Print Options</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  onClick={downloadPDF} 
                  className="flex-1"
                  size="lg"
                >
                  <Download className="mr-2 h-4 w-4" /> 
                  Download as PDF
                </Button>
                
                <Button 
                  onClick={printToDesktop} 
                  variant="outline"
                  className="flex-1"
                  size="lg"
                >
                  <Printer className="mr-2 h-4 w-4" /> 
                  Print Directly
                </Button>
              </div>
              
              <div className="mt-6 p-3 border rounded-md">
                <h3 className="text-sm font-medium mb-2">For Best Results:</h3>
                <ol className="text-xs space-y-1 text-gray-700 list-decimal pl-4">
                  <li>Download the PDF first, then print from your PDF viewer</li>
                  <li>Set print scaling to "None" or "100%" in your printer dialog</li>
                  <li>Select the exact paper size that matches your label stock</li>
                  <li>For Avery or similar label sheets, use the "Multiple Labels" tab</li>
                  <li>For color labels, ensure your printer settings allow color printing</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="tiled" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Multiple Labels per Page</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor="paper-size">Paper Size</Label>
                  <Select
                    value={selectedPaperSize}
                    onValueChange={setSelectedPaperSize}
                  >
                    <SelectTrigger id="paper-size">
                      <SelectValue placeholder="Select paper size" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(paperSizes).map(([key, size]) => (
                        <SelectItem key={key} value={key}>{size.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="margins">Margins (inches)</Label>
                  <Input
                    id="margins"
                    type="number"
                    value={margins}
                    onChange={(e) => setMargins(Number(e.target.value))}
                    min={0}
                    max={1}
                    step={0.0625}
                  />
                </div>
                
                <div>
                  <Label htmlFor="rows">Rows (max: {maxRows})</Label>
                  <Input
                    id="rows"
                    type="number"
                    value={rows}
                    onChange={(e) => setRows(Math.min(Number(e.target.value), maxRows))}
                    min={1}
                    max={maxRows}
                  />
                </div>
                
                <div>
                  <Label htmlFor="columns">Columns (max: {maxColumns})</Label>
                  <Input
                    id="columns"
                    type="number"
                    value={columns}
                    onChange={(e) => setColumns(Math.min(Number(e.target.value), maxColumns))}
                    min={1}
                    max={maxColumns}
                  />
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md mb-4 flex justify-center">
                <div className="relative" style={{
                  width: `${Math.min(300, 50 * columns)}px`,
                  height: `${Math.min(400, 50 * rows)}px`,
                  background: 'white',
                  border: '1px solid #ddd'
                }}>
                  {Array.from({ length: rows * columns }).map((_, i) => (
                    <div 
                      key={i}
                      className="absolute bg-blue-100 border border-blue-300"
                      style={{
                        width: `${100 / columns}%`,
                        height: `${100 / rows}%`,
                        top: `${Math.floor(i / columns) * (100 / rows)}%`,
                        left: `${(i % columns) * (100 / columns)}%`,
                        transform: 'scale(0.9)',
                        transformOrigin: 'center',
                      }}
                    />
                  ))}
                </div>
              </div>
              
              <Button 
                onClick={() => createTiledPDF(rows, columns, margins)} 
                className="w-full"
                size="lg"
              >
                <Grid2X2 className="mr-2 h-4 w-4" /> 
                Generate {rows}×{columns} Label Sheet ({rows * columns} labels)
              </Button>
              
              <div className="mt-4 p-3 border rounded-md bg-blue-50 text-sm text-blue-800">
                <p>
                  <strong>Compatibility:</strong> This will generate a PDF with {rows * columns} labels 
                  positioned to match standard label sheets. Compatible with Avery, Universal, and generic 
                  label sheets.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="advanced" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Advanced Print Options</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-3 border rounded-md">
                  <h3 className="font-medium mb-2">System Print Dialog</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Opens your system's print dialog for more control over printer settings.
                  </p>
                  <Button 
                    onClick={printWithSystemDialog}
                    variant="outline"
                    className="w-full"
                  >
                    <Printer className="mr-2 h-4 w-4" /> 
                    Print with System Dialog
                  </Button>
                </div>
                
                <div className="p-3 border rounded-md">
                  <h3 className="font-medium mb-2">Image Export</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Export the label as a high-resolution PNG image for use in other applications.
                  </p>
                  <Button 
                    onClick={async () => {
                      if (!labelRef.current) return;
                      
                      try {
                        const { captureLabel } = useImprovedPrintHandler({
                          labelRef,
                          productName,
                          physicalWidth,
                          physicalHeight
                        });
                        
                        const canvas = await captureLabel(4);
                        
                        const link = document.createElement('a');
                        link.download = `safety-label-${productName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
                        link.href = canvas.toDataURL('image/png');
                        link.click();
                      } catch (error) {
                        console.error('Image export error:', error);
                      }
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    <Download className="mr-2 h-4 w-4" /> 
                    Export as PNG Image
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
