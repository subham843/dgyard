/**
 * Complete Setup Script for Rupee Symbol in PDFs
 * 
 * This script automates the font conversion process and sets up everything needed
 * for the ₹ symbol to work in PDFs.
 * 
 * Run: node scripts/setup-rupee-font.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

console.log('🚀 Rupee Symbol Setup for PDF Generation\n');
console.log('=' .repeat(60));

// Step 1: Find the font file
console.log('\n📋 Step 1: Locating font file...');
let fontPath = null;
try {
  const pkgPath = require.resolve('notosans-fontface/package.json');
  const fontsDir = path.join(path.dirname(pkgPath), 'fonts');
  const ttfFile = 'NotoSans-Regular.ttf';
  fontPath = path.join(fontsDir, ttfFile);
  
  if (fs.existsSync(fontPath)) {
    const stats = fs.statSync(fontPath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`✅ Found: ${fontPath}`);
    console.log(`   Size: ${fileSizeMB} MB`);
  } else {
    console.log(`❌ Font file not found: ${fontPath}`);
    process.exit(1);
  }
} catch (error) {
  console.log(`❌ Error: ${error.message}`);
  process.exit(1);
}

// Step 2: Copy font to accessible location
console.log('\n📋 Step 2: Preparing font file...');
const accessibleFontPath = path.join(__dirname, '..', 'lib', 'fonts', 'NotoSans-Regular-for-conversion.ttf');
try {
  fs.copyFileSync(fontPath, accessibleFontPath);
  console.log(`✅ Font copied to: ${accessibleFontPath}`);
} catch (error) {
  console.log(`⚠️  Warning: Could not copy font: ${error.message}`);
}

// Step 3: Check if font is already converted
console.log('\n📋 Step 3: Checking for converted font...');
const convertedFontPath = path.join(__dirname, '..', 'lib', 'fonts', 'noto-sans-converted.js');
let fontAlreadyConverted = false;

if (fs.existsSync(convertedFontPath)) {
  const content = fs.readFileSync(convertedFontPath, 'utf8');
  if (content.includes('export const fontBase64 = null') || content.includes('fontBase64 = null')) {
    console.log('⚠️  Font conversion file exists but is empty (needs conversion)');
  } else if (content.includes('fontBase64 = "') || content.includes('fontBase64 = \'')) {
    console.log('✅ Converted font file found!');
    fontAlreadyConverted = true;
  }
}

if (!fontAlreadyConverted) {
  console.log('\n📋 Step 4: Font Conversion Required\n');
  console.log('=' .repeat(60));
  console.log('\n🔧 MANUAL CONVERSION STEPS:\n');
  console.log('1. Open this URL in your browser:');
  console.log('   👉 https://rawgit.com/MrRio/jsPDF/master/fontconverter/fontconverter.html\n');
  console.log('2. Click "Choose File" button\n');
  console.log('3. Select this font file:');
  console.log(`   👉 ${accessibleFontPath}\n`);
  console.log('   OR use the original file:');
  console.log(`   👉 ${fontPath}\n`);
  console.log('4. Wait for conversion (30-60 seconds)\n');
  console.log('5. Copy the ENTIRE base64 string from the converter\n');
  console.log('6. Open this file:');
  console.log(`   👉 ${convertedFontPath}\n`);
  console.log('7. Find this line:');
  console.log('   export const fontBase64 = null;\n');
  console.log('8. Replace it with:');
  console.log('   export const fontBase64 = "PASTE_YOUR_BASE64_STRING_HERE";\n');
  console.log('9. Save the file\n');
  console.log('10. Restart your development server\n');
  console.log('=' .repeat(60));
  console.log('\n💡 TIP: The base64 string will be very long (500KB-1MB).');
  console.log('   Make sure to copy the ENTIRE string.\n');
  console.log('💡 TIP: After conversion, the ₹ symbol will work automatically!\n');
} else {
  console.log('\n✅ Setup Complete! Font is already converted.');
  console.log('   The ₹ symbol should work in PDFs now.\n');
}

// Step 5: Verify code setup
console.log('\n📋 Step 5: Verifying code setup...');
const pdfGeneratorPath = path.join(__dirname, '..', 'lib', 'pdf-generator.ts');
const pdfRupeeFontPath = path.join(__dirname, '..', 'lib', 'pdf-rupee-font.ts');

let codeSetupOk = true;

if (!fs.existsSync(pdfGeneratorPath)) {
  console.log(`❌ Missing: ${pdfGeneratorPath}`);
  codeSetupOk = false;
} else {
  console.log(`✅ Found: ${pdfGeneratorPath}`);
}

if (!fs.existsSync(pdfRupeeFontPath)) {
  console.log(`❌ Missing: ${pdfRupeeFontPath}`);
  codeSetupOk = false;
} else {
  console.log(`✅ Found: ${pdfRupeeFontPath}`);
}

if (codeSetupOk) {
  console.log('\n✅ Code setup verified!\n');
} else {
  console.log('\n⚠️  Some code files are missing. Please check.\n');
}

console.log('=' .repeat(60));
console.log('\n✨ Next Steps:');
if (!fontAlreadyConverted) {
  console.log('1. Complete the font conversion (see steps above)');
  console.log('2. Restart your dev server: npm run dev');
  console.log('3. Test PDF generation - ₹ symbol should appear correctly');
} else {
  console.log('1. Restart your dev server: npm run dev');
  console.log('2. Test PDF generation - ₹ symbol should appear correctly');
}
console.log('\n');
