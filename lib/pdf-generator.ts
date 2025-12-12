import jsPDF from "jspdf";
import { formatPrice } from "./utils";
import { setupRupeeFont } from "./pdf-rupee-font";

// Helper function to convert image URL to base64
function imageToBase64(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      try {
        const dataURL = canvas.toDataURL('image/png');
        resolve(dataURL);
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = reject;
    
    // Handle relative URLs
    if (url.startsWith('/')) {
      if (typeof window !== 'undefined') {
        img.src = window.location.origin + url;
      } else {
        reject(new Error('Cannot resolve relative URL in server context'));
      }
    } else {
      img.src = url;
    }
  });
}

// Helper function to draw rounded rectangle with curved edges (no borders)
function drawRoundedRect(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fillColor?: [number, number, number],
  strokeColor?: [number, number, number],
  lineWidth?: number
): void {
  // Set fill color
  if (fillColor) {
    doc.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
  }

  // Ensure radius doesn't exceed half width/height
  const r = Math.min(radius, width / 2, height / 2);
  
  // Draw rounded rectangle using jsPDF's built-in roundedRect method
  // 'F' style means Fill only (no borders/stroke)
  if (fillColor) {
    // Check if roundedRect method exists
    if (typeof (doc as any).roundedRect === 'function') {
      (doc as any).roundedRect(x, y, width, height, r, r, 'F');
    } else {
      // Fallback: draw regular rectangle if roundedRect is not available
      // This maintains functionality even if the method doesn't exist
      doc.rect(x, y, width, height, 'F');
    }
  }
  
  // No borders drawn - borders removed as requested
}

interface QuotationItem {
  item: string;
  quantity: number;
  price: number;
  total: number;
  isDetailed?: boolean;
  cablePrice?: number;
  wiringCharge?: number;
  wirePricePerMeter?: number;
  wiringChargePerMeter?: number;
  hasCalculation?: boolean;
  calculationType?: string;
  estimatedDaysDisplay?: string | null;
  requiredHDDGB?: number;
  suggestedHDDGB?: number;
  resolutionMP?: string | null;
  totalCameras?: number;
}

interface QuotationData {
  quotationNumber?: string;
  brandName?: string;
  cameraTypeName?: string;
  resolutionName?: string;
  indoorCameraCount?: number;
  outdoorCameraCount?: number;
  wiringMeters?: number;
  hddName?: string;
  recordingDays?: number;
  items: QuotationItem[];
  totalPrice: number;
  // Company Info
  companyName?: string;
  companyTagline?: string;
  companyLogo?: string;
  companyWebsite?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyAddress?: string;
  companyCity?: string;
  companyState?: string;
  companyPincode?: string;
  companyCountry?: string;
  // Customer Info
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
}

// Helper function to add rupee symbol as text with Unicode support
// This will work if a Unicode font is registered, otherwise falls back
function addRupeeSymbolText(doc: jsPDF, x: number, y: number, fontSize: number): void {
  try {
    // Try to use Unicode font if available
    const fontList = doc.getFontList();
    const unicodeFonts = ['NotoSans', 'RupeeFont', 'DejaVuSans', 'ArialUnicodeMS'];
    const availableFont = unicodeFonts.find(font => fontList[font]);
    
    if (availableFont) {
      const currentFont = doc.getFont();
      const currentSize = doc.getFontSize();
      doc.setFont(availableFont);
      doc.setFontSize(fontSize);
      doc.text('₹', x, y);
      doc.setFont(currentFont.fontName, currentFont.fontStyle);
      doc.setFontSize(currentSize);
      return;
    }
  } catch (e) {
    // Continue to fallback
  }
  
  // If no Unicode font, symbol won't render correctly
  // The calling code will handle fallback
}

// Helper function to format price with rupee symbol for PDF
// Uses ₹ symbol - tries Unicode font first, falls back to SVG image
function formatPriceWithRupee(price: number, doc?: jsPDF, x?: number, y?: number): string {
  const formattedPrice = new Intl.NumberFormat("en-IN").format(Math.round(price));
  const rupeeSymbol = '\u20B9'; // ₹ Unicode U+20B9
  
  // Try to use Unicode font if registered
  if (doc) {
    try {
      const fontList = doc.getFontList();
      // Check for any Unicode-supporting font
      const unicodeFonts = ['NotoSans', 'RupeeFont', 'DejaVuSans', 'ArialUnicodeMS'];
      const availableFont = unicodeFonts.find(font => fontList[font]);
      
      if (availableFont) {
        // Save current font settings
        const currentFont = doc.getFont();
        const currentSize = doc.getFontSize();
        
        // Set Unicode font
        doc.setFont(availableFont);
        
        // Format with symbol
        const result = `${rupeeSymbol} ${formattedPrice}`;
        
        // Restore font (size is preserved by setFont)
        doc.setFont(currentFont.fontName, currentFont.fontStyle);
        
        return result;
      }
    } catch (e) {
      // Continue to fallback
    }
  }
  
  // Fallback: Return with symbol anyway
  // If font doesn't support it, it may show incorrectly
  // But we'll try to use SVG fallback in the calling code if x/y provided
  return `${rupeeSymbol} ${formattedPrice}`;
}

// Helper to add price with rupee symbol using best available method
function addPriceWithRupee(doc: jsPDF, price: number, x: number, y: number, options: { fontSize?: number; align?: 'left' | 'right' | 'center' } = {}): void {
  const fontSize = options.fontSize || doc.getFontSize() || 12;
  const formattedPrice = new Intl.NumberFormat("en-IN").format(Math.round(price));
  
  // Save current font settings
  const currentFont = doc.getFont();
  const currentFontSize = doc.getFontSize();
  const currentTextColor = doc.getTextColor();
  
  // Try Unicode font first
  try {
    const fontList = doc.getFontList();
    const unicodeFonts = ['NotoSans', 'RupeeFont', 'DejaVuSans', 'ArialUnicodeMS'];
    const availableFont = unicodeFonts.find(font => fontList[font]);
    
    if (availableFont) {
      // Set Unicode font with proper size
      // Note: We use 'normal' style for Unicode font since we registered it as normal
      // The font size is preserved from the current settings
      doc.setFont(availableFont, 'normal');
      doc.setFontSize(fontSize);
      const text = `\u20B9 ${formattedPrice}`;
      
      if (options.align === 'right') {
        doc.text(text, x, y, { align: 'right' });
      } else {
        doc.text(text, x, y);
      }
      
      // Restore original font settings
      doc.setFont(currentFont.fontName, currentFont.fontStyle);
      doc.setFontSize(currentFontSize);
      return;
    }
  } catch (e) {
    // Continue to fallback
    console.warn("Unicode font rendering failed:", e);
  }
  
  // Fallback: Try to render symbol anyway (may show as ¹ if font doesn't support it)
  // But we'll try Unicode symbol first
  try {
    doc.setFontSize(fontSize);
    const rupeeSymbol = '\u20B9';
    const text = `${rupeeSymbol} ${formattedPrice}`;
    
    if (options.align === 'right') {
      doc.text(text, x, y, { align: 'right' });
    } else {
      doc.text(text, x, y);
    }
    
    // Restore original font settings
    doc.setFont(currentFont.fontName, currentFont.fontStyle);
    doc.setFontSize(currentFontSize);
    return;
  } catch (error) {
    // Final fallback: Use "Rs." text
    doc.setFontSize(fontSize);
    const fallbackText = `Rs. ${formattedPrice}`;
    if (options.align === 'right') {
      doc.text(fallbackText, x, y, { align: 'right' });
    } else {
      doc.text(fallbackText, x, y);
    }
    
    // Restore original font settings
    doc.setFont(currentFont.fontName, currentFont.fontStyle);
    doc.setFontSize(currentFontSize);
  }
}

// Helper to setup PDF font with proper Unicode support for Rupee symbol (₹)
function setupPDFFont(doc: jsPDF): void {
  setupRupeeFont(doc);
}

// Helper function to add very light watermark on current page (background)
function addWatermarkToCurrentPage(doc: jsPDF, watermarkText: string = "D.G.Yard"): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Save current graphics state
  const currentTextColor = doc.getTextColor();
  const currentFont = doc.getFont();
  const currentFontSize = doc.getFontSize();
  const currentDrawColor = doc.getDrawColor();
  
  // Set watermark style - very light gray (almost white, barely visible)
  // This will appear in the background behind all content
  doc.setTextColor(245, 245, 245); // Very light gray - barely visible background
  doc.setFontSize(80); // Large size but very light
  doc.setFont("helvetica", "bold");
  
  // Calculate center position
  const centerX = pageWidth / 2;
  const centerY = pageHeight / 2;
  
  // Draw watermark text at center (very light, in background)
  try {
    doc.text(watermarkText, centerX, centerY, { 
      align: "center",
      maxWidth: pageWidth - 40
    });
  } catch (e) {
    // Fallback: Draw without options
    doc.text(watermarkText, centerX, centerY, { align: "center" });
  }
  
  // Restore original settings
  doc.setTextColor(currentTextColor[0], currentTextColor[1], currentTextColor[2]);
  doc.setDrawColor(currentDrawColor[0], currentDrawColor[1], currentDrawColor[2]);
  doc.setFont(currentFont.fontName, currentFont.fontStyle);
  doc.setFontSize(currentFontSize);
}

// Helper function to add light watermark on every page (called at the end)
function addWatermark(doc: jsPDF, watermarkText: string = "D.G.Yard"): void {
  const totalPages = (doc as any).internal?.getNumberOfPages() || 1;
  
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addWatermarkToCurrentPage(doc, watermarkText);
  }
}

// Helper function to make PDF text non-selectable (adds security layer)
function makeTextNonSelectable(doc: jsPDF): void {
  try {
    // Try to set PDF security/permissions
    // Note: jsPDF has limited support for this, but we can try
    const pdfOutput = doc.output('arraybuffer');
    
    // Add a transparent overlay layer that makes selection harder
    // This is done by adding watermark which interferes with text selection
    // The watermark function already helps with this
    
    // Alternative: Try to use PDF encryption if available
    // Note: This may require additional libraries or may not be fully supported
  } catch (error) {
    console.warn("Could not apply text protection:", error);
    // Continue without protection - watermark still helps
  }
}

export function generateQuotationPDF(data: QuotationData): void {
  try {
    // Validate data
    if (!data) {
      throw new Error("Quotation data is required");
    }
    
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      throw new Error("No items found in quotation data");
    }

    if (!data.totalPrice || isNaN(data.totalPrice) || data.totalPrice <= 0) {
      throw new Error("Invalid total price");
    }

    const doc = new jsPDF();
    
    // Setup font for Unicode support (rupee symbol)
    try {
      setupPDFFont(doc);
    } catch (fontError) {
      console.warn("Font setup failed, using default:", fontError);
      // Continue with default font
    }
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - 2 * margin;
    let yPosition = margin;

    // Helper function to add a new page if needed
    const checkPageBreak = (requiredHeight: number) => {
      if (yPosition + requiredHeight > pageHeight - margin) {
        doc.addPage();
        // Add watermark to new page immediately (behind all content)
        addWatermarkToCurrentPage(doc, "D.G.Yard");
        yPosition = margin;
      }
    };
    
    // Add watermark to first page (behind all content)
    addWatermarkToCurrentPage(doc, "D.G.Yard");

    // Classic Header Design
    // Top border line
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(1);
    doc.line(0, 0, pageWidth, 0);
    
    // Classic header background - elegant white with border
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, 65, "F");
    
    // Top decorative line
    doc.setDrawColor(30, 58, 138);
    doc.setLineWidth(2);
    doc.line(0, 0, pageWidth, 0);
    
    // Bottom border of header
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(0, 65, pageWidth, 65);

    // Company Logo (if available)
    let logoX = margin;
    let logoY = 10;
    let logoWidth = 0;
    let logoHeight = 0;
    let textStartX = margin;
    
    if (data.companyLogo) {
      try {
        // Logo dimensions: max 40mm width, 20mm height
        const maxLogoWidth = 40;
        const maxLogoHeight = 20;
        
        // Determine image format from base64 string or default to PNG
        let imageFormat: 'PNG' | 'JPEG' | 'JPG' = 'PNG';
        let logoData = data.companyLogo;
        
        // Ensure logo is in base64 format
        if (data.companyLogo.startsWith('data:image')) {
          // Extract format from data URL
          if (data.companyLogo.includes('data:image/jpeg') || data.companyLogo.includes('data:image/jpg')) {
            imageFormat = 'JPEG';
          } else if (data.companyLogo.includes('data:image/png')) {
            imageFormat = 'PNG';
          } else if (data.companyLogo.includes('data:image/webp')) {
            // WebP not directly supported, but try PNG format
            imageFormat = 'PNG';
          }
          logoData = data.companyLogo;
        } else {
          // If not base64, assume it's already base64 without prefix
          // Try to add data URL prefix
          logoData = `data:image/png;base64,${data.companyLogo}`;
        }
        
        // Add base64 image directly
        doc.addImage(logoData, imageFormat, logoX, logoY, maxLogoWidth, maxLogoHeight);
        logoWidth = maxLogoWidth;
        logoHeight = maxLogoHeight;
        textStartX = logoX + logoWidth + 5;
        console.log("Logo added successfully to PDF");
      } catch (imgError) {
        console.error("Failed to add logo image to PDF:", imgError);
        console.error("Logo data preview:", data.companyLogo?.substring(0, 100));
        // Continue without logo
      }
    } else {
      console.log("No company logo provided in PDF data");
    }

    // Company Name - Classic Style (adjust position if logo exists)
    doc.setTextColor(30, 58, 138);
    doc.setFontSize(32);
    doc.setFont("helvetica", "bold");
    const companyName = data.companyName || "D.G.Yard";
    doc.text(companyName, textStartX, 25);
    
    // Tagline
    if (data.companyTagline) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(100, 100, 100);
      doc.text(data.companyTagline, textStartX, 35);
    }

    // Quotation Number and Date (Right aligned) - Classic Style
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    if (data.quotationNumber) {
      doc.text(`QUOTATION NO: ${data.quotationNumber}`, pageWidth - margin, 20, { align: "right" });
    }
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(`Date: ${new Date().toLocaleDateString("en-IN", { 
      year: "numeric", 
      month: "long", 
      day: "numeric"
    })}`, pageWidth - margin, 30, { align: "right" });

    yPosition = 75;

    // Company Information Box - Modern Rounded Card with Shadow
    const cardWidth = contentWidth / 2 - 5;
    const cardHeight = 50;
    const borderRadius = 4; // Modern rounded corners
    const shadowOffset = 1.5;
    
    // Shadow effect with blue color (multiple layers for depth)
    drawRoundedRect(
      doc,
      margin + shadowOffset,
      yPosition + shadowOffset,
      cardWidth,
      cardHeight,
      borderRadius,
      [200, 220, 255], // Light blue shadow
      [200, 220, 255],
      0.3
    );
    drawRoundedRect(
      doc,
      margin + shadowOffset * 0.5,
      yPosition + shadowOffset * 0.5,
      cardWidth,
      cardHeight,
      borderRadius,
      [220, 235, 255], // Lighter blue shadow
      [220, 235, 255],
      0.3
    );
    
    // Main card with rounded corners (no borders)
    drawRoundedRect(
      doc,
      margin,
      yPosition,
      cardWidth,
      cardHeight,
      borderRadius,
      [255, 255, 255], // White background
      [180, 180, 180], // Border color (not used - borders removed)
      0.8
    );
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 58, 138);
    doc.text("From:", margin + 5, yPosition + 8);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    let companyY = yPosition + 15;
    
    if (data.companyName) {
      doc.setFont("helvetica", "bold");
      doc.text(data.companyName, margin + 5, companyY);
      companyY += 6;
    }
    
    doc.setFont("helvetica", "normal");
    const companyAddress = [
      data.companyAddress,
      data.companyCity && data.companyState ? `${data.companyCity}, ${data.companyState}` : data.companyCity || data.companyState,
      data.companyPincode,
      data.companyCountry,
    ].filter(Boolean).join(", ");
    
    if (companyAddress) {
      const addressLines = doc.splitTextToSize(companyAddress, contentWidth / 2 - 15);
      doc.text(addressLines, margin + 5, companyY);
      companyY += addressLines.length * 5;
    }
    
    if (data.companyPhone) {
      doc.text(`Phone: ${data.companyPhone}`, margin + 5, companyY);
      companyY += 6;
    }
    
    if (data.companyEmail) {
      doc.text(`Email: ${data.companyEmail}`, margin + 5, companyY);
      companyY += 6;
    }
    
    if (data.companyWebsite) {
      doc.text(`Website: ${data.companyWebsite}`, margin + 5, companyY);
    }

    // Customer Information Box - Modern Rounded Card with Shadow
    const cardWidth2 = contentWidth / 2 - 5;
    const cardHeight2 = 50;
    const cardX2 = margin + contentWidth / 2 + 5;
    const borderRadius2 = 4; // Modern rounded corners
    const shadowOffset2 = 1.5;
    
    // Shadow effect with blue color (multiple layers for depth)
    drawRoundedRect(
      doc,
      cardX2 + shadowOffset2,
      yPosition + shadowOffset2,
      cardWidth2,
      cardHeight2,
      borderRadius2,
      [200, 220, 255], // Light blue shadow
      [200, 220, 255],
      0.3
    );
    drawRoundedRect(
      doc,
      cardX2 + shadowOffset2 * 0.5,
      yPosition + shadowOffset2 * 0.5,
      cardWidth2,
      cardHeight2,
      borderRadius2,
      [220, 235, 255], // Lighter blue shadow
      [220, 235, 255],
      0.3
    );
    
    // Main card (no rounded corners, no circles)
    drawRoundedRect(
      doc,
      cardX2,
      yPosition,
      cardWidth2,
      cardHeight2,
      borderRadius2,
      [255, 255, 255], // White background
      [180, 180, 180], // Modern border color
      0.8
    );
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 58, 138);
    doc.text("To:", margin + contentWidth / 2 + 8, yPosition + 8);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    let customerY = yPosition + 15;
    
    if (data.customerName) {
      doc.setFont("helvetica", "bold");
      doc.text(data.customerName, margin + contentWidth / 2 + 8, customerY);
      customerY += 6;
    }
    
    doc.setFont("helvetica", "normal");
    if (data.customerAddress) {
      const addressLines = doc.splitTextToSize(data.customerAddress, contentWidth / 2 - 10);
      doc.text(addressLines, margin + contentWidth / 2 + 8, customerY);
      customerY += addressLines.length * 5;
    }
    
    if (data.customerPhone) {
      doc.text(`Phone: ${data.customerPhone}`, margin + contentWidth / 2 + 8, customerY);
      customerY += 6;
    }
    
    if (data.customerEmail) {
      doc.text(`Email: ${data.customerEmail}`, margin + contentWidth / 2 + 8, customerY);
    }

    yPosition += 70;

    // Quotation Details Section - Row Format with Separators
    checkPageBreak(40);
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 8;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Quotation Details", margin, yPosition);
    yPosition += 12;

    // Prepare details in pairs for row format
    const details: Array<{ label: string; value: string }> = [];
    if (data.brandName) details.push({ label: "Brand", value: data.brandName });
    if (data.cameraTypeName) details.push({ label: "Camera Type", value: data.cameraTypeName });
    if (data.resolutionName) details.push({ label: "Resolution", value: data.resolutionName });
    if (data.indoorCameraCount !== undefined && data.indoorCameraCount > 0) {
      details.push({ label: "Indoor Cameras", value: data.indoorCameraCount.toString() });
    }
    if (data.outdoorCameraCount !== undefined && data.outdoorCameraCount > 0) {
      details.push({ label: "Outdoor Cameras", value: data.outdoorCameraCount.toString() });
    }
    if (data.wiringMeters !== undefined && data.wiringMeters > 0) {
      details.push({ label: "Wiring", value: `${data.wiringMeters} meters` });
    }
    if (data.hddName) details.push({ label: "HDD Storage", value: data.hddName });
    if (data.recordingDays !== undefined && data.recordingDays > 0) {
      details.push({ label: "Recording Days", value: data.recordingDays.toString() });
    }

    // Display details in rows (2 columns)
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    
    const col1Width = contentWidth * 0.48;
    const col2Width = contentWidth * 0.48;
    const separatorX = margin + col1Width + 2;
    
    for (let i = 0; i < details.length; i += 2) {
      checkPageBreak(10);
      
      // First column
      if (details[i]) {
        doc.setFont("helvetica", "bold");
        doc.setTextColor(100, 100, 100);
        doc.text(`${details[i].label}:`, margin, yPosition);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);
        doc.text(details[i].value, margin + 40, yPosition);
      }
      
      // Separator line
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.3);
      doc.line(separatorX, yPosition - 4, separatorX, yPosition + 2);
      
      // Second column
      if (details[i + 1]) {
        doc.setFont("helvetica", "bold");
        doc.setTextColor(100, 100, 100);
        doc.text(`${details[i + 1].label}:`, separatorX + 5, yPosition);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);
        doc.text(details[i + 1].value, separatorX + 45, yPosition);
      }
      
      yPosition += 8;
      
      // Horizontal separator line between rows
      if (i + 2 < details.length) {
        doc.setDrawColor(240, 240, 240);
        doc.setLineWidth(0.3);
        doc.line(margin, yPosition - 2, pageWidth - margin, yPosition - 2);
        yPosition += 3;
      }
    }

    yPosition += 8;

    // Classic Items Table Header
    checkPageBreak(25);
    // Classic bordered header
    doc.setDrawColor(30, 58, 138);
    doc.setLineWidth(1);
    doc.setFillColor(30, 58, 138);
    doc.rect(margin, yPosition, contentWidth, 12, "F");
    
    // Inner border
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.3);
    doc.rect(margin, yPosition, contentWidth, 12, "D");
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    
    doc.text("Item", margin + 3, yPosition + 8);
    doc.text("Qty", margin + contentWidth * 0.55, yPosition + 8);
    doc.text("Price", margin + contentWidth * 0.7, yPosition + 8);
    doc.text("Total", pageWidth - margin - 2, yPosition + 8, { align: "right" });
    
    yPosition += 18; // Increased spacing between header and items

    // Items
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    
    if (data.items.length === 0) {
      checkPageBreak(10);
      doc.setTextColor(150, 150, 150);
      doc.text("No items in quotation", margin, yPosition);
      yPosition += 10;
    }
    
    data.items.forEach((item) => {
      checkPageBreak(30);
      
      // Item name
      const itemNameLines = doc.splitTextToSize(item.item, contentWidth * 0.5);
      doc.text(itemNameLines, margin + 2, yPosition);
      const itemNameHeight = itemNameLines.length * 5;
      
      // Quantity
      doc.text(item.quantity.toString(), margin + contentWidth * 0.55, yPosition);
      
      // Price with rupee symbol
      addPriceWithRupee(doc, item.price, margin + contentWidth * 0.7, yPosition, { fontSize: 10 });
      
      // Total with rupee symbol
      addPriceWithRupee(doc, item.total, pageWidth - margin - 2, yPosition, { fontSize: 10, align: "right" });
      
      yPosition += Math.max(itemNameHeight, 8);
      
      // Add details if available
      if (item.isDetailed && item.cablePrice !== undefined && item.wiringCharge !== undefined) {
        checkPageBreak(15);
        yPosition += 3;
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        const cableText = `  Cable: `;
        const cableTextWidth = doc.getTextWidth(cableText);
        doc.text(cableText, margin + 5, yPosition);
        addPriceWithRupee(doc, item.wirePricePerMeter || 0, margin + 5 + cableTextWidth, yPosition, { fontSize: 9 });
        doc.text(` × ${item.quantity}m = `, margin + 5 + cableTextWidth + 25, yPosition);
        addPriceWithRupee(doc, item.cablePrice, margin + 5 + cableTextWidth + 50, yPosition, { fontSize: 9 });
        yPosition += 5;
        const wiringText = `  Wiring Charge: `;
        const wiringTextWidth = doc.getTextWidth(wiringText);
        doc.text(wiringText, margin + 5, yPosition);
        addPriceWithRupee(doc, item.wiringChargePerMeter || 0, margin + 5 + wiringTextWidth, yPosition, { fontSize: 9 });
        doc.text(` × ${item.quantity}m = `, margin + 5 + wiringTextWidth + 25, yPosition);
        addPriceWithRupee(doc, item.wiringCharge, margin + 5 + wiringTextWidth + 50, yPosition, { fontSize: 9 });
        yPosition += 5;
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
      } else if (item.hasCalculation) {
        checkPageBreak(15);
        yPosition += 3;
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        if (item.estimatedDaysDisplay) {
          doc.text(`  Recording: ${item.estimatedDaysDisplay}`, margin + 5, yPosition);
          yPosition += 5;
        }
        if (item.requiredHDDGB) {
          doc.text(`  Required Storage: ${item.requiredHDDGB} GB`, margin + 5, yPosition);
          yPosition += 5;
        }
        if (item.suggestedHDDGB) {
          doc.text(`  Suggested Storage: ${item.suggestedHDDGB} GB`, margin + 5, yPosition);
          yPosition += 5;
        }
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
      }
      
      yPosition += 3;
    });

    // Total Section - Modern Rounded Card with Shadow
    yPosition += 5;
    checkPageBreak(50);
    
    // Calculate GST (18%)
    const subtotal = data.totalPrice;
    const gstRate = 0.18; // 18% GST
    const gstAmount = subtotal * gstRate;
    const grandTotal = subtotal + gstAmount;
    
    // Card dimensions
    const totalCardHeight = 45;
    const borderRadius3 = 4; // Modern rounded corners
    const shadowOffset3 = 1.5;
    
    // Shadow effect with blue color (multiple layers for depth)
    drawRoundedRect(
      doc,
      margin + shadowOffset3,
      yPosition + shadowOffset3,
      contentWidth,
      totalCardHeight,
      borderRadius3,
      [200, 220, 255], // Light blue shadow
      [200, 220, 255],
      0.3
    );
    drawRoundedRect(
      doc,
      margin + shadowOffset3 * 0.5,
      yPosition + shadowOffset3 * 0.5,
      contentWidth,
      totalCardHeight,
      borderRadius3,
      [220, 235, 255], // Lighter blue shadow
      [220, 235, 255],
      0.3
    );
    
    // Main card (no rounded corners, no circles)
    drawRoundedRect(
      doc,
      margin,
      yPosition,
      contentWidth,
      totalCardHeight,
      borderRadius3,
      [255, 255, 255], // White background
      [180, 180, 180], // Modern border color
      0.8
    );
    
    const cardStartY = yPosition;
    yPosition += 10;
    
    // Subtotal
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    doc.text("Subtotal:", margin + 5, yPosition);
    addPriceWithRupee(doc, subtotal, pageWidth - margin - 5, yPosition, { fontSize: 12, align: "right" });
    yPosition += 8;
    
    // GST
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    doc.text("GST (18%):", margin + 5, yPosition);
    addPriceWithRupee(doc, gstAmount, pageWidth - margin - 5, yPosition, { fontSize: 12, align: "right" });
    yPosition += 8;
    
    // Separator line
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(margin + 5, yPosition, pageWidth - margin - 5, yPosition);
    yPosition += 8;
    
    // Grand Total
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Grand Total:", margin + 5, yPosition);
    doc.setTextColor(34, 197, 94); // Green color
    addPriceWithRupee(doc, grandTotal, pageWidth - margin - 5, yPosition, { fontSize: 16, align: "right" });
    
    yPosition = cardStartY + totalCardHeight + 10;

    // Solutions We Provide Section - Grid Design with Rows and Columns
    checkPageBreak(100);
    
    // Section separator
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 15;
    
    // Section Header - Classic Style
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Solutions We Provide", pageWidth / 2, yPosition, { align: "center" });
    yPosition += 15;
    
    // Services list - Grid layout (3 columns with rows)
    const services = [
      "CCTV & Smart Surveillance",
      "Networking & IT Infrastructure",
      "Digital Marketing & Branding",
      "Website, E-Commerce & App Development",
      "Audio-Visual Presentation Systems",
      "Fire Sprinkler & Hydrant Solutions",
      "Smart Home & Office Automation",
      "Boom Barrier, Flap Barrier & Access Control",
      "Solar Traffic Blinkers & Road Safety Systems"
    ];
    
    const numColumns = 3;
    const columnWidth = (contentWidth - 10) / numColumns;
    const columnSpacing = 5;
    const boxPadding = 3;
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    
    let currentRow = -1;
    let rowStartY = yPosition;
    let maxRowHeight = 0;
    
    // First pass: Calculate all row heights
    const rowHeights: number[] = [];
    services.forEach((service, index) => {
      const row = Math.floor(index / numColumns);
      const boxWidth = columnWidth - 5;
      const serviceLines = doc.splitTextToSize(service, boxWidth - 5);
      const textHeight = serviceLines.length * 4;
      const boxHeight = Math.max(textHeight + 4, 10);
      
      if (!rowHeights[row]) {
        rowHeights[row] = boxHeight;
      } else {
        rowHeights[row] = Math.max(rowHeights[row], boxHeight);
      }
    });
    
    // Second pass: Draw services with vertical separators
    services.forEach((service, index) => {
      const column = index % numColumns;
      const row = Math.floor(index / numColumns);
      
      // Check if we need a new row
      if (row > currentRow) {
        // No horizontal lines - just update position
        if (currentRow >= 0) {
          yPosition = rowStartY + maxRowHeight + 5;
        }
        
        rowStartY = yPosition;
        currentRow = row;
        maxRowHeight = rowHeights[row] || 10;
        checkPageBreak(15);
      }
      
      const xPos = margin + 5 + (column * (columnWidth + columnSpacing));
      const boxWidth = columnWidth - 5;
      
      // Calculate text height
      const serviceText = service;
      const serviceLines = doc.splitTextToSize(serviceText, boxWidth - 5);
      
      // Draw vertical separator (| line) between columns - only between columns
      if (column > 0) {
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        const separatorX = xPos - columnSpacing;
        // Use the row height for the separator
        doc.line(separatorX, rowStartY, separatorX, rowStartY + maxRowHeight);
      }
      
      // Service text
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.text(serviceLines, xPos + 2, rowStartY + 3);
    });
    
    // No final row separator - borders removed
    
    // Move to next section after last row
    yPosition = rowStartY + maxRowHeight + 5;

    // Classic Footer with Links
    checkPageBreak(50);
    
    // Top border line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 12;
    
    // Footer background
    doc.setFillColor(249, 250, 251);
    doc.rect(margin, yPosition - 5, contentWidth, 35, "F");
    
    // Thank you message
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 58, 138);
    doc.text("Thank you for choosing D.G.Yard!", pageWidth / 2, yPosition, { align: "center" });
    yPosition += 8;
    
    // Contact links section
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    
    const linkY = yPosition;
    let linkX = margin + 20;
    
    // Website link
    if (data.companyWebsite) {
      const websiteText = `Website: ${data.companyWebsite}`;
      const websiteWidth = doc.getTextWidth(websiteText);
      doc.setTextColor(30, 58, 138);
      doc.text(websiteText, linkX, linkY);
      // Add clickable link
      doc.link(linkX, linkY - 3, websiteWidth, 4, { url: data.companyWebsite });
      linkX += websiteWidth + 15;
    }
    
    // Email link
    if (data.companyEmail) {
      const emailText = `Email: ${data.companyEmail}`;
      const emailWidth = doc.getTextWidth(emailText);
      doc.setTextColor(30, 58, 138);
      doc.text(emailText, linkX, linkY);
      // Add clickable link
      doc.link(linkX, linkY - 3, emailWidth, 4, { url: `mailto:${data.companyEmail}` });
      linkX += emailWidth + 15;
    }
    
    // Phone link
    if (data.companyPhone) {
      const phoneText = `Contact: ${data.companyPhone}`;
      doc.setTextColor(30, 58, 138);
      doc.text(phoneText, linkX, linkY);
      // Add clickable link
      const phoneWidth = doc.getTextWidth(phoneText);
      doc.link(linkX, linkY - 3, phoneWidth, 4, { url: `tel:${data.companyPhone}` });
    }
    
    yPosition += 10;
    
    // Page numbers
    const totalPages = (doc as any).internal?.getNumberOfPages() || 1;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Page ${i} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - 8,
        { align: "center" }
      );
    }

    // Watermark is already added at the beginning of each page (behind all content)
    // No need to add again at the end

    // Generate filename
    const filename = data.quotationNumber 
      ? `quotation-${data.quotationNumber}.pdf`
      : `quotation-dgyard-${new Date().toISOString().split("T")[0]}.pdf`;

    // Save PDF
    doc.save(filename);
  } catch (error) {
    console.error("Error in generateQuotationPDF:", error);
    throw error;
  }
}

// Generate PDF as blob and return data URL for sharing
export function generateQuotationPDFBlob(data: QuotationData): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new jsPDF();
      
      // Setup font for Unicode support (rupee symbol)
      setupPDFFont(doc);
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - 2 * margin;
      let yPosition = margin;

      // Helper function to add a new page if needed
      const checkPageBreak = (requiredHeight: number) => {
        if (yPosition + requiredHeight > pageHeight - margin) {
          doc.addPage();
          // Add watermark to new page immediately (behind all content)
          addWatermarkToCurrentPage(doc, "D.G.Yard");
          yPosition = margin;
        }
      };
      
      // Add watermark to first page (behind all content)
      addWatermarkToCurrentPage(doc, "D.G.Yard");

      // Classic Header Design
      // Top border line
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(1);
      doc.line(0, 0, pageWidth, 0);
      
      // Classic header background - elegant white with border
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageWidth, 65, "F");
      
      // Top decorative line
      doc.setDrawColor(30, 58, 138);
      doc.setLineWidth(2);
      doc.line(0, 0, pageWidth, 0);
      
      // Bottom border of header
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(0, 65, pageWidth, 65);

      // Company Logo (if available)
      let logoX = margin;
      let logoY = 10;
      let logoWidth = 0;
      let logoHeight = 0;
      let textStartX = margin;
      
      if (data.companyLogo) {
        try {
          // Logo dimensions: max 40mm width, 20mm height
          const maxLogoWidth = 40;
          const maxLogoHeight = 20;
          
          // Determine image format from base64 string or default to PNG
          let imageFormat: 'PNG' | 'JPEG' | 'JPG' = 'PNG';
          let logoData = data.companyLogo;
          
          // Ensure logo is in base64 format
          if (data.companyLogo.startsWith('data:image')) {
            // Extract format from data URL
            if (data.companyLogo.includes('data:image/jpeg') || data.companyLogo.includes('data:image/jpg')) {
              imageFormat = 'JPEG';
            } else if (data.companyLogo.includes('data:image/png')) {
              imageFormat = 'PNG';
            } else if (data.companyLogo.includes('data:image/webp')) {
              // WebP not directly supported, but try PNG format
              imageFormat = 'PNG';
            }
            logoData = data.companyLogo;
          } else {
            // If not base64, assume it's already base64 without prefix
            // Try to add data URL prefix
            logoData = `data:image/png;base64,${data.companyLogo}`;
          }
          
          // Add base64 image directly
          doc.addImage(logoData, imageFormat, logoX, logoY, maxLogoWidth, maxLogoHeight);
          logoWidth = maxLogoWidth;
          logoHeight = maxLogoHeight;
          textStartX = logoX + logoWidth + 5;
          console.log("Logo added successfully to PDF (blob version)");
        } catch (imgError) {
          console.error("Failed to add logo image to PDF (blob version):", imgError);
          console.error("Logo data preview:", data.companyLogo?.substring(0, 100));
          // Continue without logo
        }
      } else {
        console.log("No company logo provided in PDF data (blob version)");
      }

      // Company Name - Classic Style (adjust position if logo exists)
      doc.setTextColor(30, 58, 138);
      doc.setFontSize(32);
      doc.setFont("helvetica", "bold");
      const companyName = data.companyName || "D.G.Yard";
      doc.text(companyName, textStartX, 25);
      
      // Tagline
      if (data.companyTagline) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(100, 100, 100);
        doc.text(data.companyTagline, textStartX, 35);
      }

      // Quotation Number and Date (Right aligned) - Classic Style
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      if (data.quotationNumber) {
        doc.text(`QUOTATION NO: ${data.quotationNumber}`, pageWidth - margin, 20, { align: "right" });
      }
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text(`Date: ${new Date().toLocaleDateString("en-IN", { 
        year: "numeric", 
        month: "long", 
        day: "numeric"
      })}`, pageWidth - margin, 30, { align: "right" });

      yPosition = 75;

      // Classic From/To Boxes - Modern Rounded Card with Shadow
      // From Box - Modern Rounded Card
      const cardWidth = contentWidth / 2 - 5;
      const cardHeight = 50;
      const borderRadius = 4; // Modern rounded corners
      const shadowOffset = 1.5;
      
      // Shadow effect with blue color (multiple layers for depth)
      drawRoundedRect(
        doc,
        margin + shadowOffset,
        yPosition + shadowOffset,
        cardWidth,
        cardHeight,
        borderRadius,
        [200, 220, 255], // Light blue shadow
        [200, 220, 255],
        0.3
      );
      drawRoundedRect(
        doc,
        margin + shadowOffset * 0.5,
        yPosition + shadowOffset * 0.5,
        cardWidth,
        cardHeight,
        borderRadius,
        [220, 235, 255], // Lighter blue shadow
        [220, 235, 255],
        0.3
      );
      
      // Main card (no rounded corners, no circles)
      drawRoundedRect(
        doc,
        margin,
        yPosition,
        cardWidth,
        cardHeight,
        borderRadius,
        [255, 255, 255], // White background
        [180, 180, 180], // Modern border color
        0.8
      );
      
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 58, 138);
      doc.text("FROM:", margin + 5, yPosition + 10);
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      let companyY = yPosition + 18;
      
      if (data.companyName) {
        doc.setFont("helvetica", "bold");
        doc.text(data.companyName, margin + 5, companyY);
        companyY += 7;
      }
      
      doc.setFont("helvetica", "normal");
      const companyAddress = [
        data.companyAddress,
        data.companyCity && data.companyState ? `${data.companyCity}, ${data.companyState}` : data.companyCity || data.companyState,
        data.companyPincode,
        data.companyCountry,
      ].filter(Boolean).join(", ");
      
      if (companyAddress) {
        const addressLines = doc.splitTextToSize(companyAddress, contentWidth / 2 - 15);
        doc.text(addressLines, margin + 5, companyY);
        companyY += addressLines.length * 5;
      }
      
      if (data.companyPhone) {
        doc.text(`Phone: ${data.companyPhone}`, margin + 5, companyY);
        companyY += 6;
      }
      
      if (data.companyEmail) {
        doc.text(`Email: ${data.companyEmail}`, margin + 5, companyY);
        companyY += 6;
      }
      
      if (data.companyWebsite) {
        doc.text(`Website: ${data.companyWebsite}`, margin + 5, companyY);
      }

      // To Box - Modern Rounded Card with Shadow
      const cardWidth2 = contentWidth / 2 - 5;
      const cardHeight2 = 50;
      const cardX2 = margin + contentWidth / 2 + 5;
      const borderRadius2 = 4; // Modern rounded corners
      const shadowOffset2 = 1.5;
      
      // Shadow effect with blue color (multiple layers for depth)
      drawRoundedRect(
        doc,
        cardX2 + shadowOffset2,
        yPosition + shadowOffset2,
        cardWidth2,
        cardHeight2,
        borderRadius2,
        [200, 220, 255], // Light blue shadow
        [200, 220, 255],
        0.3
      );
      drawRoundedRect(
        doc,
        cardX2 + shadowOffset2 * 0.5,
        yPosition + shadowOffset2 * 0.5,
        cardWidth2,
        cardHeight2,
        borderRadius2,
        [220, 235, 255], // Lighter blue shadow
        [220, 235, 255],
        0.3
      );
      
      // Main card with modern rounded corners
      drawRoundedRect(
        doc,
        cardX2,
        yPosition,
        cardWidth2,
        cardHeight2,
        borderRadius2,
        [255, 255, 255], // White background
        [180, 180, 180], // Modern border color
        0.8
      );
      
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 58, 138);
      doc.text("TO:", margin + contentWidth / 2 + 10, yPosition + 10);
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      let customerY = yPosition + 18;
      
      if (data.customerName) {
        doc.setFont("helvetica", "bold");
        doc.text(data.customerName, margin + contentWidth / 2 + 10, customerY);
        customerY += 7;
      }
      
      doc.setFont("helvetica", "normal");
      if (data.customerAddress) {
        const addressLines = doc.splitTextToSize(data.customerAddress, contentWidth / 2 - 15);
        doc.text(addressLines, margin + contentWidth / 2 + 10, customerY);
        customerY += addressLines.length * 5;
      }
      
      if (data.customerPhone) {
        doc.text(`Phone: ${data.customerPhone}`, margin + contentWidth / 2 + 10, customerY);
        customerY += 6;
      }
      
      if (data.customerEmail) {
        doc.text(`Email: ${data.customerEmail}`, margin + contentWidth / 2 + 10, customerY);
      }

      yPosition += 65;

      // Quotation Details Section - Row Format with Separators
      checkPageBreak(40);
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 8;

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("Quotation Details", margin, yPosition);
      yPosition += 12;

      // Prepare details in pairs for row format
      const details: Array<{ label: string; value: string }> = [];
      if (data.brandName) details.push({ label: "Brand", value: data.brandName });
      if (data.cameraTypeName) details.push({ label: "Camera Type", value: data.cameraTypeName });
      if (data.resolutionName) details.push({ label: "Resolution", value: data.resolutionName });
      if (data.indoorCameraCount !== undefined && data.indoorCameraCount > 0) {
        details.push({ label: "Indoor Cameras", value: data.indoorCameraCount.toString() });
      }
      if (data.outdoorCameraCount !== undefined && data.outdoorCameraCount > 0) {
        details.push({ label: "Outdoor Cameras", value: data.outdoorCameraCount.toString() });
      }
      if (data.wiringMeters !== undefined && data.wiringMeters > 0) {
        details.push({ label: "Wiring", value: `${data.wiringMeters} meters` });
      }
      if (data.hddName) details.push({ label: "HDD Storage", value: data.hddName });
      if (data.recordingDays !== undefined && data.recordingDays > 0) {
        details.push({ label: "Recording Days", value: data.recordingDays.toString() });
      }

      // Display details in rows (2 columns)
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      
      const col1Width = contentWidth * 0.48;
      const col2Width = contentWidth * 0.48;
      const separatorX = margin + col1Width + 2;
      
      for (let i = 0; i < details.length; i += 2) {
        checkPageBreak(10);
        
        // First column
        if (details[i]) {
          doc.setFont("helvetica", "bold");
          doc.setTextColor(100, 100, 100);
          doc.text(`${details[i].label}:`, margin, yPosition);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(0, 0, 0);
          doc.text(details[i].value, margin + 40, yPosition);
        }
        
        // Separator line
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.3);
        doc.line(separatorX, yPosition - 4, separatorX, yPosition + 2);
        
        // Second column
        if (details[i + 1]) {
          doc.setFont("helvetica", "bold");
          doc.setTextColor(100, 100, 100);
          doc.text(`${details[i + 1].label}:`, separatorX + 5, yPosition);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(0, 0, 0);
          doc.text(details[i + 1].value, separatorX + 45, yPosition);
        }
        
        yPosition += 8;
        
        // Horizontal separator line between rows
        if (i + 2 < details.length) {
          doc.setDrawColor(240, 240, 240);
          doc.setLineWidth(0.3);
          doc.line(margin, yPosition - 2, pageWidth - margin, yPosition - 2);
          yPosition += 3;
        }
      }

      yPosition += 8;

      // Classic Items Table Header
      checkPageBreak(25);
      // Classic bordered header
      doc.setDrawColor(30, 58, 138);
      doc.setLineWidth(1);
      doc.setFillColor(30, 58, 138);
      doc.rect(margin, yPosition, contentWidth, 12, "F");
      
      // Inner border
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.3);
      doc.rect(margin, yPosition, contentWidth, 12, "D");
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      
      doc.text("Item", margin + 3, yPosition + 8);
      doc.text("Qty", margin + contentWidth * 0.55, yPosition + 8);
      doc.text("Price", margin + contentWidth * 0.7, yPosition + 8);
      doc.text("Total", pageWidth - margin - 2, yPosition + 8, { align: "right" });
      
      yPosition += 18; // Increased spacing between header and items

      // Items
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      
      if (data.items.length === 0) {
        checkPageBreak(10);
        doc.setTextColor(150, 150, 150);
        doc.text("No items in quotation", margin, yPosition);
        yPosition += 10;
      }
      
      data.items.forEach((item) => {
        checkPageBreak(30);
        
        // Item name
        const itemNameLines = doc.splitTextToSize(item.item, contentWidth * 0.5);
        doc.text(itemNameLines, margin + 2, yPosition);
        const itemNameHeight = itemNameLines.length * 5;
        
      // Quantity
      doc.text(item.quantity.toString(), margin + contentWidth * 0.55, yPosition);
      
      // Price with rupee symbol
      addPriceWithRupee(doc, item.price, margin + contentWidth * 0.7, yPosition, { fontSize: 10 });
      
      // Total with rupee symbol
      addPriceWithRupee(doc, item.total, pageWidth - margin - 2, yPosition, { fontSize: 10, align: "right" });
        
        yPosition += Math.max(itemNameHeight, 8);
        
        // Add details if available
        if (item.isDetailed && item.cablePrice !== undefined && item.wiringCharge !== undefined) {
          checkPageBreak(15);
          yPosition += 3;
          doc.setFontSize(9);
          doc.setTextColor(100, 100, 100);
        const cableText2 = `  Cable: `;
        const cableTextWidth2 = doc.getTextWidth(cableText2);
        doc.text(cableText2, margin + 5, yPosition);
        addPriceWithRupee(doc, item.wirePricePerMeter || 0, margin + 5 + cableTextWidth2, yPosition, { fontSize: 9 });
        doc.text(` × ${item.quantity}m = `, margin + 5 + cableTextWidth2 + 25, yPosition);
        addPriceWithRupee(doc, item.cablePrice, margin + 5 + cableTextWidth2 + 50, yPosition, { fontSize: 9 });
        yPosition += 5;
        const wiringText2 = `  Wiring Charge: `;
        const wiringTextWidth2 = doc.getTextWidth(wiringText2);
        doc.text(wiringText2, margin + 5, yPosition);
        addPriceWithRupee(doc, item.wiringChargePerMeter || 0, margin + 5 + wiringTextWidth2, yPosition, { fontSize: 9 });
        doc.text(` × ${item.quantity}m = `, margin + 5 + wiringTextWidth2 + 25, yPosition);
        addPriceWithRupee(doc, item.wiringCharge, margin + 5 + wiringTextWidth2 + 50, yPosition, { fontSize: 9 });
          yPosition += 5;
          doc.setFontSize(10);
          doc.setTextColor(0, 0, 0);
        } else if (item.hasCalculation) {
          checkPageBreak(15);
          yPosition += 3;
          doc.setFontSize(9);
          doc.setTextColor(100, 100, 100);
          if (item.estimatedDaysDisplay) {
            doc.text(`  Recording: ${item.estimatedDaysDisplay}`, margin + 5, yPosition);
            yPosition += 5;
          }
          if (item.requiredHDDGB) {
            doc.text(`  Required Storage: ${item.requiredHDDGB} GB`, margin + 5, yPosition);
            yPosition += 5;
          }
          if (item.suggestedHDDGB) {
            doc.text(`  Suggested Storage: ${item.suggestedHDDGB} GB`, margin + 5, yPosition);
            yPosition += 5;
          }
          doc.setFontSize(10);
          doc.setTextColor(0, 0, 0);
        }
        
        yPosition += 3;
      });

      // Total Section - Modern Rounded Card with Shadow
      yPosition += 5;
      checkPageBreak(50);
      
      // Calculate GST (18%)
      const subtotal = data.totalPrice;
      const gstRate = 0.18; // 18% GST
      const gstAmount = subtotal * gstRate;
      const grandTotal = subtotal + gstAmount;
      
      // Card dimensions
      const totalCardHeight = 45;
      const borderRadius3 = 4; // Modern rounded corners
      const shadowOffset3 = 1.5;
      
      // Shadow effect with blue color (multiple layers for depth)
      drawRoundedRect(
        doc,
        margin + shadowOffset3,
        yPosition + shadowOffset3,
        contentWidth,
        totalCardHeight,
        borderRadius3,
        [200, 220, 255], // Light blue shadow
        [200, 220, 255],
        0.3
      );
      drawRoundedRect(
        doc,
        margin + shadowOffset3 * 0.5,
        yPosition + shadowOffset3 * 0.5,
        contentWidth,
        totalCardHeight,
        borderRadius3,
        [220, 235, 255], // Lighter blue shadow
        [220, 235, 255],
        0.3
      );
      
      // Main card with rounded corners (no borders)
      drawRoundedRect(
        doc,
        margin,
        yPosition,
        contentWidth,
        totalCardHeight,
        borderRadius3,
        [255, 255, 255], // White background
        [180, 180, 180], // Border color (not used - borders removed)
        0.8
      );
      
      const cardStartY = yPosition;
      yPosition += 10;
      
      // Subtotal
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.text("Subtotal:", margin + 5, yPosition);
      addPriceWithRupee(doc, subtotal, pageWidth - margin - 5, yPosition, { fontSize: 12, align: "right" });
      yPosition += 8;
      
      // GST
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.text("GST (18%):", margin + 5, yPosition);
      addPriceWithRupee(doc, gstAmount, pageWidth - margin - 5, yPosition, { fontSize: 12, align: "right" });
      yPosition += 8;
      
      // Separator line
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.3);
      doc.line(margin + 5, yPosition, pageWidth - margin - 5, yPosition);
      yPosition += 8;
      
      // Grand Total
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("Grand Total:", margin + 5, yPosition);
      doc.setTextColor(34, 197, 94);
      addPriceWithRupee(doc, grandTotal, pageWidth - margin - 5, yPosition, { fontSize: 16, align: "right" });
      
      yPosition = cardStartY + totalCardHeight + 10;

      // Solutions We Provide Section - Grid Design with Rows and Columns
      checkPageBreak(100);
      
      // Section separator
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 15;
      
      // Section Header - Classic Style
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("Solutions We Provide", pageWidth / 2, yPosition, { align: "center" });
      yPosition += 15;
      
      // Services list - Grid layout (3 columns with rows)
      const services = [
        "CCTV & Smart Surveillance",
        "Networking & IT Infrastructure",
        "Digital Marketing & Branding",
        "Website, E-Commerce & App Development",
        "Audio-Visual Presentation Systems",
        "Fire Sprinkler & Hydrant Solutions",
        "Smart Home & Office Automation",
        "Boom Barrier, Flap Barrier & Access Control",
        "Solar Traffic Blinkers & Road Safety Systems"
      ];
      
      const numColumns = 3;
      const columnWidth = (contentWidth - 10) / numColumns;
      const columnSpacing = 5;
      const boxPadding = 3;
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      
      // First pass: Calculate all row heights
      const rowHeights: number[] = [];
      services.forEach((service, index) => {
        const row = Math.floor(index / numColumns);
        const boxWidth = columnWidth - 5;
        const serviceLines = doc.splitTextToSize(service, boxWidth - 5);
        const textHeight = serviceLines.length * 4;
        const boxHeight = Math.max(textHeight + 4, 10);
        
        if (!rowHeights[row]) {
          rowHeights[row] = boxHeight;
        } else {
          rowHeights[row] = Math.max(rowHeights[row], boxHeight);
        }
      });
      
      // Second pass: Draw services with vertical separators
      let currentRow = -1;
      let rowStartY = yPosition;
      let maxRowHeight = 0;
      
      services.forEach((service, index) => {
        const column = index % numColumns;
        const row = Math.floor(index / numColumns);
        
        // Check if we need a new row
        if (row > currentRow) {
          // No horizontal lines - just update position
          if (currentRow >= 0) {
            yPosition = rowStartY + maxRowHeight + 5;
          }
          
          rowStartY = yPosition;
          currentRow = row;
          maxRowHeight = rowHeights[row] || 10;
          checkPageBreak(15);
        }
        
        const xPos = margin + 5 + (column * (columnWidth + columnSpacing));
        const boxWidth = columnWidth - 5;
        
        // Calculate text height
        const serviceText = service;
        const serviceLines = doc.splitTextToSize(serviceText, boxWidth - 5);
        
        // Draw vertical separator (| line) between columns - only between columns
        if (column > 0) {
          doc.setDrawColor(200, 200, 200);
          doc.setLineWidth(0.5);
          const separatorX = xPos - columnSpacing;
          // Use the row height for the separator
          doc.line(separatorX, rowStartY, separatorX, rowStartY + maxRowHeight);
        }
        
        // Service text
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);
        doc.text(serviceLines, xPos + 2, rowStartY + 3);
      });
      
      // No final row separator - borders removed
      
      // Move to next section after last row
      yPosition = rowStartY + maxRowHeight + 5;

      // Classic Footer with Links
      checkPageBreak(50);
      
      // Top border line
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 12;
      
      // Footer background
      doc.setFillColor(249, 250, 251);
      doc.rect(margin, yPosition - 5, contentWidth, 35, "F");
      
      // Thank you message
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 58, 138);
      doc.text("Thank you for choosing D.G.Yard!", pageWidth / 2, yPosition, { align: "center" });
      yPosition += 8;
      
      // Contact links section
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      
      const linkY = yPosition;
      let linkX = margin + 20;
      
      // Website link
      if (data.companyWebsite) {
        const websiteText = `Website: ${data.companyWebsite}`;
        const websiteWidth = doc.getTextWidth(websiteText);
        doc.setTextColor(30, 58, 138);
        doc.text(websiteText, linkX, linkY);
        // Add clickable link
        doc.link(linkX, linkY - 3, websiteWidth, 4, { url: data.companyWebsite });
        linkX += websiteWidth + 15;
      }
      
      // Email link
      if (data.companyEmail) {
        const emailText = `Email: ${data.companyEmail}`;
        const emailWidth = doc.getTextWidth(emailText);
        doc.setTextColor(30, 58, 138);
        doc.text(emailText, linkX, linkY);
        // Add clickable link
        doc.link(linkX, linkY - 3, emailWidth, 4, { url: `mailto:${data.companyEmail}` });
        linkX += emailWidth + 15;
      }
      
      // Phone link
      if (data.companyPhone) {
        const phoneText = `Contact: ${data.companyPhone}`;
        doc.setTextColor(30, 58, 138);
        doc.text(phoneText, linkX, linkY);
        // Add clickable link
        const phoneWidth = doc.getTextWidth(phoneText);
        doc.link(linkX, linkY - 3, phoneWidth, 4, { url: `tel:${data.companyPhone}` });
      }
      
      yPosition += 10;
      
      // Page numbers
      const totalPages = (doc as any).internal?.getNumberOfPages() || 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Page ${i} of ${totalPages}`,
          pageWidth / 2,
          pageHeight - 8,
          { align: "center" }
        );
      }

      // Watermark is already added at the beginning of each page (behind all content)
      // No need to add again at the end

      // Make text non-selectable (adds protection layer)
      makeTextNonSelectable(doc);

      // Generate PDF as blob and return data URL
      const pdfBlob = doc.output("blob");
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(pdfBlob);
    } catch (error) {
      reject(error);
    }
  });
}
