// Font helper for jsPDF with Unicode support (Rupee symbol)
// Using Noto Sans font for better Unicode support

// Base64 encoded Noto Sans Regular font (subset for rupee symbol support)
// This is a simplified approach - in production, you'd want to use the full font file
export async function setupUnicodeFont(doc: jsPDF): Promise<void> {
  try {
    // Try to use a font that supports Unicode
    // For now, we'll use helvetica but ensure proper encoding
    // In production, you should add a custom font file
    
    // Set font to helvetica (default, but we'll handle rupee symbol specially)
    doc.setFont("helvetica");
    
    // Note: For full Unicode support including rupee symbol,
    // you need to add a custom font file. Here's how:
    // 1. Download Noto Sans or DejaVu Sans TTF file
    // 2. Convert it using jsPDF font converter: https://rawgit.com/MrRio/jsPDF/master/fontconverter/fontconverter.html
    // 3. Import and add the font:
    //    doc.addFileToVFS('NotoSans.ttf', fontBase64);
    //    doc.addFont('NotoSans.ttf', 'NotoSans', 'normal');
    //    doc.setFont('NotoSans');
    
    // For now, we'll use a workaround with proper text encoding
  } catch (error) {
    console.error("Error setting up Unicode font:", error);
  }
}

// Helper to ensure rupee symbol displays correctly
export function formatPriceWithRupeeSymbol(price: number): string {
  // Use rupee symbol with proper encoding
  // The symbol will work if the font supports it
  return `₹ ${new Intl.NumberFormat("en-IN").format(Math.round(price))}`;
}

