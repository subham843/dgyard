/**
 * Load Noto Sans font from npm packages for jsPDF
 * 
 * This module extracts the TTF font file from npm packages
 * and converts it to base64 format for jsPDF use.
 * 
 * Tries multiple packages in order:
 * 1. notosans-fontface (has TTF files)
 * 2. @fontsource/noto-sans (has WOFF2, but we need TTF)
 */

/**
 * Get Noto Sans Regular TTF font file path from npm packages
 * 
 * @returns Path to the TTF font file
 */
export function getNotoSansTTFPath(): string {
  const path = require('path');
  const fs = require('fs');
  
  // Priority 1: Try notosans-fontface package (has TTF files)
  try {
    const fontfacePath = require.resolve('notosans-fontface/package.json');
    const fontfaceDir = path.dirname(fontfacePath);
    const fontsDir = path.join(fontfaceDir, 'fonts');
    
    if (fs.existsSync(fontsDir)) {
      const files = fs.readdirSync(fontsDir);
      // Look for Regular TTF file - exact match: NotoSans-Regular.ttf
      const ttfFile = files.find((file: string) => 
        file.toLowerCase() === 'notosans-regular.ttf' ||
        (file.endsWith('.ttf') && 
         file.toLowerCase().includes('regular') && 
         !file.toLowerCase().includes('italic') &&
         !file.toLowerCase().includes('bold'))
      );
      
      if (ttfFile) {
        return path.join(fontsDir, ttfFile);
      }
      
      // Fallback: any TTF file
      const anyTtf = files.find((file: string) => file.endsWith('.ttf'));
      if (anyTtf) {
        return path.join(fontsDir, anyTtf);
      }
    }
  } catch (e) {
    // Package not found, try next option
  }
  
  // Priority 2: Try @fontsource/noto-sans (but it only has WOFF2)
  try {
    const fontsourcePath = require.resolve('@fontsource/noto-sans/package.json');
    const fontsourceDir = path.dirname(fontsourcePath);
    const filesDir = path.join(fontsourceDir, 'files');
    
    if (fs.existsSync(filesDir)) {
      const files = fs.readdirSync(filesDir);
      const ttfFile = files.find((file: string) => file.endsWith('.ttf'));
      
      if (ttfFile) {
        return path.join(filesDir, ttfFile);
      }
    }
  } catch (e) {
    // Package not found
  }
  
  throw new Error('No TTF font file found. Please install notosans-fontface package or add manual font file.');
}

/**
 * Load Noto Sans font as base64 string for jsPDF
 * 
 * @returns Base64 encoded font string
 */
export async function loadNotoSansBase64(): Promise<string> {
  try {
    const fontPath = getNotoSansTTFPath();
    const fs = require('fs').promises;
    const fontBuffer = await fs.readFile(fontPath);
    return fontBuffer.toString('base64');
  } catch (error) {
    throw new Error(`Failed to load Noto Sans font: ${error}`);
  }
}

/**
 * Load Noto Sans font synchronously (for server-side use)
 * 
 * @returns Base64 encoded font string
 */
export function loadNotoSansBase64Sync(): string {
  try {
    const fontPath = getNotoSansTTFPath();
    const fs = require('fs');
    const fontBuffer = fs.readFileSync(fontPath);
    return fontBuffer.toString('base64');
  } catch (error) {
    throw new Error(`Failed to load Noto Sans font: ${error}`);
  }
}
