
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
                      <div className="bg-blue-100 text-blue-800 font-bold text-lg py-2 rounded">
                        {extractedData.hmis_codes.health || '0'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs font-medium text-gray-600 mb-1">Flammability</div>
                      <div className="bg-red-100 text-red-800 font-bold text-lg py-2 rounded">
                        {extractedData.hmis_codes.flammability || '0'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs font-medium text-gray-600 mb-1">Physical</div>
                      <div className="bg-yellow-100 text-yellow-800 font-bold text-lg py-2 rounded">
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

          {/* GHS Pictograms */}
          {extractedData.pictograms && extractedData.pictograms.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">GHS Pictograms</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {extractedData.pictograms.map((pictogram, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {pictogram.replace(/_/g, ' ')}
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
