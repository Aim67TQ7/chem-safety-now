import React from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

interface PrintHandlerProps {
  labelRef: React.RefObject<HTMLDivElement>;
  productName: string;
  physicalWidth: number; // in inches
  physicalHeight: number; // in inches
}

export const useImprovedPrintHandler = ({
  labelRef,
  productName,
  physicalWidth,
  physicalHeight
}: PrintHandlerProps) => {
  // Key improvement: Use a consistent image-based approach for all printing
  // This ensures that what you see is exactly what prints
  
  // Function to create a high-quality image of the label
  const captureLabel = async (scale = 4) => {
    if (!labelRef.current) {
      throw new Error('Label element not found');
    }
    
    // First, temporarily add print-specific styling to ensure colors render correctly
    const originalStyle = labelRef.current.getAttribute('style') || '';
    
    // Apply print-specific styles to ensure color and layout consistency
    const printStyle = `
      ${originalStyle}
      color-adjust: exact !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    `;
    
    // Apply styles to all HMIS boxes to ensure colors print
    const hmisBoxes = labelRef.current.querySelectorAll('.hmis-box');
    const originalHmisStyles: string[] = [];
    
    hmisBoxes.forEach((box, i) => {
      originalHmisStyles[i] = (box as HTMLElement).getAttribute('style') || '';
      const enhancedStyle = `
        ${originalHmisStyles[i]}
        border: 1px solid black !important;
        box-shadow: 0 0 0 1px black !important;
        color-adjust: exact !important;
        -webkit-print-color-adjust: exact !important;
      `;
      (box as HTMLElement).setAttribute('style', enhancedStyle);
    });
    
    // Apply style to element
    labelRef.current.setAttribute('style', printStyle);
    
    try {
      // Capture with high resolution
      const canvas = await html2canvas(labelRef.current, {
        backgroundColor: 'white',
        scale: scale,
        logging: false,
        useCORS: true,
        allowTaint: true, // Allow cross-origin images
        foreignObjectRendering: false, // Better compatibility
        removeContainer: false, // Don't remove the cloned container
      });
      
      // Restore original styles
      labelRef.current.setAttribute('style', originalStyle);
      hmisBoxes.forEach((box, i) => {
        (box as HTMLElement).setAttribute('style', originalHmisStyles[i]);
      });
      
      return canvas;
    } catch (error) {
      // Restore original styles even if capture fails
      labelRef.current.setAttribute('style', originalStyle);
      hmisBoxes.forEach((box, i) => {
        (box as HTMLElement).setAttribute('style', originalHmisStyles[i]);
      });
      throw error;
    }
  };
  
  // Print directly to printer, using image to ensure consistent output
  const printToDesktop = async () => {
    try {
      toast.info('Preparing print...');
      
      // Get high quality image
      const canvas = await captureLabel(6); // Higher resolution for better print quality
      const imgData = canvas.toDataURL('image/png');
      
      // Create a new window optimized for printing with exact dimensions
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Please allow pop-ups to print the label');
      }
      
      // Write a print-optimized document
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Print Safety Label - ${productName}</title>
            <style>
              /* Reset all margins and paddings */
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              
              /* Ensure page is exactly the right size with no margins */
              @page {
                size: ${physicalWidth}in ${physicalHeight}in;
                margin: 0;
              }
              
              /* Body fills exactly the page size */
              body {
                width: ${physicalWidth}in;
                height: ${physicalHeight}in;
                margin: 0;
                padding: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                background: white;
                overflow: hidden;
              }
              
              /* Image exactly fits the container */
              .label-container {
                width: 100%;
                height: 100%;
                display: flex;
                justify-content: center;
                align-items: center;
                overflow: hidden;
              }
              
              img {
                width: 100%;
                height: 100%;
                object-fit: contain;
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
                print-color-adjust: exact;
              }
              
              /* Handle print-specific settings */
              @media print {
                html, body {
                  width: 100%;
                  height: 100%;
                  margin: 0 !important;
                  padding: 0 !important;
                  overflow: hidden;
                }
                
                img {
                  max-width: 100%;
                  max-height: 100%;
                }
              }
            </style>
          </head>
          <body>
            <div class="label-container">
              <img src="${imgData}" alt="Safety Label" />
            </div>
            <script>
              // Wait for image to load before printing
              document.querySelector('img').onload = function() {
                setTimeout(function() {
                  window.print();
                  setTimeout(function() {
                    window.close();
                  }, 500);
                }, 200);
              };
            </script>
          </body>
        </html>
      `);
      
      printWindow.document.close();
      toast.success('Print prepared successfully');
    } catch (error) {
      console.error('Print error:', error);
      toast.error(`Print error: ${(error as Error).message}`);
    }
  };
  
  // Download as PDF with exact dimensions
  const downloadPDF = async () => {
    try {
      toast.info('Generating PDF...');
      
      // Get high quality image
      const canvas = await captureLabel(8); // Even higher resolution for PDF
      
      // Create PDF with exact dimensions
      const pdf = new jsPDF({
        orientation: physicalWidth > physicalHeight ? 'landscape' : 'portrait',
        unit: 'in',
        format: [physicalWidth, physicalHeight],
        compress: true
      });
      
      // Add the image - positioned at 0,0 and sized to the full page
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, physicalWidth, physicalHeight, '', 'FAST');
      
      // Download the PDF
      pdf.save(`safety-label-${productName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error(`PDF error: ${(error as Error).message}`);
    }
  };
  
  // Export for tile labels (multiple per page)
  const createTiledPDF = async (rows: number, columns: number, margins = 0.125) => {
    try {
      toast.info('Generating tiled labels PDF...');
      
      // Get high quality image
      const canvas = await captureLabel(6);
      
      // Calculate page size and layout
      const pageWidth = (physicalWidth * columns) + (margins * (columns + 1));
      const pageHeight = (physicalHeight * rows) + (margins * (rows + 1));
      
      // Create PDF with calculated dimensions
      const pdf = new jsPDF({
        orientation: pageWidth > pageHeight ? 'landscape' : 'portrait',
        unit: 'in',
        format: [pageWidth, pageHeight],
        compress: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      // Add the image multiple times in a grid
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
          const x = margins + (col * (physicalWidth + margins));
          const y = margins + (row * (physicalHeight + margins));
          
          pdf.addImage(imgData, 'PNG', x, y, physicalWidth, physicalHeight, '', 'FAST');
        }
      }
      
      // Download the PDF
      pdf.save(`safety-labels-${rows}x${columns}-${productName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
      toast.success('Tiled labels PDF downloaded successfully');
    } catch (error) {
      console.error('Tiled PDF generation error:', error);
      toast.error(`Tiled PDF error: ${(error as Error).message}`);
    }
  };
  
  // Print directly using system dialog but with image to preserve appearance
  const printWithSystemDialog = async () => {
    try {
      toast.info('Preparing print...');
      
      // Get high quality image
      const canvas = await captureLabel(4);
      
      // Create a temporary link to trigger the print
      const dataUrl = canvas.toDataURL('image/png');
      const printWindow = window.open('', '_blank');
      
      if (!printWindow) {
        throw new Error('Please allow pop-ups to print the label');
      }
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Print Safety Label</title>
            <style>
              body {
                margin: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
              }
              img {
                max-width: 100%;
                max-height: 100%;
                width: auto;
                height: auto;
              }
              @media print {
                @page {
                  size: auto;
                  margin: 0mm;
                }
                body {
                  margin: 0;
                  padding: 0;
                }
              }
            </style>
          </head>
          <body>
            <img src="${dataUrl}" />
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                }, 100);
              };
            </script>
          </body>
        </html>
      `);
      
      printWindow.document.close();
    } catch (error) {
      console.error('Print dialog error:', error);
      toast.error(`Print dialog error: ${(error as Error).message}`);
    }
  };
  
  return {
    printToDesktop,
    downloadPDF,
    createTiledPDF,
    printWithSystemDialog,
    captureLabel
  };
};
