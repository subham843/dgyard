/**
 * PDF Font Setup for Indian Rupee Symbol (₹) Support
 * 
 * This module provides a custom font solution for jsPDF to properly render
 * the Indian Rupee symbol (₹) in PDF documents.
 * 
 * To use a custom font with ₹ symbol support:
 * 1. Download a font that supports ₹ (e.g., Noto Sans, DejaVu Sans, Arial Unicode MS)
 * 2. Convert it using jsPDF font converter: https://rawgit.com/MrRio/jsPDF/master/fontconverter/fontconverter.html
 * 3. Import the converted font file here
 * 4. Use setupRupeeFont() function in pdf-generator.ts
 */

import jsPDF from "jspdf";

// Try to import custom font if available
let rupeeFontBase64: string | null = null;

// Try to load font from multiple sources
try {
  // Option 1: Try converted font (jsPDF format) - BEST OPTION
  const convertedModule = require('./fonts/noto-sans-converted');
  rupeeFontBase64 = convertedModule.fontBase64 || null;
  if (rupeeFontBase64) {
    console.log('✅ Converted Noto Sans font loaded');
  }
} catch (e) {
  try {
    // Option 2: Try loading from npm package (raw TTF)
    const { loadNotoSansBase64Sync } = require('./fonts/load-noto-sans');
    rupeeFontBase64 = loadNotoSansBase64Sync();
    console.log('✅ Noto Sans loaded from npm package');
  } catch (e2) {
    try {
      // Option 3: Try manual font file
      const fontModule = require('./fonts/rupee-font-subset');
      rupeeFontBase64 = fontModule.fontBase64 || null;
      if (rupeeFontBase64) {
        console.log('✅ Font loaded from manual file');
      }
    } catch (e3) {
      rupeeFontBase64 = null;
      console.warn('⚠️ No custom font available - will use ₹ symbol directly');
    }
  }
}

/**
 * Setup a custom font that supports Indian Rupee symbol (₹)
 * 
 * @param doc - jsPDF document instance
 * @param fontBase64 - Base64 encoded font file (optional, if you have a custom font)
 */
export function setupRupeeFont(doc: jsPDF, fontBase64?: string): void {
  try {
    // Check if font is already registered
    const fontList = doc.getFontList();
    
    // Look for Unicode-supporting fonts
    const unicodeFonts = ['RupeeFont', 'NotoSans', 'DejaVuSans', 'ArialUnicodeMS'];
    const availableFont = unicodeFonts.find(font => fontList[font]);
    
    if (availableFont) {
      doc.setFont(availableFont);
      console.log(`✅ Using existing font: ${availableFont}`);
      return;
    }

    // Try to use imported font or provided fontBase64
    const fontToUse = fontBase64 || rupeeFontBase64;
    if (fontToUse) {
      try {
        const fontName = 'NotoSans';
        
        // Check if this is a converted font (jsPDF format) or raw TTF
        // Converted fonts from jsPDF converter are already in the right format
        // Raw TTF files need to be converted first
        
        // Add font to VFS
        doc.addFileToVFS(`${fontName}.ttf`, fontToUse);
        
        // Register and set font
        doc.addFont(`${fontName}.ttf`, fontName, 'normal');
        doc.setFont(fontName);
        console.log(`✅ Font "${fontName}" registered and set successfully`);
        return;
      } catch (error: any) {
        // TTF might not work directly - jsPDF needs converted font format
        // The error message will indicate if it's a format issue
        const errorMsg = error?.message || String(error);
        console.error("❌ Font registration failed:", errorMsg.substring(0, 200));
        if (errorMsg.includes('cmap') || errorMsg.includes('unicode') || errorMsg.includes('parse')) {
          console.warn("⚠️ Font needs jsPDF converter - TTF format not compatible");
          console.warn("   Please convert the font using: https://rawgit.com/MrRio/jsPDF/master/fontconverter/fontconverter.html");
        }
      }
    } else {
      console.warn("⚠️ No font base64 available - rupee symbol may not display correctly");
    }

    // Fallback: Use Helvetica
    // Note: Helvetica doesn't support ₹ symbol
    // The formatPriceWithRupee function will handle fallback to "Rs." or image
    doc.setFont("helvetica");
    console.warn("⚠️ Using default Helvetica font - ₹ symbol will not display correctly");
    
    // Set language/encoding hint for better Unicode support
    try {
      // Set document language (helps some PDF viewers)
      const internal = doc.internal as any;
      if (internal && typeof internal.getDocumentProperties === 'function') {
        const props = internal.getDocumentProperties();
        if (props && typeof props === 'object') {
          props.language = 'en-IN';
        }
      }
    } catch (e) {
      // Ignore if not supported
    }

  } catch (error) {
    console.error("❌ Error setting up Rupee font:", error);
    // Final fallback
    doc.setFont("helvetica");
  }
}

/**
 * Format price with Rupee symbol
 * IMPORTANT: jsPDF standard fonts (Helvetica, Times, Courier) don't support Unicode ₹ symbol
 * They will show incorrect characters like ¹ instead of ₹
 * 
 * Solution Options:
 * 1. Use "Rs." text (current implementation - works reliably)
 * 2. Add a custom Unicode font that supports ₹ (requires font conversion)
 * 
 * @param price - Price to format
 * @param useSymbol - If true, tries to use ₹ symbol (requires custom font)
 */
export function formatPriceWithRupee(price: number, useSymbol: boolean = false): string {
  const formattedPrice = new Intl.NumberFormat("en-IN").format(Math.round(price));
  
  if (useSymbol) {
    // Try to use ₹ symbol - only works if custom Unicode font is loaded
    const rupeeSymbol = '\u20B9'; // ₹ (Unicode U+20B9)
    return `${rupeeSymbol} ${formattedPrice}`;
  } else {
    // Use "Rs." text - works with all fonts, no encoding issues
    return `Rs. ${formattedPrice}`;
  }
}

/**
 * Instructions for adding a custom font:
 * 
 * 1. Download a font that supports ₹ symbol:
 *    - Noto Sans: https://fonts.google.com/noto/specimen/Noto+Sans
 *    - DejaVu Sans: https://dejavu-fonts.github.io/
 *    - Arial Unicode MS (if available)
 * 
 * 2. Convert font to jsPDF format:
 *    - Go to: https://rawgit.com/MrRio/jsPDF/master/fontconverter/fontconverter.html
 *    - Upload your .ttf font file
 *    - Download the converted .js file
 * 
 * 3. Add to project:
 *    - Create lib/fonts/rupee-font.js with the converted font
 *    - Import and use in pdf-generator.ts
 * 
 * Example:
 * ```typescript
 * import rupeeFont from './fonts/rupee-font';
 * 
 * // In setupPDFFont:
 * doc.addFileToVFS('RupeeFont.ttf', rupeeFont);
 * doc.addFont('RupeeFont.ttf', 'RupeeFont', 'normal');
 * doc.setFont('RupeeFont');
 * ```
 */
