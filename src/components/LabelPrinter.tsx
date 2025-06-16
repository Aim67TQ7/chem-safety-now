
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Printer, Download, AlertTriangle, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { interactionLogger } from "@/services/interactionLogger";

interface LabelPrinterProps {
  facilityData: any;
}

const LabelPrinter = ({ facilityData }: LabelPrinterProps) => {
  const [labelData, setLabelData] = useState({
    productName: "",
    hazardCodes: [] as string[],
    pictograms: [] as string[],
    precautionaryStatements: "",
    manufacturer: "",
    dateCreated: new Date().toLocaleDateString(),
    hmisHealth: "",
    hmisFlammability: "",
    hmisPhysical: "",
    hmisSpecial: "",
    signalWord: "",
    labelSize: "4x6"
  });
  const { toast } = useToast();

  const availableHazardCodes = [
    { code: "H200", description: "Unstable explosive" },
    { code: "H222", description: "Extremely flammable aerosol" },
    { code: "H225", description: "Highly flammable liquid and vapour" },
    { code: "H226", description: "Flammable liquid and vapour" },
    { code: "H228", description: "Flammable solid" },
    { code: "H300", description: "Fatal if swallowed" },
    { code: "H301", description: "Toxic if swallowed" },
    { code: "H302", description: "Harmful if swallowed" },
    { code: "H310", description: "Fatal in contact with skin" },
    { code: "H311", description: "Toxic in contact with skin" },
    { code: "H312", description: "Harmful in contact with skin" },
    { code: "H315", description: "Causes skin irritation" },
    { code: "H317", description: "May cause allergic skin reaction" },
    { code: "H318", description: "Causes serious eye damage" },
    { code: "H319", description: "Causes serious eye irritation" },
    { code: "H330", description: "Fatal if inhaled" },
    { code: "H331", description: "Toxic if inhaled" },
    { code: "H332", description: "Harmful if inhaled" },
    { code: "H334", description: "May cause allergy or asthma symptoms or breathing difficulties if inhaled" },
    { code: "H335", description: "May cause respiratory irritation" },
    { code: "H336", description: "May cause drowsiness or dizziness" },
    { code: "H340", description: "May cause genetic defects" },
    { code: "H350", description: "May cause cancer" },
    { code: "H360", description: "May damage fertility or the unborn child" },
    { code: "H370", description: "Causes damage to organs" },
    { code: "H372", description: "Causes damage to organs through prolonged or repeated exposure" },
    { code: "H400", description: "Very toxic to aquatic life" },
    { code: "H410", description: "Very toxic to aquatic life with long lasting effects" }
  ];

  const availablePictograms = [
    { code: "GHS01", name: "Explosive", symbol: "💥", description: "Explosive" },
    { code: "GHS02", name: "Flammable", symbol: "🔥", description: "Flammable" },
    { code: "GHS03", name: "Oxidizing", symbol: "🔴", description: "Oxidizing" },
    { code: "GHS04", name: "Compressed Gas", symbol: "⚗️", description: "Compressed Gas" },
    { code: "GHS05", name: "Corrosive", symbol: "⚠️", description: "Corrosive" },
    { code: "GHS06", name: "Toxic", symbol: "☠️", description: "Toxic" },
    { code: "GHS07", name: "Harmful", symbol: "❗", description: "Harmful/Irritant" },
    { code: "GHS08", name: "Health Hazard", symbol: "☣️", description: "Health Hazard" },
    { code: "GHS09", name: "Environmental", symbol: "🌊", description: "Environmental Hazard" }
  ];

  const labelSizes = [
    { value: "2x4", label: "2\" × 4\" (Small Container)" },
    { value: "3x5", label: "3\" × 5\" (Medium Container)" },
    { value: "4x6", label: "4\" × 6\" (Large Container)" },
    { value: "6x8", label: "6\" × 8\" (Drum/Tank)" },
    { value: "8x10", label: "8\" × 10\" (Large Equipment)" }
  ];

  const handleHazardCodeToggle = async (code: string) => {
    const newCodes = labelData.hazardCodes.includes(code)
      ? labelData.hazardCodes.filter(c => c !== code)
      : [...labelData.hazardCodes, code];
    
    setLabelData(prev => ({
      ...prev,
      hazardCodes: newCodes
    }));

    await interactionLogger.logFacilityUsage({
      eventType: 'label_hazard_code_toggled',
      eventDetail: {
        code: code,
        action: labelData.hazardCodes.includes(code) ? 'removed' : 'added',
        productName: labelData.productName
      }
    });
  };

  const handlePictogramToggle = async (code: string) => {
    const newPictograms = labelData.pictograms.includes(code)
      ? labelData.pictograms.filter(p => p !== code)
      : [...labelData.pictograms, code];

    setLabelData(prev => ({
      ...prev,
      pictograms: newPictograms
    }));

    await interactionLogger.logFacilityUsage({
      eventType: 'label_pictogram_toggled',
      eventDetail: {
        code: code,
        action: labelData.pictograms.includes(code) ? 'removed' : 'added',
        productName: labelData.productName
      }
    });
  };

  const generateLabel = async () => {
    if (!labelData.productName) {
      toast({
        title: "Product Name Required",
        description: "Please enter a product name to generate a label.",
        variant: "destructive"
      });
      return;
    }

    await interactionLogger.logLabelGeneration({
      productName: labelData.productName,
      manufacturer: labelData.manufacturer,
      hazardCodes: labelData.hazardCodes,
      pictograms: labelData.pictograms,
      actionType: 'generate',
      metadata: {
        precautionaryStatements: labelData.precautionaryStatements,
        dateCreated: labelData.dateCreated,
        hmisRatings: {
          health: labelData.hmisHealth,
          flammability: labelData.hmisFlammability,
          physical: labelData.hmisPhysical,
          special: labelData.hmisSpecial
        },
        labelSize: labelData.labelSize
      }
    });

    await interactionLogger.logFacilityUsage({
      eventType: 'label_generated',
      eventDetail: {
        productName: labelData.productName,
        hazardCodeCount: labelData.hazardCodes.length,
        pictogramCount: labelData.pictograms.length,
        labelSize: labelData.labelSize
      }
    });

    toast({
      title: "Label Generated",
      description: "Your GHS-compliant label has been created successfully.",
    });
  };

  const printLabel = async () => {
    if (!labelData.productName) {
      toast({
        title: "No Label to Print",
        description: "Please generate a label first.",
        variant: "destructive"
      });
      return;
    }

    await interactionLogger.logLabelGeneration({
      productName: labelData.productName,
      manufacturer: labelData.manufacturer,
      hazardCodes: labelData.hazardCodes,
      pictograms: labelData.pictograms,
      actionType: 'print'
    });

    window.print();
    
    toast({
      title: "Printing Label",
      description: "Your label has been sent to the printer.",
    });
  };

  const downloadLabel = async () => {
    if (!labelData.productName) {
      toast({
        title: "No Label to Download",
        description: "Please generate a label first.",
        variant: "destructive"
      });
      return;
    }

    await interactionLogger.logLabelGeneration({
      productName: labelData.productName,
      manufacturer: labelData.manufacturer,
      hazardCodes: labelData.hazardCodes,
      pictograms: labelData.pictograms,
      actionType: 'download'
    });

    toast({
      title: "Label Downloaded",
      description: "Your label has been saved as a PDF.",
    });
  };

  const getLabelSizeClass = (size: string) => {
    switch (size) {
      case "2x4": return "w-48 h-32";
      case "3x5": return "w-60 h-40";
      case "4x6": return "w-72 h-48";
      case "6x8": return "w-96 h-64";
      case "8x10": return "w-[30rem] h-80";
      default: return "w-72 h-48";
    }
  };

  return (
    <div className="space-y-6">
      {/* Label Printer Header */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
              <Printer className="w-8 h-8 text-gray-600 mr-3" />
              GHS Compliant Label Generator
            </h3>
            <p className="text-gray-600">
              Create professional secondary container labels with full GHS compliance including HMIS ratings.
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
              GHS Compliant
            </Badge>
            <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">
              OSHA Approved Format
            </Badge>
            <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">
              HMIS Integration
            </Badge>
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Label Configuration */}
        <Card className="p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            Label Configuration
          </h4>

          <div className="space-y-4">
            {/* Product Name */}
            <div>
              <Label htmlFor="productName">Product Name *</Label>
              <Input
                id="productName"
                value={labelData.productName}
                onChange={(e) => setLabelData(prev => ({ ...prev, productName: e.target.value }))}
                placeholder="Enter chemical/product name"
                className="mt-1"
              />
            </div>

            {/* Manufacturer */}
            <div>
              <Label htmlFor="manufacturer">Manufacturer</Label>
              <Input
                id="manufacturer"
                value={labelData.manufacturer}
                onChange={(e) => setLabelData(prev => ({ ...prev, manufacturer: e.target.value }))}
                placeholder="Enter manufacturer name"
                className="mt-1"
              />
            </div>

            {/* Label Size Selection */}
            <div>
              <Label htmlFor="labelSize">Label Size</Label>
              <Select value={labelData.labelSize} onValueChange={(value) => setLabelData(prev => ({ ...prev, labelSize: value }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select label size" />
                </SelectTrigger>
                <SelectContent>
                  {labelSizes.map((size) => (
                    <SelectItem key={size.value} value={size.value}>
                      {size.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Signal Word */}
            <div>
              <Label htmlFor="signalWord">Signal Word</Label>
              <Select value={labelData.signalWord} onValueChange={(value) => setLabelData(prev => ({ ...prev, signalWord: value }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select signal word" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DANGER">DANGER</SelectItem>
                  <SelectItem value="WARNING">WARNING</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* HMIS Ratings */}
            <div className="grid grid-cols-4 gap-2">
              <div>
                <Label htmlFor="hmisHealth">HMIS Health</Label>
                <Select value={labelData.hmisHealth} onValueChange={(value) => setLabelData(prev => ({ ...prev, hmisHealth: value }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="0-4" />
                  </SelectTrigger>
                  <SelectContent>
                    {["0", "1", "2", "3", "4"].map((rating) => (
                      <SelectItem key={rating} value={rating}>{rating}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="hmisFlammability">HMIS Flammability</Label>
                <Select value={labelData.hmisFlammability} onValueChange={(value) => setLabelData(prev => ({ ...prev, hmisFlammability: value }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="0-4" />
                  </SelectTrigger>
                  <SelectContent>
                    {["0", "1", "2", "3", "4"].map((rating) => (
                      <SelectItem key={rating} value={rating}>{rating}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="hmisPhysical">HMIS Physical</Label>
                <Select value={labelData.hmisPhysical} onValueChange={(value) => setLabelData(prev => ({ ...prev, hmisPhysical: value }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="0-4" />
                  </SelectTrigger>
                  <SelectContent>
                    {["0", "1", "2", "3", "4"].map((rating) => (
                      <SelectItem key={rating} value={rating}>{rating}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="hmisSpecial">HMIS Special</Label>
                <Input
                  id="hmisSpecial"
                  value={labelData.hmisSpecial}
                  onChange={(e) => setLabelData(prev => ({ ...prev, hmisSpecial: e.target.value }))}
                  placeholder="OX, W, etc."
                  className="mt-1"
                />
              </div>
            </div>

            {/* Hazard Codes - Scrollable */}
            <div>
              <Label>Hazard Statements (H-Codes)</Label>
              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded p-2 mt-2 space-y-1">
                {availableHazardCodes.map((hazard) => (
                  <Button
                    key={hazard.code}
                    variant={labelData.hazardCodes.includes(hazard.code) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleHazardCodeToggle(hazard.code)}
                    className="text-left justify-start h-auto p-2 w-full text-xs"
                  >
                    <span className="font-medium">{hazard.code}:</span>
                    <span className="ml-1 truncate">{hazard.description}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Pictograms */}
            <div>
              <Label>GHS Pictograms</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {availablePictograms.map((pictogram) => (
                  <Button
                    key={pictogram.code}
                    variant={labelData.pictograms.includes(pictogram.code) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePictogramToggle(pictogram.code)}
                    className="text-left justify-start h-auto p-2"
                  >
                    <span className="text-lg mr-1">{pictogram.symbol}</span>
                    <div className="text-xs">
                      <div className="font-medium">{pictogram.code}</div>
                      <div>{pictogram.name}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* Precautionary Statements */}
            <div>
              <Label htmlFor="precautionary">Precautionary Statements</Label>
              <textarea
                id="precautionary"
                value={labelData.precautionaryStatements}
                onChange={(e) => setLabelData(prev => ({ ...prev, precautionaryStatements: e.target.value }))}
                placeholder="Enter precautionary statements (P-codes)"
                rows={3}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>
        </Card>

        {/* Label Preview */}
        <Card className="p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Eye className="w-5 h-5 mr-2" />
            Label Preview
          </h4>

          {/* Label Preview Area */}
          <div className={`border-4 border-gray-900 rounded-lg bg-white ${getLabelSizeClass(labelData.labelSize)} mx-auto p-4 text-xs`} id="label-preview">
            <div className="h-full flex flex-col">
              {/* Company Header */}
              <div className="text-center border-b-2 border-gray-900 pb-2 mb-2">
                <div className="font-bold text-gray-900 text-sm">{facilityData.facilityName}</div>
                <div className="text-xs text-gray-700">Secondary Container Label</div>
              </div>

              {/* Product Name and Signal Word */}
              <div className="text-center mb-2">
                <h5 className="font-bold text-gray-900 text-lg leading-tight">
                  {labelData.productName || "Product Name"}
                </h5>
                {labelData.signalWord && (
                  <div className={`font-bold text-lg ${labelData.signalWord === 'DANGER' ? 'text-red-600' : 'text-orange-600'} border-2 ${labelData.signalWord === 'DANGER' ? 'border-red-600' : 'border-orange-600'} inline-block px-2 py-1 mt-1`}>
                    {labelData.signalWord}
                  </div>
                )}
                {labelData.manufacturer && (
                  <p className="text-xs text-gray-600 mt-1">Manufacturer: {labelData.manufacturer}</p>
                )}
              </div>

              {/* Pictograms and HMIS */}
              <div className="flex justify-between items-center mb-2">
                {/* Pictograms */}
                {labelData.pictograms.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {labelData.pictograms.slice(0, 4).map((code) => {
                      const pictogram = availablePictograms.find(p => p.code === code);
                      return pictogram ? (
                        <div key={code} className="w-8 h-8 border-2 border-red-600 rounded flex items-center justify-center text-sm bg-white">
                          {pictogram.symbol}
                        </div>
                      ) : null;
                    })}
                  </div>
                )}

                {/* HMIS Diamond */}
                {(labelData.hmisHealth || labelData.hmisFlammability || labelData.hmisPhysical) && (
                  <div className="border-2 border-gray-900 p-1">
                    <div className="text-center">
                      <div className="text-xs font-bold">HMIS</div>
                      <div className="grid grid-cols-3 gap-px bg-gray-900 text-white text-xs">
                        <div className="bg-blue-600 w-6 h-6 flex items-center justify-center font-bold">{labelData.hmisHealth || "0"}</div>
                        <div className="bg-red-600 w-6 h-6 flex items-center justify-center font-bold">{labelData.hmisFlammability || "0"}</div>
                        <div className="bg-yellow-500 w-6 h-6 flex items-center justify-center font-bold">{labelData.hmisPhysical || "0"}</div>
                      </div>
                      {labelData.hmisSpecial && (
                        <div className="bg-white text-gray-900 w-6 h-6 flex items-center justify-center text-xs font-bold border border-gray-900 mx-auto">
                          {labelData.hmisSpecial}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Hazard Statements */}
              {labelData.hazardCodes.length > 0 && (
                <div className="mb-2 flex-1">
                  <h6 className="font-bold text-red-600 text-xs mb-1">HAZARD STATEMENTS:</h6>
                  <div className="text-xs space-y-px max-h-20 overflow-y-auto">
                    {labelData.hazardCodes.map((code) => {
                      const hazard = availableHazardCodes.find(h => h.code === code);
                      return hazard ? (
                        <div key={code} className="leading-tight">
                          <strong>{hazard.code}:</strong> {hazard.description}
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {/* Precautionary Statements */}
              {labelData.precautionaryStatements && (
                <div className="mb-2">
                  <h6 className="font-bold text-blue-600 text-xs mb-1">PRECAUTIONARY STATEMENTS:</h6>
                  <div className="text-xs leading-tight">{labelData.precautionaryStatements}</div>
                </div>
              )}

              {/* Footer */}
              <div className="border-t-2 border-gray-900 pt-1 mt-auto text-center">
                <div className="text-xs text-gray-600">
                  Date: {labelData.dateCreated}
                </div>
                <div className="text-xs text-gray-600">
                  Consult SDS for complete safety information
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button 
              onClick={generateLabel}
              className="bg-gray-800 hover:bg-gray-900 text-white"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Generate Label
            </Button>
            
            <Button variant="outline" onClick={printLabel}>
              <Printer className="w-4 h-4 mr-2" />
              Print Label
            </Button>
            
            <Button variant="outline" onClick={downloadLabel}>
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </Card>
      </div>

      {/* Compliance Information */}
      <Card className="p-6 bg-gray-50 border-gray-200">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">
          GHS Compliance Requirements
        </h4>
        
        <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
          <div>
            <h5 className="font-medium text-gray-900 mb-2">Required Elements:</h5>
            <ul className="space-y-1">
              <li>• Product identifier (chemical name)</li>
              <li>• Signal words (DANGER/WARNING)</li>
              <li>• Hazard statements (H-codes)</li>
              <li>• Precautionary statements (P-codes)</li>
              <li>• GHS pictograms</li>
              <li>• Supplier information</li>
              <li>• HMIS ratings (recommended)</li>
            </ul>
          </div>
          
          <div>
            <h5 className="font-medium text-gray-900 mb-2">Implementation Standards:</h5>
            <ul className="space-y-1">
              <li>• Use durable, chemical-resistant labels</li>
              <li>• Ensure text legibility and permanence</li>
              <li>• Apply labels before container use</li>
              <li>• Replace damaged labels immediately</li>
              <li>• Maintain label visibility and cleanliness</li>
              <li>• Include facility identification</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default LabelPrinter;
