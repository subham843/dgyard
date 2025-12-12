/**
 * Automated Font Conversion Script for jsPDF
 * 
 * This script helps convert Noto Sans Regular TTF to jsPDF format
 * 
 * IMPORTANT: jsPDF requires fonts to be converted using their online converter.
 * This script prepares the font file and provides instructions.
 * 
 * To use:
 * 1. Run: node scripts/convert-font-automated.js
 * 2. Follow the instructions to convert the font
 * 3. The converted font will be saved to lib/fonts/noto-sans-converted.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Font Conversion Helper for jsPDF\n');

// Find the TTF font file
let fontPath = null;
try {
  const pkgPath = require.resolve('notosans-fontface/package.json');
  const fontsDir = path.join(path.dirname(pkgPath), 'fonts');
  const files = fs.readdirSync(fontsDir);
  const ttfFile = files.find(f => f.toLowerCase() === 'notosans-regular.ttf');
  
  if (ttfFile) {
    fontPath = path.join(fontsDir, ttfFile);
    console.log('✅ Found font file:', fontPath);
  } else {
    console.log('❌ NotoSans-Regular.ttf not found in node_modules/notosans-fontface/fonts/');
    process.exit(1);
  }
} catch (error) {
  console.log('❌ Error finding font:', error.message);
  process.exit(1);
}

// Check file size
const stats = fs.statSync(fontPath);
const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
console.log(`📦 Font file size: ${fileSizeMB} MB\n`);

console.log('📋 INSTRUCTIONS TO CONVERT FONT:\n');
console.log('1. Open this URL in your browser:');
console.log('   https://rawgit.com/MrRio/jsPDF/master/fontconverter/fontconverter.html\n');
console.log('2. Click "Choose File" and select this font file:');
console.log(`   ${fontPath}\n`);
console.log('3. Wait for conversion (may take 30-60 seconds)\n');
console.log('4. Copy the generated base64 string\n');
console.log('5. Open: lib/fonts/noto-sans-converted.js\n');
console.log('6. Replace: export const fontBase64 = null;\n');
console.log('   With: export const fontBase64 = "PASTE_BASE64_HERE";\n');
console.log('7. Save the file\n');
console.log('8. Restart your dev server\n');
console.log('✅ After conversion, the ₹ symbol will work in PDFs!\n');

// Create a copy of the font in a more accessible location for manual upload
const accessibleFontPath = path.join(__dirname, '..', 'lib', 'fonts', 'NotoSans-Regular-for-conversion.ttf');
try {
  fs.copyFileSync(fontPath, accessibleFontPath);
  console.log(`📁 Font copied to: ${accessibleFontPath}`);
  console.log('   (You can use this file for manual conversion)\n');
} catch (error) {
  console.log('⚠️  Could not copy font file:', error.message);
}

console.log('💡 TIP: The converted font file will be large (~500KB-1MB).');
console.log('   This is normal - jsPDF needs the full font data.\n');
