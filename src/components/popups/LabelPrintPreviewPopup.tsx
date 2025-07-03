import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Printer, Grid, RotateCcw } from "lucide-react";
import { SafetyLabel } from '@/components/SafetyLabel';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface LabelPrintPreviewPopupProps {
  isOpen: boolean;
  onClose: () => void;
  labelData: {
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
  };
  labelWidth?: number;
  labelHeight?: number;
}

const LabelPrintPreviewPopup = ({ 
  isOpen, 
  onClose, 
  labelData,
  labelWidth = 288,
  labelHeight = 192
}: LabelPrintPreviewPopupProps) => {
  const [selectedSize, setSelectedSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [layoutMode, setLayoutMode] = useState<'single' | 'sheet4' | 'sheet8' | 'sheet15'>('single');
  const [isGenerating, setIsGenerating] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const labelSizes = {
    small: { width: 288, height: 192, name: '2" × 1.33"' },
    medium: { width: 432, height: 288, name: '3" × 2"' },
    large: { width: 576, height: 384, name: '4" × 2.67"' }
  };

  const layoutOptions = {
    single: { count: 1, cols: 1, rows: 1, name: 'Single Label' },
    sheet4: { count: 4, cols: 2, rows: 2, name: '2×2 Sheet (4 labels)' },
    sheet8: { count: 8, cols: 2, rows: 4, name: '2×4 Sheet (8 labels)' },
    sheet15: { count: 15, cols: 3, rows: 5, name: '3×5 Sheet (15 labels)' }
  };

  const currentSize = labelSizes[selectedSize];
  const currentLayout = layoutOptions[layoutMode];

  const handlePrint = async () => {
    if (!previewRef.current) {
      toast.error('Preview not ready for printing');
      return;
    }

    try {
      setIsGenerating(true);
      toast.info('Preparing labels for printing...');

      const canvas = await html2canvas(previewRef.current, {
        backgroundColor: 'white',
        scale: 3, // High resolution for crisp printing
        logging: false,
        useCORS: true,
        onclone: (clonedDoc) => {
          // Optimize for printing by removing shadows and effects
          const clonedElements = clonedDoc.querySelectorAll('.safety-label');
          clonedElements.forEach((el: any) => {
            el.style.boxShadow = 'none';
            el.style.borderRadius = '0';
          });
        }
      });

      // Create print window
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const imgData = canvas.toDataURL('image/png');
        
        printWindow.document.write(`
          <html>
            <head>
              <title>Safety Labels - ${labelData.productName}</title>
              <style>
                body { 
                  margin: 0; 
                  padding: 20px; 
                  display: flex; 
                  justify-content: center; 
                  align-items: center; 
                  min-height: 100vh; 
                  background: white;
                  font-family: Arial, sans-serif;
                }
                .print-container {
                  text-align: center;
                }
                img { 
                  max-width: 100%; 
                  height: auto; 
                  border: 1px solid #ccc;
                  margin-bottom: 20px;
                }
                .print-info {
                  font-size: 12px;
                  color: #666;
                  margin-bottom: 10px;
                }
                @page { 
                  size: letter; 
                  margin: 0.5in; 
                }
                @media print { 
                  body { padding: 0; }
                  .print-info { display: none; }
                }
              </style>
            </head>
            <body>
              <div class="print-container">
                <div class="print-info">
                  ${labelData.productName} - ${currentSize.name} Labels (${currentLayout.name})<br>
                  Generated: ${new Date().toLocaleString()}
                </div>
                <img src="${imgData}" alt="Safety Labels" />
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }
      
      toast.success('Labels sent to printer');
    } catch (error) {
      console.error('Print generation error:', error);
      toast.error('Failed to generate print layout');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!previewRef.current) {
      toast.error('Preview not ready for download');
      return;
    }

    try {
      setIsGenerating(true);
      toast.info('Generating PDF...');

      const canvas = await html2canvas(previewRef.current, {
        backgroundColor: 'white',
        scale: 2,
        logging: false,
        useCORS: true
      });

      // Create PDF with proper sizing for labels
      const pdf = new jsPDF({
        orientation: currentLayout.cols > currentLayout.rows ? 'landscape' : 'portrait',
        unit: 'pt',
        format: 'letter'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Scale image to fit page with margins
      const margin = 36; // 0.5 inch margins
      const availableWidth = pdfWidth - (margin * 2);
      const availableHeight = pdfHeight - (margin * 2);
      
      const imgAspectRatio = canvas.width / canvas.height;
      const availableAspectRatio = availableWidth / availableHeight;
      
      let finalWidth, finalHeight;
      if (imgAspectRatio > availableAspectRatio) {
        finalWidth = availableWidth;
        finalHeight = availableWidth / imgAspectRatio;
      } else {
        finalHeight = availableHeight;
        finalWidth = availableHeight * imgAspectRatio;
      }
      
      const x = (pdfWidth - finalWidth) / 2;
      const y = (pdfHeight - finalHeight) / 2;
      
      pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight);

      // Download the PDF
      const fileName = `safety-labels-${labelData.productName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${currentLayout.name.toLowerCase().replace(/\s+/g, '_')}.pdf`;
      pdf.save(fileName);
      
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  const renderLabels = () => {
    const labels = [];
    for (let i = 0; i < currentLayout.count; i++) {
      labels.push(
        <SafetyLabel
          key={i}
          {...labelData}
          labelWidth={currentSize.width}
          labelHeight={currentSize.height}
        />
      );
    }
    return labels;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Printer className="w-5 h-5" />
            Label Print Preview - {labelData.productName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Label Size
              </label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(labelSizes).map(([key, size]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedSize(key as any)}
                    className={`p-2 text-xs rounded border transition-colors ${
                      selectedSize === key
                        ? 'bg-blue-100 border-blue-500 text-blue-700'
                        : 'bg-white border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium">{size.name}</div>
                    <div className="text-gray-500">{size.width}×{size.height}px</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Print Layout
              </label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(layoutOptions).map(([key, layout]) => (
                  <button
                    key={key}
                    onClick={() => setLayoutMode(key as any)}
                    className={`p-2 text-xs rounded border transition-colors ${
                      layoutMode === key
                        ? 'bg-green-100 border-green-500 text-green-700'
                        : 'bg-white border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium">{layout.name}</div>
                    <div className="text-gray-500">{layout.cols}×{layout.rows} grid</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-100 p-6 rounded-lg">
            <div className="text-center mb-4">
              <Badge variant="outline" className="bg-white">
                Preview - {currentSize.name} Labels ({currentLayout.name})
              </Badge>
            </div>
            
            <div className="flex justify-center">
              <div 
                ref={previewRef}
                className="bg-white p-4 rounded shadow-sm"
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${currentLayout.cols}, 1fr)`,
                  gridTemplateRows: `repeat(${currentLayout.rows}, 1fr)`,
                  gap: '8px',
                  maxWidth: '100%',
                  transform: layoutMode === 'single' ? 'scale(1.2)' : 'scale(0.8)',
                  transformOrigin: 'center'
                }}
              >
                {renderLabels()}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <Button 
              onClick={handlePrint}
              disabled={isGenerating}
              className="bg-gray-800 hover:bg-gray-900 text-white flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              {isGenerating ? 'Preparing...' : 'Print Labels'}
            </Button>
            
            <Button 
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {isGenerating ? 'Generating...' : 'Download PDF'}
            </Button>

            <Button 
              onClick={onClose}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Edit Label
            </Button>
          </div>

          {/* Print Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <Grid className="w-4 h-4" />
              Print Instructions
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Preview shows exactly how labels will appear when printed</li>
              <li>• {currentSize.name} labels are optimized for standard label sheets</li>
              <li>• Multi-label sheets include proper spacing for easy cutting</li>
              <li>• Use "Print Labels" for immediate printing with proper scaling</li>
              <li>• Use "Download PDF" to save or print later with consistent quality</li>
              <li>• All safety data is automatically extracted from SDS documents</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LabelPrintPreviewPopup;