import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Download, Printer, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { interactionLogger } from "@/services/interactionLogger";
import { extractSDSData, extractEnhancedSDSData } from "./utils/sdsDataExtractor";
import { supabase } from "@/integrations/supabase/client";

interface LabelPrinterProps {
  initialProductName?: string;
  initialManufacturer?: string;
  selectedDocument?: any;
}

const LabelPrinter = ({ 
  initialProductName = "", 
  initialManufacturer = "", 
  selectedDocument 
}: LabelPrinterProps) => {
  const [productName, setProductName] = useState(initialProductName);
  const [manufacturer, setManufacturer] = useState(initialManufacturer);
  const [casNumber, setCasNumber] = useState("");
  const [chemicalFormula, setChemicalFormula] = useState("");
  const [productId, setProductId] = useState("");
  const [ppeRequirements, setPpeRequirements] = useState<string[]>([]);
  const [labelSize, setLabelSize] = useState("4x6");
  const [signalWord, setSignalWord] = useState("DANGER");
  const [selectedHazards, setSelectedHazards] = useState<string[]>([]);
  const [selectedPictograms, setSelectedPictograms] = useState<string[]>([]);
  const [hmisHealth, setHmisHealth] = useState("2");
  const [hmisFlammability, setHmisFlammability] = useState("3");
  const [hmisPhysical, setHmisPhysical] = useState("0");
  const [hmisSpecial, setHmisSpecial] = useState("");
  const [previewZoom, setPreviewZoom] = useState(100);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [aiConfidence, setAiConfidence] = useState(0);
  const [dataSource, setDataSource] = useState<'ai_enhanced' | 'basic_extraction' | 'manual'>('manual');
  const { toast } = useToast();

  // Auto-populate from SDS data
  useEffect(() => {
    if (selectedDocument) {
      const sdsData = extractSDSData(selectedDocument);
      
      if (sdsData.productName && !initialProductName) setProductName(sdsData.productName);
      if (sdsData.manufacturer && !initialManufacturer) setManufacturer(sdsData.manufacturer);
      if (sdsData.casNumber) setCasNumber(sdsData.casNumber);
      if (sdsData.chemicalFormula) setChemicalFormula(sdsData.chemicalFormula);
      if (sdsData.signalWord) setSignalWord(sdsData.signalWord);
      if (sdsData.hazardCodes) setSelectedHazards(sdsData.hazardCodes);
      if (sdsData.pictograms) setSelectedPictograms(sdsData.pictograms);
      if (sdsData.ppeRequirements) setPpeRequirements(sdsData.ppeRequirements);
      
      if (sdsData.hmisRatings) {
        if (sdsData.hmisRatings.health) setHmisHealth(sdsData.hmisRatings.health);
        if (sdsData.hmisRatings.flammability) setHmisFlammability(sdsData.hmisRatings.flammability);
        if (sdsData.hmisRatings.physical) setHmisPhysical(sdsData.hmisRatings.physical);
      }
    }
  }, [selectedDocument, initialProductName, initialManufacturer]);

  // Auto-populate from enhanced SDS data with AI prioritization
  useEffect(() => {
    if (selectedDocument) {
      const sdsData = extractEnhancedSDSData(selectedDocument);
      
      if (sdsData.productName && !initialProductName) setProductName(sdsData.productName);
      if (sdsData.manufacturer && !initialManufacturer) setManufacturer(sdsData.manufacturer);
      if (sdsData.casNumber) setCasNumber(sdsData.casNumber);
      if (sdsData.chemicalFormula) setChemicalFormula(sdsData.chemicalFormula);
      if (sdsData.chemicalCompound) setChemicalCompound(sdsData.chemicalCompound);
      if (sdsData.productId) setProductId(sdsData.productId);
      if (sdsData.signalWord) setSignalWord(sdsData.signalWord);
      if (sdsData.hazardCodes) setSelectedHazards(sdsData.hazardCodes);
      if (sdsData.pictograms) setSelectedPictograms(sdsData.pictograms);
      if (sdsData.ppeRequirements) setPpeRequirements(sdsData.ppeRequirements);
      
      if (sdsData.hmisRatings) {
        if (sdsData.hmisRatings.health) setHmisHealth(sdsData.hmisRatings.health);
        if (sdsData.hmisRatings.flammability) setHmisFlammability(sdsData.hmisRatings.flammability);
        if (sdsData.hmisRatings.physical) setHmisPhysical(sdsData.hmisRatings.physical);
        if (sdsData.hmisRatings.special) setHmisSpecial(sdsData.hmisRatings.special);
      }
      
      setAiConfidence(sdsData.extractionConfidence || 0);
      setDataSource(sdsData.dataSource || 'manual');
    }
  }, [selectedDocument, initialProductName, initialManufacturer]);

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
    { id: "exclamation", name: "Exclamation Mark", imageUrl: "/lovable-uploads/c3e43723-722a-4ee7-92e0-9e18aa38e402.png" },
    { id: "health_hazard", name: "Health Hazard", imageUrl: "/lovable-uploads/c77d1a55-2c1d-48b4-9715-68c6c3249d91.png" },
    { id: "gas_cylinder", name: "Gas Cylinder", imageUrl: "/lovable-uploads/0bd57060-18fb-4ad6-8485-e5521c2e7b71.png" },
    { id: "corrosion", name: "Corrosion", imageUrl: "/lovable-uploads/5146a1d1-bc42-4a39-ae55-cf61a2dc012f.png" },
    { id: "skull_crossbones", name: "Skull and Crossbones", imageUrl: "/lovable-uploads/4c13f8f5-8a47-4c2d-a5ed-90cdf7a521c0.png" },
    { id: "exploding_bomb", name: "Exploding Bomb", imageUrl: "/lovable-uploads/908b3ab5-a4ce-4a8d-a700-8eba7f9f0533.png" },
    { id: "flame", name: "Flame", imageUrl: "/lovable-uploads/833367f7-138f-4e1f-b4c6-2bfdfd6901b3.png" },
    { id: "flame_over_circle", name: "Flame Over Circle", imageUrl: "/lovable-uploads/3c1d4332-95eb-44a9-bfef-207e02156b08.png" },
    { id: "environment", name: "Environment", imageUrl: "/lovable-uploads/56985d36-8ad8-4521-a737-19d7eb00ceab.png" }
  ];

  const labelSizes = [
    { value: "2x4", label: "2\" × 4\"", width: 200, height: 400 },
    { value: "4x6", label: "4\" × 6\"", width: 400, height: 600 },
    { value: "6x8", label: "6\" × 8\"", width: 600, height: 800 },
    { value: "8x10", label: "8\" × 10\"", width: 800, height: 1000 },
    { value: "custom", label: "Custom Size", width: 400, height: 600 }
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
          casNumber,
          chemicalFormula,
          productId,
          ppeRequirements,
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
          casNumber,
          chemicalFormula,
          productId,
          ppeRequirements,
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

  const handleEnhanceWithAI = async () => {
    if (!selectedDocument) return;
    
    setIsEnhancing(true);
    try {
      console.log('🤖 Requesting AI-enhanced SDS extraction...');
      
      const { data, error } = await supabase.functions.invoke('ai-enhanced-sds-extraction', {
        body: { document_id: selectedDocument.id }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "AI Enhancement Complete",
          description: `Data extracted with ${data.confidence}% confidence. Refreshing form...`
        });
        
        // Refresh the form with new AI data
        window.location.reload();
      }
    } catch (error) {
      console.error('AI enhancement error:', error);
      toast({
        title: "AI Enhancement Error",
        description: "Unable to enhance data with AI. Using existing extraction.",
        variant: "destructive"
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  const selectedLabelSize = labelSizes.find(size => size.value === labelSize) || labelSizes[1];
  const previewWidth = (selectedLabelSize.width * previewZoom) / 100;
  const previewHeight = (selectedLabelSize.height * previewZoom) / 100;

  const getDataSourceBadge = (hasData: boolean) => {
    if (!hasData) return null;
    
    const badgeProps = {
      'ai_enhanced': { className: "ml-2 bg-green-100 text-green-800 text-xs", text: `AI Enhanced (${aiConfidence}%)` },
      'basic_extraction': { className: "ml-2 bg-blue-100 text-blue-800 text-xs", text: "Auto Extracted" },
      'manual': { className: "ml-2 bg-gray-100 text-gray-800 text-xs", text: "Manual Entry" }
    };
    
    const props = badgeProps[dataSource] || badgeProps.manual;
    
    return (
      <Badge variant="secondary" className={props.className}>
        {props.text}
      </Badge>
    );
  };

  return (
    <ResizablePanelGroup direction="horizontal" className="h-full">
      {/* Form Panel */}
      <ResizablePanel defaultSize={60} minSize={40}>
        <div className="h-full overflow-y-auto p-4 space-y-6">
          
          {/* AI Enhancement Section */}
          {selectedDocument && dataSource !== 'ai_enhanced' && (
            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-blue-900 mb-1">🤖 AI-Enhanced Extraction Available</h3>
                  <p className="text-xs text-blue-700">
                    Get more accurate HMIS ratings, PPE requirements, and chemical data using AI analysis.
                  </p>
                </div>
                <Button
                  onClick={handleEnhanceWithAI}
                  disabled={isEnhancing}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  size="sm"
                >
                  {isEnhancing ? 'Enhancing...' : 'Enhance with AI'}
                </Button>
              </div>
            </Card>
          )}

          {/* HMIS Rating - Now the most prominent section */}
          <Card className="p-4 border-2 border-red-200 bg-red-50">
            <h3 className="text-xl font-bold text-red-900 mb-4 flex items-center">
              🏥 HMIS Rating (Most Important)
              {selectedDocument && getDataSourceBadge(true)}
            </h3>
            
            {/* Large HMIS Preview */}
            <div className="flex justify-center mb-6">
              <div className="relative w-32 h-32 border-4 border-black">
                <svg width="128" height="128" viewBox="0 0 128 128" className="absolute inset-0">
                  {/* Health (Blue) - Top Left */}
                  <rect x="0" y="0" width="64" height="64" fill="#3B82F6" stroke="#000" strokeWidth="2"/>
                  <text x="32" y="40" textAnchor="middle" className="text-2xl font-bold fill-white">{hmisHealth}</text>
                  <text x="32" y="55" textAnchor="middle" className="text-xs fill-white">HEALTH</text>
                  
                  {/* Flammability (Red) - Top Right */}
                  <rect x="64" y="0" width="64" height="64" fill="#EF4444" stroke="#000" strokeWidth="2"/>
                  <text x="96" y="40" textAnchor="middle" className="text-2xl font-bold fill-white">{hmisFlammability}</text>
                  <text x="96" y="55" textAnchor="middle" className="text-xs fill-white">FIRE</text>
                  
                  {/* Physical (Yellow) - Bottom Left */}
                  <rect x="0" y="64" width="64" height="64" fill="#FDE047" stroke="#000" strokeWidth="2"/>
                  <text x="32" y="104" textAnchor="middle" className="text-2xl font-bold fill-black">{hmisPhysical}</text>
                  <text x="32" y="119" textAnchor="middle" className="text-xs fill-black">PHYSICAL</text>
                  
                  {/* Special (White) - Bottom Right */}
                  <rect x="64" y="64" width="64" height="64" fill="#FFFFFF" stroke="#000" strokeWidth="2"/>
                  <text x="96" y="104" textAnchor="middle" className="text-xl font-bold fill-black">{hmisSpecial || "—"}</text>
                  <text x="96" y="119" textAnchor="middle" className="text-xs fill-black">SPECIAL</text>
                </svg>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="hmisHealth" className="text-sm font-semibold">Health (Blue) *</Label>
                <Select value={hmisHealth} onValueChange={setHmisHealth}>
                  <SelectTrigger className="mt-1 border-2 border-blue-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2, 3, 4].map((rating) => (
                      <SelectItem key={rating} value={rating.toString()}>
                        {rating} - {['Minimal', 'Slight', 'Moderate', 'Serious', 'Severe'][rating]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="hmisFlammability" className="text-sm font-semibold">Flammability (Red) *</Label>
                <Select value={hmisFlammability} onValueChange={setHmisFlammability}>
                  <SelectTrigger className="mt-1 border-2 border-red-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2, 3, 4].map((rating) => (
                      <SelectItem key={rating} value={rating.toString()}>
                        {rating} - {['Will not burn', 'Above 200°F', 'Above 100°F', 'Below 100°F', 'Below 73°F'][rating]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="hmisPhysical" className="text-sm font-semibold">Physical (Yellow) *</Label>
                <Select value={hmisPhysical} onValueChange={setHmisPhysical}>
                  <SelectTrigger className="mt-1 border-2 border-yellow-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2, 3, 4].map((rating) => (
                      <SelectItem key={rating} value={rating.toString()}>
                        {rating} - {['Stable', 'Unstable if heated', 'Violent change', 'Shock/heat', 'May detonate'][rating]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="hmisSpecial" className="text-sm font-semibold">Special (White)</Label>
                <Input
                  id="hmisSpecial"
                  value={hmisSpecial}
                  onChange={(e) => setHmisSpecial(e.target.value)}
                  placeholder="OX, W, etc."
                  className="mt-1"
                />
              </div>
            </div>
          </Card>

          {/* Product Information */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              📋 Product Information
              {selectedDocument && getDataSourceBadge(true)}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="productName">Product Title *</Label>
                <Input
                  id="productName"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Enter product title"
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
              <div>
                <Label htmlFor="chemicalCompound">Chemical Compound</Label>
                <Input
                  id="chemicalCompound"
                  value={chemicalCompound}
                  onChange={(e) => setChemicalCompound(e.target.value)}
                  placeholder="Enter chemical compound name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="chemicalFormula">Chemical Formula</Label>
                <Input
                  id="chemicalFormula"
                  value={chemicalFormula}
                  onChange={(e) => setChemicalFormula(e.target.value)}
                  placeholder="Enter chemical formula"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="productId">Product ID / Lot Number</Label>
                <Input
                  id="productId"
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  placeholder="Enter product ID or lot number"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="casNumber">CAS Number</Label>
                <Input
                  id="casNumber"
                  value={casNumber}
                  onChange={(e) => setCasNumber(e.target.value)}
                  placeholder="Enter CAS number"
                  className="mt-1"
                  readOnly={!!selectedDocument}
                />
              </div>
            </div>
          </Card>

          {/* PPE Requirements */}
          {ppeRequirements.length > 0 && (
            <Card className="p-4 bg-orange-50 border-orange-200">
              <h3 className="text-lg font-semibold text-orange-900 mb-4">
                🦺 Required PPE
                {getDataSourceBadge(true)}
              </h3>
              <div className="flex flex-wrap gap-2">
                {ppeRequirements.map((ppe, index) => (
                  <Badge key={index} variant="outline" className="bg-orange-100 text-orange-800 border-orange-300 text-sm px-3 py-1">
                    {ppe}
                  </Badge>
                ))}
              </div>
            </Card>
          )}

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
                {selectedDocument && getDataSourceBadge(true)}
              </div>
            </div>
          </Card>

          {/* GHS Hazard Statements */}
          <Card className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              GHS Hazard Statements
              {selectedDocument && selectedHazards.length > 0 && getDataSourceBadge(true)}
            </h3>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              GHS Pictograms
              {selectedDocument && selectedPictograms.length > 0 && getDataSourceBadge(true)}
            </h3>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              {pictograms.map((pictogram) => (
                <div
                  key={pictogram.id}
                  onClick={() => handlePictogramToggle(pictogram.id)}
                  className={`p-2 border-2 rounded-lg cursor-pointer text-center transition-colors ${
                    selectedPictograms.includes(pictogram.id)
                      ? 'border-gray-800 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <div className="w-12 h-12 mx-auto mb-1">
                    <img 
                      src={pictogram.imageUrl} 
                      alt={pictogram.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="text-xs font-medium">{pictogram.name}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex space-x-3 justify-center pb-4">
            <Button
              onClick={handleDownloadLabel}
              disabled={!productName.trim() || hmisHealth === "" || hmisFlammability === "" || hmisPhysical === ""}
              className="bg-gray-800 hover:bg-gray-900 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Label
            </Button>
            <Button
              onClick={handlePrintLabel}
              disabled={!productName.trim() || hmisHealth === "" || hmisFlammability === "" || hmisPhysical === ""}
              variant="outline"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print Label
            </Button>
          </div>
        </div>
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* Preview Panel */}
      <ResizablePanel defaultSize={40} minSize={30}>
        <div className="h-full flex flex-col">
          {/* Zoom Controls */}
          <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Label Preview</h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">{previewZoom}% scale</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewZoom(Math.max(25, previewZoom - 25))}
                disabled={previewZoom <= 25}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewZoom(Math.min(200, previewZoom + 25))}
                disabled={previewZoom >= 200}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewZoom(100)}
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Enhanced Preview Content with HMIS Prominence */}
          <div className="flex-1 overflow-auto p-4 bg-gray-100 flex items-center justify-center">
            <div 
              className="bg-white border-2 border-gray-800 p-4 shadow-lg"
              style={{ 
                width: `${previewWidth}px`, 
                height: `${previewHeight}px`,
                minWidth: '200px',
                minHeight: '300px'
              }}
            >
              <div className="h-full flex flex-col justify-between space-y-2">
                {/* Product Title - Prominent */}
                <div className="text-center border-b-2 border-gray-800 pb-2">
                  <div className="text-lg font-bold">{productName || "Product Name"}</div>
                  {chemicalCompound && <div className="text-sm font-medium">{chemicalCompound}</div>}
                  {manufacturer && <div className="text-xs">{manufacturer}</div>}
                  {productId && <div className="text-xs">ID: {productId}</div>}
                </div>
                
                {/* HMIS - Most Prominent Feature */}
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-sm font-bold mb-2">HMIS RATING</div>
                    <div className="relative w-20 h-20 mx-auto">
                      <svg width="80" height="80" viewBox="0 0 80 80" className="absolute inset-0">
                        <rect x="0" y="0" width="40" height="40" fill="#3B82F6" stroke="#000" strokeWidth="1"/>
                        <rect x="40" y="0" width="40" height="40" fill="#EF4444" stroke="#000" strokeWidth="1"/>
                        <rect x="0" y="40" width="40" height="40" fill="#FDE047" stroke="#000" strokeWidth="1"/>
                        <rect x="40" y="40" width="40" height="40" fill="#FFFFFF" stroke="#000" strokeWidth="1"/>
                        
                        <text x="20" y="28" textAnchor="middle" className="text-lg font-bold fill-white">{hmisHealth}</text>
                        <text x="60" y="28" textAnchor="middle" className="text-lg font-bold fill-white">{hmisFlammability}</text>
                        <text x="20" y="68" textAnchor="middle" className="text-lg font-bold fill-black">{hmisPhysical}</text>
                        <text x="60" y="68" textAnchor="middle" className="text-sm font-bold fill-black">{hmisSpecial || ""}</text>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-1 text-center text-xs">
                  {casNumber && <div>CAS: {casNumber}</div>}
                  {chemicalFormula && <div>{chemicalFormula}</div>}
                  
                  {selectedPictograms.length > 0 && (
                    <div className="flex justify-center space-x-1 py-1">
                      {selectedPictograms.slice(0, 4).map((id) => {
                        const pictogram = pictograms.find(p => p.id === id);
                        return pictogram ? (
                          <div key={id} className="w-4 h-4">
                            <img 
                              src={pictogram.imageUrl} 
                              alt={pictogram.name}
                              className="w-full h-full object-contain"
                            />
                          </div>
                        ) : null;
                      })}
                    </div>
                  )}

                  {ppeRequirements.length > 0 && (
                    <div className="border-t border-gray-300 pt-1">
                      <div className="font-bold">PPE Required</div>
                      <div>{ppeRequirements.slice(0, 2).join(', ')}{ppeRequirements.length > 2 && '...'}</div>
                    </div>
                  )}

                  {/* Print date */}
                  <div className="border-t border-gray-300 pt-1 text-xs text-gray-500">
                    Printed: {new Date().toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default LabelPrinter;
