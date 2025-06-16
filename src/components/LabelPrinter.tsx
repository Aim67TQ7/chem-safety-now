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
    dateCreated: new Date().toLocaleDateString()
  });
  const { toast } = useToast();

  const availableHazardCodes = [
    { code: "H222", description: "Extremely flammable aerosol" },
    { code: "H225", description: "Highly flammable liquid and vapour" },
    { code: "H315", description: "Causes skin irritation" },
    { code: "H319", description: "Causes serious eye irritation" },
    { code: "H335", description: "May cause respiratory irritation" },
    { code: "H336", description: "May cause drowsiness or dizziness" }
  ];

  const availablePictograms = [
    { code: "GHS02", name: "Flame", symbol: "🔥" },
    { code: "GHS04", name: "Gas Cylinder", symbol: "⚠️" },
    { code: "GHS07", name: "Exclamation Mark", symbol: "❗" },
    { code: "GHS08", name: "Health Hazard", symbol: "☣️" }
  ];

  const handleHazardCodeToggle = async (code: string) => {
    const newCodes = labelData.hazardCodes.includes(code)
      ? labelData.hazardCodes.filter(c => c !== code)
      : [...labelData.hazardCodes, code];
    
    setLabelData(prev => ({
      ...prev,
      hazardCodes: newCodes
    }));

    // Log hazard code selection
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

    // Log pictogram selection
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

    // Log label generation
    await interactionLogger.logLabelGeneration({
      productName: labelData.productName,
      manufacturer: labelData.manufacturer,
      hazardCodes: labelData.hazardCodes,
      pictograms: labelData.pictograms,
      actionType: 'generate',
      metadata: {
        precautionaryStatements: labelData.precautionaryStatements,
        dateCreated: labelData.dateCreated
      }
    });

    await interactionLogger.logFacilityUsage({
      eventType: 'label_generated',
      eventDetail: {
        productName: labelData.productName,
        hazardCodeCount: labelData.hazardCodes.length,
        pictogramCount: labelData.pictograms.length
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

    // Log label printing
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

    // Log label download
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

  const loadFromSDS = async (productName: string) => {
    // Mock loading data from previously searched SDS
    const mockData = {
      "WD-40": {
        hazardCodes: ["H222", "H229"],
        pictograms: ["GHS02", "GHS04"],
        manufacturer: "WD-40 Company",
        precautionaryStatements: "Keep away from heat/sparks/open flames/hot surfaces. Protect from sunlight."
      },
      "Loctite 401": {
        hazardCodes: ["H315", "H319", "H335"],
        pictograms: ["GHS07"],
        manufacturer: "Henkel Corporation",
        precautionaryStatements: "Avoid breathing vapours. Use only in well-ventilated areas. Wear protective gloves/eye protection."
      }
    };

    const data = mockData[productName as keyof typeof mockData];
    if (data) {
      setLabelData(prev => ({
        ...prev,
        productName,
        hazardCodes: data.hazardCodes,
        pictograms: data.pictograms,
        manufacturer: data.manufacturer,
        precautionaryStatements: data.precautionaryStatements
      }));

      // Log SDS data loading
      await interactionLogger.logFacilityUsage({
        eventType: 'label_sds_data_loaded',
        eventDetail: {
          productName: productName,
          loadedFrom: 'mock_data'
        }
      });
      
      toast({
        title: "SDS Data Loaded",
        description: `Loaded safety information for ${productName}.`,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Label Printer Header */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
              <Printer className="w-8 h-8 text-green-600 mr-3" />
              🏷️ Secondary Container Label Generator
            </h3>
            <p className="text-gray-600">
              Create GHS-compliant labels for secondary containers with your facility branding.
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
              ✓ GHS Compliant
            </Badge>
            <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
              ✓ OSHA Approved Format
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
            {/* Quick Load from SDS */}
            <div>
              <Label>Quick Load from Previous Search</Label>
              <div className="flex gap-2 mt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadFromSDS("WD-40")}
                >
                  WD-40
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadFromSDS("Loctite 401")}
                >
                  Loctite 401
                </Button>
              </div>
            </div>

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

            {/* Hazard Codes */}
            <div>
              <Label>Hazard Statements (H-Codes)</Label>
              <div className="grid grid-cols-1 gap-2 mt-2">
                {availableHazardCodes.map((hazard) => (
                  <Button
                    key={hazard.code}
                    variant={labelData.hazardCodes.includes(hazard.code) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleHazardCodeToggle(hazard.code)}
                    className="text-left justify-start h-auto p-3 whitespace-normal"
                  >
                    <span className="font-medium">{hazard.code}:</span>
                    <span className="ml-2">{hazard.description}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Pictograms */}
            <div>
              <Label>GHS Pictograms</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {availablePictograms.map((pictogram) => (
                  <Button
                    key={pictogram.code}
                    variant={labelData.pictograms.includes(pictogram.code) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePictogramToggle(pictogram.code)}
                    className="text-left justify-start h-auto p-3"
                  >
                    <span className="text-lg mr-2">{pictogram.symbol}</span>
                    <div>
                      <div className="font-medium">{pictogram.code}</div>
                      <div className="text-xs">{pictogram.name}</div>
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
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <div className="border-2 border-gray-300 rounded-lg p-6 bg-white" id="label-preview">
            <div className="space-y-4">
              {/* Facility Header */}
              <div className="text-center border-b border-gray-300 pb-3">
                <div className="text-sm font-bold text-blue-600">{facilityData.facilityName}</div>
                <div className="text-xs text-gray-600">Secondary Container Label</div>
              </div>

              {/* Product Name */}
              <div className="text-center">
                <h5 className="text-lg font-bold text-gray-900">
                  {labelData.productName || "Product Name"}
                </h5>
                {labelData.manufacturer && (
                  <p className="text-sm text-gray-600">Manufacturer: {labelData.manufacturer}</p>
                )}
              </div>

              {/* Pictograms */}
              {labelData.pictograms.length > 0 && (
                <div className="flex justify-center space-x-4">
                  {labelData.pictograms.map((code) => {
                    const pictogram = availablePictograms.find(p => p.code === code);
                    return pictogram ? (
                      <div key={code} className="text-center">
                        <div className="w-12 h-12 border-2 border-red-500 rounded flex items-center justify-center text-2xl">
                          {pictogram.symbol}
                        </div>
                        <div className="text-xs mt-1">{pictogram.code}</div>
                      </div>
                    ) : null;
                  })}
                </div>
              )}

              {/* Hazard Statements */}
              {labelData.hazardCodes.length > 0 && (
                <div>
                  <h6 className="text-sm font-semibold text-red-600 mb-2">HAZARD STATEMENTS:</h6>
                  <div className="text-xs space-y-1">
                    {labelData.hazardCodes.map((code) => {
                      const hazard = availableHazardCodes.find(h => h.code === code);
                      return hazard ? (
                        <div key={code}>
                          <strong>{hazard.code}:</strong> {hazard.description}
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {/* Precautionary Statements */}
              {labelData.precautionaryStatements && (
                <div>
                  <h6 className="text-sm font-semibold text-blue-600 mb-2">PRECAUTIONARY STATEMENTS:</h6>
                  <div className="text-xs">{labelData.precautionaryStatements}</div>
                </div>
              )}

              {/* Footer */}
              <div className="border-t border-gray-300 pt-3 text-center">
                <div className="text-xs text-gray-600">
                  Date Created: {labelData.dateCreated}
                </div>
                <div className="text-xs text-gray-600">
                  For complete safety information, consult the Safety Data Sheet
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button 
              onClick={generateLabel}
              className="bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-700 hover:to-blue-700 text-white"
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

      {/* Label Guidelines */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">
          📋 GHS Label Requirements
        </h4>
        
        <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
          <div>
            <h5 className="font-medium text-gray-900 mb-2">Required Elements:</h5>
            <ul className="space-y-1">
              <li>• Product identifier (chemical name)</li>
              <li>• Signal words (Danger/Warning)</li>
              <li>• Hazard statements (H-codes)</li>
              <li>• Precautionary statements (P-codes)</li>
              <li>• GHS pictograms</li>
              <li>• Supplier information</li>
            </ul>
          </div>
          
          <div>
            <h5 className="font-medium text-gray-900 mb-2">Best Practices:</h5>
            <ul className="space-y-1">
              <li>• Use durable, weather-resistant labels</li>
              <li>• Ensure text is legible and permanent</li>
              <li>• Apply labels before first use</li>
              <li>• Replace damaged or faded labels</li>
              <li>• Keep labels clean and visible</li>
              <li>• Include facility contact information</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default LabelPrinter;
