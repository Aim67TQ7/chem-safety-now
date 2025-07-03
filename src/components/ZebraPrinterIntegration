import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Printer, Settings, AlertTriangle } from "lucide-react";
import { toast } from 'sonner';

// Define common Zebra label sizes (width × height in inches)
const ZEBRA_LABEL_SIZES = [
  { label: '2" × 1" (Small)', width: 2, height: 1, dpi: 203 },
  { label: '2" × 1.33" (Standard)', width: 2, height: 1.33, dpi: 203 },
  { label: '2" × 3" (Large)', width: 2, height: 3, dpi: 203 },
  { label: '3" × 1" (Wide)', width: 3, height: 1, dpi: 203 },
  { label: '3" × 2" (Medium)', width: 3, height: 2, dpi: 203 },
  { label: '4" × 2" (Large Wide)', width: 4, height: 2, dpi: 203 },
  { label: '4" × 6" (Shipping)', width: 4, height: 6, dpi: 203 },
];

// Zebra printer models with their default DPIs
const ZEBRA_PRINTERS = [
  { model: 'ZD410', description: 'Direct Thermal', dpi: 203 },
  { model: 'ZD420', description: 'Thermal Transfer', dpi: 203 },
  { model: 'ZD620', description: 'Premium Desktop', dpi: 203 },
  { model: 'ZT230', description: 'Industrial', dpi: 300 },
  { model: 'ZT410', description: 'Industrial Mid-Range', dpi: 300 },
  { model: 'ZT610', description: 'Industrial High-Performance', dpi: 600 },
  { model: 'GK420d', description: 'Desktop', dpi: 203 },
  { model: 'GX430t', description: 'Desktop', dpi: 300 },
  { model: 'Custom', description: 'Other Zebra printer', dpi: 203 },
];

interface ZebraPrintAdapterProps {
  onPrint: (options: ZebraPrintOptions) => void;
  defaultLabelWidth?: number; // in inches
  defaultLabelHeight?: number; // in inches
  showAdvancedOptions?: boolean;
}

export interface ZebraPrintOptions {
  printerName: string;
  printerModel: string;
  labelWidth: number; // in inches
  labelHeight: number; // in inches
  dpi: number;
  darkness: number;
  printSpeed: number;
  gapBetweenLabels: number; // in inches
  orientation: 'portrait' | 'landscape';
  copies: number;
  directThermal: boolean;
}

export const ZebraPrintAdapter: React.FC<ZebraPrintAdapterProps> = ({
  onPrint,
  defaultLabelWidth = 2,
  defaultLabelHeight = 3,
  showAdvancedOptions = false
}) => {
  const [activeTab, setActiveTab] = useState<string>('standard');
  const [selectedSize, setSelectedSize] = useState<string>(`${defaultLabelWidth}" × ${defaultLabelHeight}"`);
  const [selectedPrinter, setSelectedPrinter] = useState<string>('ZD420');
  const [customWidth, setCustomWidth] = useState<number>(defaultLabelWidth);
  const [customHeight, setCustomHeight] = useState<number>(defaultLabelHeight);
  const [customDpi, setCustomDpi] = useState<number>(203);
  const [darkness, setDarkness] = useState<number>(10);
  const [printSpeed, setPrintSpeed] = useState<number>(3);
  const [gapBetweenLabels, setGapBetweenLabels] = useState<number>(0.125);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [copies, setCopies] = useState<number>(1);
  const [directThermal, setDirectThermal] = useState<boolean>(true);
  const [showingAdvanced, setShowingAdvanced] = useState<boolean>(showAdvancedOptions);
  
  // Get the printer details based on the selected model
  const getPrinterDetails = () => {
    const printer = ZEBRA_PRINTERS.find(p => p.model === selectedPrinter);
    return printer || ZEBRA_PRINTERS[1]; // Default to ZD420 if not found
  };
  
  // Get the selected label size details
  const getLabelSizeDetails = () => {
    if (activeTab === 'custom') {
      return {
        width: customWidth,
        height: customHeight,
        dpi: customDpi
      };
    }
    
    // Try to find the standard size
    const matchingSize = ZEBRA_LABEL_SIZES.find(size => 
      size.label.startsWith(selectedSize) || 
      `${size.width}" × ${size.height}"` === selectedSize
    );
    
    return matchingSize || { 
      width: defaultLabelWidth, 
      height: defaultLabelHeight, 
      dpi: getPrinterDetails().dpi 
    };
  };

  const handlePrint = () => {
    const printerDetails = getPrinterDetails();
    const labelSize = getLabelSizeDetails();
    
    const options: ZebraPrintOptions = {
      printerName: 'Zebra ' + selectedPrinter,
      printerModel: selectedPrinter,
      labelWidth: labelSize.width,
      labelHeight: labelSize.height,
      dpi: activeTab === 'custom' ? customDpi : printerDetails.dpi,
      darkness,
      printSpeed,
      gapBetweenLabels,
      orientation,
      copies,
      directThermal
    };
    
    // Validate settings
    if (options.labelWidth <= 0 || options.labelHeight <= 0) {
      toast.error('Label dimensions must be greater than zero');
      return;
    }
    
    if (options.copies <= 0 || options.copies > 100) {
      toast.error('Number of copies must be between 1 and 100');
      return;
    }
    
    // Call the provided print handler
    onPrint(options);
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Printer className="h-5 w-5" /> 
          Zebra Thermal Printer Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div>
            <Label htmlFor="printer-model">Printer Model</Label>
            <Select 
              value={selectedPrinter} 
              onValueChange={setSelectedPrinter}
            >
              <SelectTrigger id="printer-model">
                <SelectValue placeholder="Select printer model" />
              </SelectTrigger>
              <SelectContent>
                {ZEBRA_PRINTERS.map((printer) => (
                  <SelectItem key={printer.model} value={printer.model}>
                    {printer.model} - {printer.description} ({printer.dpi} DPI)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Label Size</Label>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="standard">Standard Sizes</TabsTrigger>
                <TabsTrigger value="custom">Custom Size</TabsTrigger>
              </TabsList>
              
              <TabsContent value="standard" className="pt-4 space-y-4">
                <Select 
                  value={selectedSize} 
                  onValueChange={setSelectedSize}
                >
                  <SelectTrigger id="standard-size">
                    <SelectValue placeholder="Select label size" />
                  </SelectTrigger>
                  <SelectContent>
                    {ZEBRA_LABEL_SIZES.map((size) => (
                      <SelectItem key={size.label} value={size.label}>
                        {size.label} ({size.width}" × {size.height}")
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TabsContent>
              
              <TabsContent value="custom" className="pt-4 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="custom-width">Width (inches)</Label>
                    <Input
                      id="custom-width"
                      type="number"
                      value={customWidth}
                      onChange={(e) => setCustomWidth(Number(e.target.value))}
                      min={0.5}
                      max={8}
                      step={0.01}
                    />
                  </div>
                  <div>
                    <Label htmlFor="custom-height">Height (inches)</Label>
                    <Input
                      id="custom-height"
                      type="number"
                      value={customHeight}
                      onChange={(e) => setCustomHeight(Number(e.target.value))}
                      min={0.5}
                      max={12}
                      step={0.01}
                    />
                  </div>
                  <div>
                    <Label htmlFor="custom-dpi">DPI</Label>
                    <Select 
                      value={customDpi.toString()} 
                      onValueChange={(val) => setCustomDpi(Number(val))}
                    >
                      <SelectTrigger id="custom-dpi">
                        <SelectValue placeholder="Select DPI" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="203">203 DPI (Standard)</SelectItem>
                        <SelectItem value="300">300 DPI (High Quality)</SelectItem>
                        <SelectItem value="600">600 DPI (Premium)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="show-advanced" 
              checked={showingAdvanced} 
              onCheckedChange={(checked) => setShowingAdvanced(checked as boolean)}
            />
            <Label htmlFor="show-advanced" className="cursor-pointer">
              Show Advanced Options
            </Label>
          </div>
          
          {showingAdvanced && (
            <div className="space-y-4 border p-4 rounded-md bg-gray-50">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="darkness">Print Darkness</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="darkness"
                      type="range"
                      min={0}
                      max={30}
                      value={darkness}
                      onChange={(e) => setDarkness(Number(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-sm w-8 text-center">{darkness}</span>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="print-speed">Print Speed (ips)</Label>
                  <Select 
                    value={printSpeed.toString()} 
                    onValueChange={(val) => setPrintSpeed(Number(val))}
                  >
                    <SelectTrigger id="print-speed">
                      <SelectValue placeholder="Select speed" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 ips (Highest Quality)</SelectItem>
                      <SelectItem value="3">3 ips (Standard)</SelectItem>
                      <SelectItem value="4">4 ips (Fast)</SelectItem>
                      <SelectItem value="6">6 ips (Very Fast)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="gap-between">Gap Between Labels (inches)</Label>
                  <Input
                    id="gap-between"
                    type="number"
                    value={gapBetweenLabels}
                    onChange={(e) => setGapBetweenLabels(Number(e.target.value))}
                    min={0.0625}
                    max={1}
                    step={0.0625}
                  />
                </div>
                
                <div>
                  <Label htmlFor="orientation">Orientation</Label>
                  <Select 
                    value={orientation} 
                    onValueChange={(val: 'portrait' | 'landscape') => setOrientation(val)}
                  >
                    <SelectTrigger id="orientation">
                      <SelectValue placeholder="Select orientation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="portrait">Portrait</SelectItem>
                      <SelectItem value="landscape">Landscape</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="copies">Number of Copies</Label>
                  <Input
                    id="copies"
                    type="number"
                    value={copies}
                    onChange={(e) => setCopies(Number(e.target.value))}
                    min={1}
                    max={100}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="direct-thermal" 
                    checked={directThermal} 
                    onCheckedChange={(checked) => setDirectThermal(checked as boolean)}
                  />
                  <Label htmlFor="direct-thermal">
                    Direct Thermal (vs Thermal Transfer)
                  </Label>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md text-sm text-yellow-800">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 mt-0.5" />
                  <div>
                    <p className="font-medium">Printer Compatibility Note</p>
                    <p className="mt-1">
                      Ensure your printer supports the selected settings. Incompatible settings may result in print failures or poor quality output.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="pt-4">
            <Button 
              onClick={handlePrint} 
              className="w-full"
              size="lg"
            >
              <Printer className="mr-2 h-4 w-4" /> 
              Print to Zebra Thermal Printer
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
