/**
 * Rupee Symbol Helper for jsPDF
 * 
 * This module provides a canvas-based solution to render the ₹ symbol
 * in PDFs when custom fonts are not available.
 */

import jsPDF from "jspdf";

/**
 * Create a canvas with the rupee symbol rendered
 * @param fontSize - Font size for the symbol
 * @returns Base64 encoded image data
 */
function createRupeeSymbolImage(fontSize: number = 12): string {
  // Create a canvas element (works in browser environment)
  if (typeof document === 'undefined') {
    // Server-side: return a simple SVG as base64
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${fontSize * 0.8}" height="${fontSize}" viewBox="0 0 12 16">
      <text x="0" y="12" font-family="Arial, sans-serif" font-size="12" fill="black">₹</text>
    </svg>`;
    return 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  canvas.width = fontSize * 1.2;
  canvas.height = fontSize * 1.2;

  ctx.fillStyle = '#000000';
  ctx.font = `${fontSize}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('₹', canvas.width / 2, canvas.height / 2);

  return canvas.toDataURL('image/png');
}

/**
 * Add rupee symbol to PDF using image fallback
 * @param doc - jsPDF document instance
 * @param x - X position
 * @param y - Y position
 * @param fontSize - Font size
 */
export function addRupeeSymbolAsImage(doc: jsPDF, x: number, y: number, fontSize: number = 12): void {
  try {
    const imageData = createRupeeSymbolImage(fontSize);
    if (imageData) {
      doc.addImage(imageData, 'PNG', x, y - fontSize * 0.8, fontSize * 0.8, fontSize * 0.8);
    }
  } catch (error) {
    console.warn('Failed to add rupee symbol as image:', error);
  }
}

/**
 * Format price with rupee symbol - tries font first, falls back to image
 * @param doc - jsPDF document instance
 * @param price - Price value
 * @param x - X position
 * @param y - Y position
 * @param options - Additional options
 * @returns Width used for the rupee symbol (for positioning)
 */
export function addPriceWithRupeeSymbol(
  doc: jsPDF,
  price: number,
  x: number,
  y: number,
  options: { fontSize?: number; align?: 'left' | 'right' | 'center' } = {}
): number {
  const fontSize = options.fontSize || doc.getFontSize() || 12;
  const formattedPrice = new Intl.NumberFormat("en-IN").format(Math.round(price));
  
  // Try to use Unicode font first
  try {
    const fontList = doc.getFontList();
    if (fontList['NotoSans']) {
      doc.setFont('NotoSans');
      const rupeeSymbol = '\u20B9';
      const text = `${rupeeSymbol} ${formattedPrice}`;
      
      if (options.align === 'right') {
        const textWidth = doc.getTextWidth(text);
        doc.text(text, x, y, { align: 'right' });
        return textWidth;
      } else {
        doc.text(text, x, y);
        return doc.getTextWidth(text);
      }
    }
  } catch (e) {
    // Fall through to image method
  }

  // Fallback: Use image for rupee symbol + text for price
  try {
    const rupeeWidth = fontSize * 0.8;
    const spacing = 2;
    
    // Add rupee symbol as image
    addRupeeSymbolAsImage(doc, x, y, fontSize);
    
    // Add price text
    const priceX = options.align === 'right' ? x - rupeeWidth - spacing : x + rupeeWidth + spacing;
    const priceText = formattedPrice;
    
    if (options.align === 'right') {
      const priceWidth = doc.getTextWidth(priceText);
      doc.text(priceText, priceX, y, { align: 'right' });
      return rupeeWidth + spacing + priceWidth;
    } else {
      doc.text(priceText, priceX, y);
      return rupeeWidth + spacing + doc.getTextWidth(priceText);
    }
  } catch (error) {
    // Final fallback: Use "Rs." text
    const fallbackText = `Rs. ${formattedPrice}`;
    if (options.align === 'right') {
      doc.text(fallbackText, x, y, { align: 'right' });
      return doc.getTextWidth(fallbackText);
    } else {
      doc.text(fallbackText, x, y);
      return doc.getTextWidth(fallbackText);
    }
  }
}
