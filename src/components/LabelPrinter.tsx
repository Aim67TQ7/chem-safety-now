
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { interactionLogger } from "@/services/interactionLogger";

interface LabelPrinterProps {
  initialProductName?: string;
  initialManufacturer?: string;
}

const LabelPrinter = ({ initialProductName = "", initialManufacturer = "" }: LabelPrinterProps) => {
  const [productName, setProductName] = useState(initialProductName);
  const [manufacturer, setManufacturer] = useState(initialManufacturer);
  const [labelSize, setLabelSize] = useState("4x6");
  const [signalWord, setSignalWord] = useState("DANGER");
  const [selectedHazards, setSelectedHazards] = useState<string[]>([]);
  const [selectedPictograms, setSelectedPictograms] = useState<string[]>([]);
  const [hmisHealth, setHmisHealth] = useState("2");
  const [hmisFlammability, setHmisFlammability] = useState("3");
  const [hmisPhysical, setHmisPhysical] = useState("0");
  const [hmisSpecial, setHmisSpecial] = useState("");
  const { toast } = useToast();

  // Initialize with props when they change
  useEffect(() => {
    if (initialProductName) setProductName(initialProductName);
    if (initialManufacturer) setManufacturer(initialManufacturer);
  }, [initialProductName, initialManufacturer]);

  const hazardCodes = [
    { code: "H225", description: "Highly flammable liquid and vapor" },
    { code: "H226", description: "Flammable liquid and vapor" },
    { code: "H301", description: "Toxic if swallowed" },
    { code: "H302", description: "Harmful if swallowed" },
    { code: "H315", description: "Causes skin irritation" },
    { code: "H319", description: "Causes serious eye irritation" },
    { code: "H336", description: "May cause drowsiness or dizziness" },
    { code: "H411", description: "Toxic to aquatic life with long lasting effects" }
  ];

  const pictograms = [
    { id: "flame", name: "Flame", symbol: "🔥" },
    { id: "exclamation", name: "Exclamation Mark", symbol: "⚠️" },
    { id: "health_hazard", name: "Health Hazard", symbol: "☣️" },
    { id: "corrosion", name: "Corrosion", symbol: "🧪" },
    { id: "gas_cylinder", name: "Gas Cylinder", symbol: "🗜️" },
    { id: "exploding_bomb", name: "Exploding Bomb", symbol: "💥" },
    { id: "environment", name: "Environment", symbol: "🌍" },
    { id: "skull_crossbones", name: "Skull and Crossbones", symbol: "☠️" }
  ];

  const labelSizes = [
    { value: "2x4", label: "2\" × 4\"" },
    { value: "4x6", label: "4\" × 6\"" },
    { value: "6x8", label: "6\" × 8\"" },
    { value: "8x10", label: "8\" × 10\"" },
    { value: "custom", label: "Custom Size" }
  ];

  const handleHazardToggle = (code: string) => {
    setSelectedHazards(prev => 
      prev.includes(code) 
        ? prev.filter(h => h !== code)
        : [...prev, code]
    );
  };

  const handlePictogramToggle = (id: string) => {
    setSelectedPictograms(prev => 
      prev.includes(id) 
        ? prev.filter(p => p !== id)
        : [...prev, id]
    );
  };

  const handleDownloadLabel = async () => {
    try {
      await interactionLogger.logLabelGeneration({
        productName,
        manufacturer,
        actionType: 'download',
        labelType: 'ghs_compliance',
        hazardCodes: selectedHazards,
        pictograms: selectedPictograms,
        metadata: {
          labelSize,
          signalWord,
          hmisRatings: {
            health: hmisHealth,
            flammability: hmisFlammability,
            physical: hmisPhysical,
            special: hmisSpecial
          }
        }
      });

      toast({
        title: "Label Generated",
        description: `GHS label for ${productName} is ready for download.`
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Error",
        description: "Unable to generate label. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handlePrintLabel = async () => {
    try {
      await interactionLogger.logLabelGeneration({
        productName,
        manufacturer,
        actionType: 'print',
        labelType: 'ghs_compliance',
        hazardCodes: selectedHazards,
        pictograms: selectedPictograms,
        metadata: {
          labelSize,
          signalWord,
          hmisRatings: {
            health: hmisHealth,
            flammability: hmisFlammability,
            physical: hmisPhysical,
            special: hmisSpecial
          }
        }
      });

      toast({
        title: "Print Job Sent",
        description: `Printing GHS label for ${productName}.`
      });
    } catch (error) {
      console.error('Print error:', error);
      toast({
        title: "Print Error",
        description: "Unable to print label. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Product Information */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="productName">Product Name *</Label>
            <Input
              id="productName"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="Enter chemical/product name"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="manufacturer">Manufacturer</Label>
            <Input
              id="manufacturer"
              value={manufacturer}
              onChange={(e) => setManufacturer(e.target.value)}
              placeholder="Enter manufacturer name"
              className="mt-1"
            />
          </div>
        </div>
      </Card>

      {/* Label Configuration */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Label Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="labelSize">Label Size</Label>
            <Select value={labelSize} onValueChange={setLabelSize}>
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
          <div>
            <Label htmlFor="signalWord">Signal Word</Label>
            <Select value={signalWord} onValueChange={setSignalWord}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DANGER">DANGER</SelectItem>
                <SelectItem value="WARNING">WARNING</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* GHS Hazard Statements */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">GHS Hazard Statements</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {hazardCodes.map((hazard) => (
            <div key={hazard.code} className="flex items-start space-x-3">
              <Checkbox
                id={hazard.code}
                checked={selectedHazards.includes(hazard.code)}
                onCheckedChange={() => handleHazardToggle(hazard.code)}
                className="mt-1"
              />
              <div className="flex-1">
                <label
                  htmlFor={hazard.code}
                  className="text-sm font-medium cursor-pointer"
                >
                  {hazard.code}
                </label>
                <p className="text-xs text-gray-600 mt-0.5">
                  {hazard.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* GHS Pictograms */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">GHS Pictograms</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {pictograms.map((pictogram) => (
            <div
              key={pictogram.id}
              onClick={() => handlePictogramToggle(pictogram.id)}
              className={`p-3 border-2 rounded-lg cursor-pointer text-center transition-colors ${
                selectedPictograms.includes(pictogram.id)
                  ? 'border-gray-800 bg-gray-50'
                  : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <div className="text-2xl mb-1">{pictogram.symbol}</div>
              <div className="text-xs font-medium">{pictogram.name}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* HMIS Rating */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">HMIS Rating</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="hmisHealth">Health (Blue)</Label>
            <Select value={hmisHealth} onValueChange={setHmisHealth}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[0, 1, 2, 3, 4].map((rating) => (
                  <SelectItem key={rating} value={rating.toString()}>
                    {rating}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="hmisFlammability">Flammability (Red)</Label>
            <Select value={hmisFlammability} onValueChange={setHmisFlammability}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[0, 1, 2, 3, 4].map((rating) => (
                  <SelectItem key={rating} value={rating.toString()}>
                    {rating}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="hmisPhysical">Physical (Yellow)</Label>
            <Select value={hmisPhysical} onValueChange={setHmisPhysical}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[0, 1, 2, 3, 4].map((rating) => (
                  <SelectItem key={rating} value={rating.toString()}>
                    {rating}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="hmisSpecial">Special (White)</Label>
            <Input
              id="hmisSpecial"
              value={hmisSpecial}
              onChange={(e) => setHmisSpecial(e.target.value)}
              placeholder="Special hazards"
              className="mt-1"
            />
          </div>
        </div>
      </Card>

      {/* Label Preview & Actions */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Label Preview</h3>
        
        <div className="bg-white border-2 border-gray-800 p-4 mb-4 max-w-md mx-auto">
          <div className="text-center space-y-2">
            <div className="text-lg font-bold">{productName || "Product Name"}</div>
            {manufacturer && <div className="text-sm">{manufacturer}</div>}
            
            <div className="border-t border-gray-800 pt-2">
              <div className="text-lg font-bold text-red-600">{signalWord}</div>
            </div>
            
            {selectedPictograms.length > 0 && (
              <div className="flex justify-center space-x-2 py-2">
                {selectedPictograms.map((id) => {
                  const pictogram = pictograms.find(p => p.id === id);
                  return pictogram ? (
                    <div key={id} className="text-lg">{pictogram.symbol}</div>
                  ) : null;
                })}
              </div>
            )}

            {selectedHazards.length > 0 && (
              <div className="text-xs space-y-1">
                {selectedHazards.map((code) => (
                  <div key={code}>{code}</div>
                ))}
              </div>
            )}

            <div className="border-t border-gray-800 pt-2">
              <div className="text-xs font-bold">HMIS</div>
              <div className="flex justify-center space-x-1 text-xs">
                <span className="bg-blue-500 text-white px-1 rounded">H:{hmisHealth}</span>
                <span className="bg-red-500 text-white px-1 rounded">F:{hmisFlammability}</span>
                <span className="bg-yellow-500 text-black px-1 rounded">P:{hmisPhysical}</span>
                {hmisSpecial && <span className="bg-gray-100 text-black px-1 rounded">{hmisSpecial}</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="flex space-x-3 justify-center">
          <Button
            onClick={handleDownloadLabel}
            disabled={!productName.trim()}
            className="bg-gray-800 hover:bg-gray-900 text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Label
          </Button>
          <Button
            onClick={handlePrintLabel}
            disabled={!productName.trim()}
            variant="outline"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print Label
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default LabelPrinter;
