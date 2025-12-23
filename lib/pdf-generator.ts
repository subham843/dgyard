import jsPDF from "jspdf";

interface InvoiceData {
  invoiceNumber: string;
  orderNumber: string;
  date: string;
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
  shippingAddress: {
    name: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
    sku?: string;
  }>;
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  paymentStatus: string;
  paymentMethod?: string;
  gstin?: string;
  dealerInfo?: {
    businessName: string;
    address?: string;
    gstin?: string;
  };
}

export function generateInvoicePDF(data: InvoiceData): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // Colors
  const primaryColor = [58, 89, 255]; // #3A59FF
  const grayColor = [107, 114, 128]; // #6B7280

  // Header with background
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 40, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", 20, 25);
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(data.invoiceNumber, pageWidth - 20, 25, { align: "right" });
  
  if (data.dealerInfo) {
    doc.setFontSize(10);
    doc.text(data.dealerInfo.businessName, pageWidth - 20, 32, { align: "right" });
  }

  yPosition = 50;

  // Invoice Details
  doc.setTextColor(...grayColor);
  doc.setFontSize(10);
  doc.text("Invoice Date:", 20, yPosition);
  doc.text("Order Number:", 20, yPosition + 6);
  doc.text("Payment Status:", 20, yPosition + 12);

  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.text(new Date(data.date).toLocaleDateString("en-IN"), 70, yPosition);
  doc.text(data.orderNumber, 70, yPosition + 6);
  doc.text(data.paymentStatus, 70, yPosition + 12);

  yPosition += 30;

  // Billing Address
  doc.setFillColor(245, 247, 250);
  doc.rect(20, yPosition - 5, 85, 50, "F");
  
  doc.setTextColor(...grayColor);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Bill To:", 25, yPosition);
  
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(data.customer.name, 25, yPosition + 8);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...grayColor);
  doc.text(data.customer.email, 25, yPosition + 15);
  if (data.customer.phone) {
    doc.text(data.customer.phone, 25, yPosition + 22);
  }

  // Shipping Address
  doc.setFillColor(245, 247, 250);
  doc.rect(115, yPosition - 5, 75, 50, "F");
  
  doc.setTextColor(...grayColor);
  doc.setFontSize(10);
  doc.text("Ship To:", 120, yPosition);
  
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(data.shippingAddress.name, 120, yPosition + 8);
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...grayColor);
  const addressLines = [
    data.shippingAddress.addressLine1,
    data.shippingAddress.addressLine2,
    `${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.pincode}`,
  ].filter(Boolean);
  
  addressLines.forEach((line, index) => {
    doc.text(line, 120, yPosition + 15 + (index * 7));
  });

  yPosition += 60;

  // Items Table Header
  doc.setFillColor(249, 250, 251);
  doc.rect(20, yPosition - 5, pageWidth - 40, 10, "F");
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Item", 25, yPosition);
  doc.text("Qty", 100, yPosition);
  doc.text("Price", 125, yPosition);
  doc.text("Total", pageWidth - 25, yPosition, { align: "right" });

  yPosition += 8;

  // Items
  data.items.forEach((item, index) => {
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    
    // Item name (with line wrapping)
    const itemName = item.name.length > 40 ? item.name.substring(0, 37) + "..." : item.name;
    doc.text(itemName, 25, yPosition);
    
    if (item.sku) {
      doc.setFontSize(8);
      doc.setTextColor(...grayColor);
      doc.text(`SKU: ${item.sku}`, 25, yPosition + 5);
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
    }

    doc.text(item.quantity.toString(), 100, yPosition);
    doc.text(`₹${item.price.toLocaleString("en-IN")}`, 125, yPosition);
    doc.text(`₹${item.total.toLocaleString("en-IN")}`, pageWidth - 25, yPosition, { align: "right" });

    yPosition += item.sku ? 12 : 8;
  });

  yPosition += 5;

  // Totals
  const totalsStartX = pageWidth - 80;
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...grayColor);
  doc.text("Subtotal:", totalsStartX, yPosition, { align: "right" });
  doc.text("Tax (GST):", totalsStartX, yPosition + 8, { align: "right" });
  doc.text("Shipping:", totalsStartX, yPosition + 16, { align: "right" });
  
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text(`₹${data.subtotal.toLocaleString("en-IN")}`, pageWidth - 20, yPosition, { align: "right" });
  doc.text(`₹${data.tax.toLocaleString("en-IN")}`, pageWidth - 20, yPosition + 8, { align: "right" });
  doc.text(`₹${data.shipping.toLocaleString("en-IN")}`, pageWidth - 20, yPosition + 16, { align: "right" });

  // Total with background
  yPosition += 25;
  doc.setFillColor(...primaryColor);
  doc.rect(totalsStartX - 10, yPosition - 8, 90, 12, "F");
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("Total:", totalsStartX, yPosition, { align: "right" });
  doc.text(`₹${data.total.toLocaleString("en-IN")}`, pageWidth - 20, yPosition, { align: "right" });

  // Footer
  yPosition = pageHeight - 30;
  doc.setDrawColor(200, 200, 200);
  doc.line(20, yPosition, pageWidth - 20, yPosition);
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...grayColor);
  doc.text("Thank you for your business!", pageWidth / 2, yPosition + 10, { align: "center" });
  
  if (data.dealerInfo?.gstin) {
    doc.text(`GSTIN: ${data.dealerInfo.gstin}`, pageWidth / 2, yPosition + 16, { align: "center" });
  }

  // Save PDF
  doc.save(`Invoice-${data.invoiceNumber}.pdf`);
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
  items: Array<{
    item: string;
    quantity?: number;
    price?: number;
    total?: number;
  }>;
  totalPrice: number;
  companyName?: string;
  companyTagline?: string;
  companyLogo?: string | null;
  companyWebsite?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyAddress?: string;
  companyCity?: string;
  companyState?: string;
  companyPincode?: string;
  companyCountry?: string;
}

export function generateQuotationPDF(data: QuotationData): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // Colors
  const primaryColor = [58, 89, 255]; // #3A59FF
  const grayColor = [107, 114, 128]; // #6B7280

  // Header with background
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 40, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("QUOTATION", 20, 25);
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  if (data.quotationNumber) {
    doc.text(data.quotationNumber, pageWidth - 20, 25, { align: "right" });
  }
  
  if (data.companyName) {
    doc.setFontSize(10);
    doc.text(data.companyName, pageWidth - 20, 32, { align: "right" });
  }

  yPosition = 50;

  // Company Logo (if available)
  if (data.companyLogo) {
    try {
      // Add logo image (base64)
      doc.addImage(data.companyLogo, "PNG", 20, yPosition, 40, 15);
      yPosition += 20;
    } catch (error) {
      console.error("Error adding logo to PDF:", error);
    }
  }

  // Company Info
  if (data.companyName) {
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(data.companyName, 20, yPosition);
    yPosition += 6;
  }

  if (data.companyTagline) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...grayColor);
    doc.text(data.companyTagline, 20, yPosition);
    yPosition += 6;
  }

  // Company Contact Info
  const contactInfo = [
    data.companyAddress,
    data.companyCity && data.companyState ? `${data.companyCity}, ${data.companyState}` : data.companyCity || data.companyState,
    data.companyPincode,
    data.companyPhone,
    data.companyEmail,
    data.companyWebsite,
  ].filter(Boolean);

  if (contactInfo.length > 0) {
    doc.setFontSize(8);
    doc.setTextColor(...grayColor);
    contactInfo.forEach((info, index) => {
      doc.text(info || "", 20, yPosition + (index * 4));
    });
    yPosition += contactInfo.length * 4 + 5;
  }

  // Quotation Details
  yPosition += 10;
  doc.setDrawColor(200, 200, 200);
  doc.line(20, yPosition, pageWidth - 20, yPosition);
  yPosition += 10;

  doc.setTextColor(...grayColor);
  doc.setFontSize(10);
  doc.text("Quotation Date:", 20, yPosition);
  doc.text("Valid Until:", 20, yPosition + 6);

  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  const today = new Date();
  doc.text(today.toLocaleDateString("en-IN"), 70, yPosition);
  const validUntil = new Date(today);
  validUntil.setDate(validUntil.getDate() + 30);
  doc.text(validUntil.toLocaleDateString("en-IN"), 70, yPosition + 6);

  yPosition += 20;

  // Items Table Header
  doc.setFillColor(249, 250, 251);
  doc.rect(20, yPosition - 5, pageWidth - 40, 10, "F");
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Item", 25, yPosition);
  doc.text("Qty", 120, yPosition);
  doc.text("Price", 145, yPosition);
  doc.text("Total", pageWidth - 25, yPosition, { align: "right" });

  yPosition += 8;

  // Items
  if (data.items && data.items.length > 0) {
    data.items.forEach((item) => {
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      
      // Item name (with line wrapping)
      const itemName = item.item && item.item.length > 50 ? item.item.substring(0, 47) + "..." : (item.item || "");
      doc.text(itemName, 25, yPosition);
      
      const quantity = item.quantity || 1;
      const price = item.price || 0;
      const total = item.total || (price * quantity);

      doc.text(quantity.toString(), 120, yPosition);
      doc.text(`₹${price.toLocaleString("en-IN")}`, 145, yPosition);
      doc.text(`₹${total.toLocaleString("en-IN")}`, pageWidth - 25, yPosition, { align: "right" });

      yPosition += 8;
    });
  }

  yPosition += 5;

  // Total
  const totalsStartX = pageWidth - 80;
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...grayColor);
  doc.text("Total:", totalsStartX, yPosition, { align: "right" });
  
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text(`₹${data.totalPrice.toLocaleString("en-IN")}`, pageWidth - 20, yPosition, { align: "right" });

  // Footer
  yPosition = pageHeight - 30;
  doc.setDrawColor(200, 200, 200);
  doc.line(20, yPosition, pageWidth - 20, yPosition);
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...grayColor);
  doc.text("Thank you for your interest!", pageWidth / 2, yPosition + 10, { align: "center" });
  doc.text("This quotation is valid for 30 days from the date of issue.", pageWidth / 2, yPosition + 16, { align: "center" });

  // Save PDF
  const fileName = data.quotationNumber 
    ? `Quotation-${data.quotationNumber}.pdf` 
    : `Quotation-${today.toISOString().split("T")[0]}.pdf`;
  doc.save(fileName);
}

export async function generateQuotationPDFBlob(data: QuotationData): Promise<string> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // Colors
  const primaryColor = [58, 89, 255]; // #3A59FF
  const grayColor = [107, 114, 128]; // #6B7280

  // Header with background
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 40, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("QUOTATION", 20, 25);
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  if (data.quotationNumber) {
    doc.text(data.quotationNumber, pageWidth - 20, 25, { align: "right" });
  }
  
  if (data.companyName) {
    doc.setFontSize(10);
    doc.text(data.companyName, pageWidth - 20, 32, { align: "right" });
  }

  yPosition = 50;

  // Company Logo (if available)
  if (data.companyLogo) {
    try {
      // Add logo image (base64)
      doc.addImage(data.companyLogo, "PNG", 20, yPosition, 40, 15);
      yPosition += 20;
    } catch (error) {
      console.error("Error adding logo to PDF:", error);
    }
  }

  // Company Info
  if (data.companyName) {
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(data.companyName, 20, yPosition);
    yPosition += 6;
  }

  if (data.companyTagline) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...grayColor);
    doc.text(data.companyTagline, 20, yPosition);
    yPosition += 6;
  }

  // Company Contact Info
  const contactInfo = [
    data.companyAddress,
    data.companyCity && data.companyState ? `${data.companyCity}, ${data.companyState}` : data.companyCity || data.companyState,
    data.companyPincode,
    data.companyPhone,
    data.companyEmail,
    data.companyWebsite,
  ].filter(Boolean);

  if (contactInfo.length > 0) {
    doc.setFontSize(8);
    doc.setTextColor(...grayColor);
    contactInfo.forEach((info, index) => {
      doc.text(info || "", 20, yPosition + (index * 4));
    });
    yPosition += contactInfo.length * 4 + 5;
  }

  // Quotation Details
  yPosition += 10;
  doc.setDrawColor(200, 200, 200);
  doc.line(20, yPosition, pageWidth - 20, yPosition);
  yPosition += 10;

  doc.setTextColor(...grayColor);
  doc.setFontSize(10);
  doc.text("Quotation Date:", 20, yPosition);
  doc.text("Valid Until:", 20, yPosition + 6);

  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  const today = new Date();
  doc.text(today.toLocaleDateString("en-IN"), 70, yPosition);
  const validUntil = new Date(today);
  validUntil.setDate(validUntil.getDate() + 30);
  doc.text(validUntil.toLocaleDateString("en-IN"), 70, yPosition + 6);

  yPosition += 20;

  // Items Table Header
  doc.setFillColor(249, 250, 251);
  doc.rect(20, yPosition - 5, pageWidth - 40, 10, "F");
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Item", 25, yPosition);
  doc.text("Qty", 120, yPosition);
  doc.text("Price", 145, yPosition);
  doc.text("Total", pageWidth - 25, yPosition, { align: "right" });

  yPosition += 8;

  // Items
  if (data.items && data.items.length > 0) {
    data.items.forEach((item) => {
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      
      // Item name (with line wrapping)
      const itemName = item.item && item.item.length > 50 ? item.item.substring(0, 47) + "..." : (item.item || "");
      doc.text(itemName, 25, yPosition);
      
      const quantity = item.quantity || 1;
      const price = item.price || 0;
      const total = item.total || (price * quantity);

      doc.text(quantity.toString(), 120, yPosition);
      doc.text(`₹${price.toLocaleString("en-IN")}`, 145, yPosition);
      doc.text(`₹${total.toLocaleString("en-IN")}`, pageWidth - 25, yPosition, { align: "right" });

      yPosition += 8;
    });
  }

  yPosition += 5;

  // Total
  const totalsStartX = pageWidth - 80;
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...grayColor);
  doc.text("Total:", totalsStartX, yPosition, { align: "right" });
  
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text(`₹${data.totalPrice.toLocaleString("en-IN")}`, pageWidth - 20, yPosition, { align: "right" });

  // Footer
  yPosition = pageHeight - 30;
  doc.setDrawColor(200, 200, 200);
  doc.line(20, yPosition, pageWidth - 20, yPosition);
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...grayColor);
  doc.text("Thank you for your interest!", pageWidth / 2, yPosition + 10, { align: "center" });
  doc.text("This quotation is valid for 30 days from the date of issue.", pageWidth / 2, yPosition + 16, { align: "center" });

  // Return as data URL
  return doc.output("dataurlstring");
}
