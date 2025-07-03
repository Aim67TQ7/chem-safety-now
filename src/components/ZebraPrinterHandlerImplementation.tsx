import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import { ZebraPrintOptions } from './ZebraPrinterIntegration';

// Zebra Programming Language (ZPL) commands
const ZPL_COMMANDS = {
  START: '^XA',
  END: '^XZ',
  LABEL_HOME: '^LH0,0',
  LABEL_WIDTH: (dots: number) => `^PW${dots}`,
  LABEL_LENGTH: (dots: number) => `^LL${dots}`,
  PRINT_ORIENTATION: (inverted: boolean) => `^PO${inverted ? '1' : '0'}`,
  DARKNESS: (level: number) => `^MD${level}`,
  PRINT_RATE: (ips: number) => `^PR${ips}`,
  QUANTITY: (qty: number) => `^PQ${qty}`,
  BITMAP_FIELD: (x: number, y: number, width: number, height: number) => 
    `^FO${x},${y}^GFA,${width*height/8},${width*height/8},${width},`,
  MEDIA_DIRECT_THERMAL: (directThermal: boolean) => `^MTD,${directThermal ? 'T' : 'R'}`,
  GAP_SENSING: (gap: number, dpi: number) => `^BY${Math.round(gap * dpi)}`
};

// Helper function to convert image data to ZPL format
function imageToZPL(imageData: ImageData, options: {
  width: number;
  height: number;
  threshold?: number; // Threshold for black/white conversion (0-255)
}): string {
  const { width, height, threshold = 127 } = options;
  const data = imageData.data;
  let zplOutput = '';
  
  // Convert to 1-bit monochrome (ZPL format)
  // Each byte represents 8 pixels
  for (let y = 0; y < height; y++) {
    let byteVal = 0;
    let bitPos = 0;
    
    for (let x = 0; x < width; x++) {
      // Get pixel position in the array (RGBA format)
      const pos = (y * width + x) * 4;
      
      // Calculate grayscale value: 0.3R + 0.59G + 0.11B
      const grayValue = 
        0.3 * data[pos] + 
        0.59 * data[pos + 1] + 
        0.11 * data[pos + 2];
      
      // Set the bit if the pixel is dark
      if (grayValue < threshold) {
        byteVal |= (1 << (7 - bitPos));
      }
      
      bitPos++;
      
      // When we have 8 bits, output the byte
      if (bitPos === 8 || x === width - 1) {
        // Convert to hex and pad with 0
        zplOutput += byteVal.toString(16).padStart(2, '0');
        byteVal = 0;
        bitPos = 0;
      }
    }
    
    // Add newline for readability in debug
    zplOutput += '\n';
  }
  
  return zplOutput;
}

interface ZebraPrintHandlerProps {
  labelRef: React.RefObject<HTMLDivElement>;
  onPrintComplete?: () => void;
  onPrintError?: (error: Error) => void;
}

export const useZebraPrintHandler = ({
  labelRef,
  onPrintComplete,
  onPrintError
}: ZebraPrintHandlerProps) => {
  const [isPrinting, setIsPrinting] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  
  // Check if Zebra Browser Print is available
  useEffect(() => {
    const checkZebraAvailability = () => {
      // Check if window.BrowserPrint exists (Zebra Browser Print API)
      const isZebraAvailable = !!(window as any).BrowserPrint;
      setIsAvailable(isZebraAvailable);
      
      if (!isZebraAvailable) {
        console.log('Zebra Browser Print not detected. Using simulation mode.');
      }
    };
    
    // Check immediately and after a short delay (for late loading)
    checkZebraAvailability();
    const timer = setTimeout(checkZebraAvailability, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Main print handler function
  const handlePrint = async (options: ZebraPrintOptions) => {
    if (!labelRef.current) {
      toast.error('Label element not found');
      return;
    }
    
    try {
      setIsPrinting(true);
      toast.info(`Preparing label for Zebra ${options.printerModel}...`);
      
      // Capture the label as a canvas
      const canvas = await html2canvas(labelRef.current, {
        backgroundColor: 'white',
        scale: options.dpi / 96, // Convert from screen to printer DPI
        logging: false,
        useCORS: true,
      });
      
      // Convert inches to dots based on DPI
      const widthInDots = Math.round(options.labelWidth * options.dpi);
      const heightInDots = Math.round(options.labelHeight * options.dpi);
      
      // Get image data and generate ZPL
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const zplImageData = imageToZPL(imageData, {
        width: canvas.width,
        height: canvas.height,
        threshold: 150 // Adjust threshold for better print quality
      });
      
      // Generate ZPL command string
      const zplCommand = [
        ZPL_COMMANDS.START,
        ZPL_COMMANDS.LABEL_HOME,
        ZPL_COMMANDS.LABEL_WIDTH(widthInDots),
        ZPL_COMMANDS.LABEL_LENGTH(heightInDots),
        ZPL_COMMANDS.PRINT_ORIENTATION(options.orientation === 'landscape'),
        ZPL_COMMANDS.DARKNESS(options.darkness),
        ZPL_COMMANDS.PRINT_RATE(options.printSpeed),
        ZPL_COMMANDS.QUANTITY(options.copies),
        ZPL_COMMANDS.MEDIA_DIRECT_THERMAL(options.directThermal),
        ZPL_COMMANDS.GAP_SENSING(options.gapBetweenLabels, options.dpi),
        ZPL_COMMANDS.BITMAP_FIELD(0, 0, canvas.width, canvas.height),
        zplImageData,
        ZPL_COMMANDS.END
      ].join('\n');
      
      // If Zebra Browser Print is available, use it
      if (isAvailable) {
        const BrowserPrint = (window as any).BrowserPrint;
        
        // Find the specified printer or use default
        BrowserPrint.getDefaultDevice('printer', (device: any) => {
          if (device) {
            device.send(zplCommand, () => {
              toast.success(`Label sent to ${options.printerName}`);
              setIsPrinting(false);
              if (onPrintComplete) onPrintComplete();
            }, (error: any) => {
              const err = new Error(`Print failed: ${error}`);
              toast.error(err.message);
              setIsPrinting(false);
              if (onPrintError) onPrintError(err);
            });
          } else {
            throw new Error('No Zebra printer found');
          }
        });
      } else {
        // Simulation mode - create a new window with the ZPL preview
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
          throw new Error('Could not open print preview window');
        }
        
        // Convert canvas to image for preview
        const imgData = canvas.toDataURL('image/png');
        
        printWindow.document.write(`
          <html>
            <head>
              <title>Zebra Print Simulation - ${options.printerName}</title>
              <style>
                body { 
                  font-family: system-ui, sans-serif;
                  margin: 0; 
                  padding: 20px;
                  display: flex;
                  flex-direction: column;
                  gap: 20px;
                }
                .preview-container {
                  border: 1px solid #ccc;
                  padding: 20px;
                  border-radius: 5px;
                  background: #f9f9f9;
                }
                .preview-header {
                  display: flex;
                  justify-content: space-between;
                  align-items: center;
                  margin-bottom: 15px;
                }
                .preview-title {
                  font-size: 20px;
                  font-weight: bold;
                  margin: 0;
                }
                .preview-badge {
                  background: #ffe58f;
                  color: #875a00;
                  padding: 5px 10px;
                  border-radius: 4px;
                  font-size: 14px;
                }
                .preview-image {
                  display: block;
                  margin: 20px auto;
                  border: 1px solid #ddd;
                  max-width: 100%;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                .preview-details {
                  display: grid;
                  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                  gap: 10px;
                  margin-top: 20px;
                }
                .preview-detail-item {
                  border: 1px solid #eee;
                  padding: 10px;
                  border-radius: 4px;
                }
                .preview-detail-label {
                  font-weight: bold;
                  color: #555;
                  font-size: 12px;
                  margin-bottom: 5px;
                }
                .preview-detail-value {
                  font-size: 14px;
                }
                .zpl-container {
                  margin-top: 20px;
                  background: #f5f5f5;
                  border: 1px solid #ddd;
                  border-radius: 5px;
                  padding: 15px;
                  overflow: auto;
                  height: 150px;
                }
                .zpl-code {
                  font-family: monospace;
                  font-size: 12px;
                  white-space: pre;
                  line-height: 1.4;
                }
              </style>
            </head>
            <body>
              <div class="preview-container">
                <div class="preview-header">
                  <h1 class="preview-title">Zebra Print Preview</h1>
                  <span class="preview-badge">Simulation Mode</span>
                </div>
                
                <p>This is a simulation of how your label would print on a Zebra ${options.printerModel} printer.</p>
                
                <img src="${imgData}" alt="Label Preview" class="preview-image" style="width: ${options.labelWidth}in; height: ${options.labelHeight}in;" />
                
                <div class="preview-details">
                  <div class="preview-detail-item">
                    <div class="preview-detail-label">Printer Model</div>
                    <div class="preview-detail-value">${options.printerModel}</div>
                  </div>
                  <div class="preview-detail-item">
                    <div class="preview-detail-label">Label Size</div>
                    <div class="preview-detail-value">${options.labelWidth}" × ${options.labelHeight}"</div>
                  </div>
                  <div class="preview-detail-item">
                    <div class="preview-detail-label">Resolution</div>
                    <div class="preview-detail-value">${options.dpi} DPI</div>
                  </div>
                  <div class="preview-detail-item">
                    <div class="preview-detail-label">Darkness</div>
                    <div class="preview-detail-value">${options.darkness}</div>
                  </div>
                  <div class="preview-detail-item">
                    <div class="preview-detail-label">Print Speed</div>
                    <div class="preview-detail-value">${options.printSpeed} ips</div>
                  </div>
                  <div class="preview-detail-item">
                    <div class="preview-detail-label">Copies</div>
                    <div class="preview-detail-value">${options.copies}</div>
                  </div>
                </div>
                
                <p><strong>Note:</strong> To print to actual Zebra printers, install the Zebra Browser Print utility and connect your printer.</p>
                
                <div class="zpl-container">
                  <div class="zpl-code">${zplCommand.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
                </div>
              </div>
            </body>
          </html>
        `);
        
        printWindow.document.close();
        
        toast.success('Simulation completed. See preview window for details.');
        setIsPrinting(false);
        if (onPrintComplete) onPrintComplete();
      }
    } catch (error) {
      console.error('Zebra print error:', error);
      toast.error(`Error preparing Zebra print: ${(error as Error).message}`);
      setIsPrinting(false);
      if (onPrintError) onPrintError(error as Error);
    }
  };
  
  return {
    handlePrint,
    isPrinting,
    isAvailable
  };
};
