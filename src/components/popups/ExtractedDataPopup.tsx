import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, AlertTriangle, Printer, Eye, Shield } from 'lucide-react';

interface ExtractedDataPopupProps {
  isOpen: boolean;
  onClose: () => void;
  extractedData: {
    product_name?: string;
    manufacturer?: string;
    cas_number?: string;
    signal_word?: string;
    hmis_codes?: any;
    h_codes?: Array<{ code: string; description: string }>;
    pictograms?: string[];
    confidence_score?: number;
    extraction_status?: string;
    prioritized_pictograms?: boolean;
  };
  onPrintLabel: () => void;
  onViewDocument?: () => void;
}

const ExtractedDataPopup: React.FC<ExtractedDataPopupProps> = ({
  isOpen,
  onClose,
  extractedData,
  onPrintLabel,
  onViewDocument
}) => {
  // Enhanced GHS Pictogram mapping with all 9 standard pictograms
  const pictogramImages: Record<string, { name: string; imageUrl: string }> = {
    'exploding_bomb': { name: 'Exploding Bomb', imageUrl: '/lovable-uploads/0176f010-3f53-485e-8013-37c80276e905.png' },
    'flame': { name: 'Flame', imageUrl: '/lovable-uploads/615d7b02-13d9-41b9-8319-db0e7e1cc52d.png' },
    'flame_over_circle': { name: 'Flame Over Circle', imageUrl: '/lovable-uploads/881c9dcf-f0ac-4fe5-98e5-1f64a3fa6f8d.png' },
    'gas_cylinder': { name: 'Gas Cylinder', imageUrl: '/lovable-uploads/8f73c238-da2e-4a6c-bbec-0fda7667459d.png' },
    'corrosion': { name: 'Corrosion', imageUrl: '/lovable-uploads/a1dff518-a5ad-4880-b8ee-8a036fbfe0c4.png' },
    'skull_crossbones': { name: 'Skull and Crossbones', imageUrl: '/lovable-uploads/9ccb65e8-0bd7-41f0-bd11-2e210d5e370f.png' },
    'exclamation': { name: 'Exclamation Mark', imageUrl: '/lovable-uploads/933bd224-1e9d-413f-88f7-577fbaeeaa0f.png' },
    'health_hazard': { name: 'Health Hazard', imageUrl: '/lovable-uploads/29b232e2-4dd4-477e-abe9-4203ff098880.png' },
    'environment': { name: 'Environment', imageUrl: '/lovable-uploads/56985d36-8ad8-4521-a737-19d7eb00ceab.png' },
    // Add alternative naming patterns that AI might use
    'ghs01': { name: 'Exploding Bomb', imageUrl: '/lovable-uploads/0176f010-3f53-485e-8013-37c80276e905.png' },
    'ghs02': { name: 'Flame', imageUrl: '/lovable-uploads/615d7b02-13d9-41b9-8319-db0e7e1cc52d.png' },
    'ghs03': { name: 'Flame Over Circle', imageUrl: '/lovable-uploads/881c9dcf-f0ac-4fe5-98e5-1f64a3fa6f8d.png' },
    'ghs04': { name: 'Gas Cylinder', imageUrl: '/lovable-uploads/8f73c238-da2e-4a6c-bbec-0fda7667459d.png' },
    'ghs05': { name: 'Corrosion', imageUrl: '/lovable-uploads/a1dff518-a5ad-4880-b8ee-8a036fbfe0c4.png' },
    'ghs06': { name: 'Skull and Crossbones', imageUrl: '/lovable-uploads/9ccb65e8-0bd7-41f0-bd11-2e210d5e370f.png' },
    'ghs07': { name: 'Exclamation Mark', imageUrl: '/lovable-uploads/933bd224-1e9d-413f-88f7-577fbaeeaa0f.png' },
    'ghs08': { name: 'Health Hazard', imageUrl: '/lovable-uploads/29b232e2-4dd4-477e-abe9-4203ff098880.png' },
    'ghs09': { name: 'Environment', imageUrl: '/lovable-uploads/56985d36-8ad8-4521-a737-19d7eb00ceab.png' },
    // OpenAI often returns these formats
    'corros': { name: 'Corrosion', imageUrl: '/lovable-uploads/a1dff518-a5ad-4880-b8ee-8a036fbfe0c4.png' },
    'exclam': { name: 'Exclamation Mark', imageUrl: '/lovable-uploads/933bd224-1e9d-413f-88f7-577fbaeeaa0f.png' },
    'health': { name: 'Health Hazard', imageUrl: '/lovable-uploads/29b232e2-4dd4-477e-abe9-4203ff098880.png' }
  };

  // Enhanced pictogram matching function
  const getPictogramData = (pictogramId: string) => {
    const normalizedId = pictogramId.toLowerCase().replace(/[-\s_]/g, '');
    
    // Direct match first
    if (pictogramImages[normalizedId]) {
      return pictogramImages[normalizedId];
    }
    
    // Pattern matching for common variations
    if (normalizedId.includes('flame') && !normalizedId.includes('over') && !normalizedId.includes('circle')) {
      return pictogramImages['flame'];
    }
    if (normalizedId.includes('flame') && (normalizedId.includes('over') || normalizedId.includes('circle'))) {
      return pictogramImages['flame_over_circle'];
    }
    if (normalizedId.includes('corros') || normalizedId.includes('acid')) {
      return pictogramImages['corrosion'];
    }
    if (normalizedId.includes('skull') || normalizedId.includes('toxic') || normalizedId.includes('poison')) {
      return pictogramImages['skull_crossbones'];
    }
    if (normalizedId.includes('health') || normalizedId.includes('hazard')) {
      return pictogramImages['health_hazard'];
    }
    if (normalizedId.includes('excla') || normalizedId.includes('irritant') || normalizedId.includes('harmful')) {
      return pictogramImages['exclamation'];
    }
    if (normalizedId.includes('explo') || normalizedId.includes('bomb')) {
      return pictogramImages['exploding_bomb'];
    }
    if (normalizedId.includes('gas') || normalizedId.includes('cylinder') || normalizedId.includes('pressure')) {
      return pictogramImages['gas_cylinder'];
    }
    if (normalizedId.includes('env') || normalizedId.includes('aquatic') || normalizedId.includes('fish')) {
      return pictogramImages['environment'];
    }
    
    return null;
  };

  const getStatusInfo = () => {
    const status = extractedData.extraction_status;
    const confidence = extractedData.confidence_score || 0;
    
    if (status === 'osha_compliant') {
      return {
        icon: Shield,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        title: 'OSHA Compliant',
        description: 'All safety data has been successfully extracted and verified.'
      };
    } else if (confidence >= 80) {
      return {
        icon: CheckCircle,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        title: 'High Confidence',
        description: 'Label data extracted with high confidence.'
      };
    } else {
      return {
        icon: AlertTriangle,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        title: 'Manual Review Recommended',
        description: 'Please verify the extracted data before printing labels.'
      };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Label Data Successfully Extracted
            {extractedData.prioritized_pictograms && (
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                Pictograms Prioritized
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Card */}
          <Card className={`${statusInfo.bgColor} ${statusInfo.borderColor} border-2`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <StatusIcon className={`w-6 h-6 ${statusInfo.color}`} />
                <div>
                  <h3 className={`font-semibold ${statusInfo.color}`}>
                    {statusInfo.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {statusInfo.description}
                  </p>
                </div>
                {extractedData.confidence_score && (
                  <div className="ml-auto text-right">
                    <div className="text-sm font-medium">
                      {Math.round(extractedData.confidence_score)}%
                    </div>
                    <div className="text-xs text-gray-500">Confidence</div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Product Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Product Name</label>
                  <p className="text-sm bg-gray-50 p-2 rounded">
                    {extractedData.product_name || 'Not extracted'}
                  </p>
                </div>
                {extractedData.manufacturer && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Manufacturer</label>
                    <p className="text-sm bg-gray-50 p-2 rounded">
                      {extractedData.manufacturer}
                    </p>
                  </div>
                )}
                {extractedData.cas_number && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">CAS Number</label>
                    <p className="text-sm bg-gray-50 p-2 rounded">
                      {extractedData.cas_number}
                    </p>
                  </div>
                )}
                {extractedData.signal_word && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Signal Word</label>
                    <Badge variant="outline" className="mt-1">
                      {extractedData.signal_word}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* HMIS Ratings */}
            {extractedData.hmis_codes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">HMIS Ratings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center">
                      <div className="text-xs font-medium text-gray-600 mb-1">Health</div>
                      <div className="bg-blue-500 text-white font-bold text-lg py-2 rounded">
                        {extractedData.hmis_codes.health || '0'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs font-medium text-gray-600 mb-1">Flammability</div>
                      <div className="bg-red-500 text-white font-bold text-lg py-2 rounded">
                        {extractedData.hmis_codes.flammability || '0'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs font-medium text-gray-600 mb-1">Physical</div>
                      <div className="bg-yellow-500 text-black font-bold text-lg py-2 rounded">
                        {extractedData.hmis_codes.physical || '0'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs font-medium text-gray-600 mb-1">PPE</div>
                      <div className="bg-gray-100 text-gray-800 font-bold text-lg py-2 rounded">
                        {extractedData.hmis_codes.special || 'A'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Enhanced GHS Pictograms Display */}
          {extractedData.pictograms && extractedData.pictograms.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  GHS Pictograms ({extractedData.pictograms.length} detected)
                  {extractedData.prioritized_pictograms && (
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                      Prioritized from SDS
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {extractedData.pictograms.map((pictogramId, index) => {
                    console.log('🎯 Processing pictogram:', pictogramId, 'Index:', index);
                    console.log('🔍 Available pictogram mappings:', Object.keys(pictogramImages));
                    const pictogramData = getPictogramData(pictogramId);
                    console.log('📊 Mapped pictogram data:', pictogramData);
                    
                    return (
                      <div key={index} className="text-center">
                        {pictogramData ? (
                          <>
                            <div className="w-20 h-20 mx-auto mb-3 flex items-center justify-center border-2 border-gray-200 rounded-lg bg-white shadow-sm">
                               <img 
                                src={pictogramData.imageUrl} 
                                alt={pictogramData.name}
                                className="w-16 h-16 object-contain"
                                onLoad={() => console.log('✅ Pictogram loaded:', pictogramData.name, pictogramData.imageUrl)}
                                onError={(e) => {
                                  console.error('❌ Failed to load pictogram image:', pictogramData.imageUrl);
                                  console.error('❌ Original pictogram ID:', pictogramId);
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            </div>
                            <p className="text-sm font-medium text-gray-700">{pictogramData.name}</p>
                            <p className="text-xs text-gray-500 mt-1">GHS Standard</p>
                          </>
                        ) : (
                          <>
                            <div className="w-20 h-20 mx-auto mb-3 flex items-center justify-center border-2 border-orange-200 rounded-lg bg-orange-50">
                              <span className="text-xs text-orange-600 font-medium text-center px-1">
                                {pictogramId}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-orange-600">Unknown Pictogram</p>
                            <p className="text-xs text-gray-500 mt-1">Needs mapping</p>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
                {extractedData.pictograms.some(p => !getPictogramData(p)) && (
                  <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-sm text-orange-700">
                      <strong>Note:</strong> Some pictograms couldn't be matched to standard GHS symbols. 
                      Please verify the extracted data manually.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Hazard Codes */}
          {extractedData.h_codes && extractedData.h_codes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Hazard Codes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {extractedData.h_codes.map((hCode, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {hCode.code}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <div className="flex gap-2">
              {onViewDocument && (
                <Button variant="outline" onClick={onViewDocument}>
                  <Eye className="w-4 h-4 mr-2" />
                  View Document
                </Button>
              )}
              <Button onClick={onPrintLabel} className="bg-green-600 hover:bg-green-700">
                <Printer className="w-4 h-4 mr-2" />
                Print Label
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExtractedDataPopup;
