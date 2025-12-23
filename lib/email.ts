import nodemailer from "nodemailer";

// Detect if using Gmail
const isGmail = !process.env.SMTP_HOST || process.env.SMTP_HOST.includes("gmail.com");

// Detect if using custom SMTP (not Gmail)
const isCustomSMTP = process.env.SMTP_HOST && !process.env.SMTP_HOST.includes("gmail.com");

// Create reusable transporter with Gmail-specific settings
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true" || false, // Use env variable if set
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  // Gmail-specific settings
  ...(isGmail && {
    service: "gmail",
    tls: {
      rejectUnauthorized: false, // Allow self-signed certificates
    },
    // Connection timeout
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  }),
  // Custom SMTP settings (for mail.dgyard.com etc.)
  ...(isCustomSMTP && {
    tls: {
      rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== "false", // Use env variable
      // Remove outdated SSLv3, use modern TLS
      minVersion: "TLSv1.2",
      maxVersion: "TLSv1.3",
      // Allow insecure TLS for self-signed certificates
      servername: process.env.SMTP_HOST,
    },
    // Connection timeout for custom SMTP
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000,
    // Require TLS for custom SMTP (STARTTLS on port 587)
    requireTLS: true,
    // Disable SSLv3 and use modern TLS
    ignoreTLS: false,
  }),
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions) {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn("SMTP credentials not configured. Email not sent.");
      return { success: false, error: "SMTP not configured" };
    }

    // Check if recipient is Gmail
    const isGmailRecipient = options.to.toLowerCase().includes("@gmail.com");
    const isGmailToGmail = isGmail && isGmailRecipient;
    
    // Log email sending attempt with details
    console.log(`📧 Sending email to: ${options.to}`);
    console.log(`   From: ${process.env.SMTP_USER}`);
    console.log(`   Subject: ${options.subject}`);
    console.log(`   Is Gmail Sender: ${isGmail}`);
    console.log(`   Is Custom SMTP: ${isCustomSMTP}`);
    console.log(`   Is Gmail Recipient: ${isGmailRecipient}`);
    console.log(`   Is Gmail-to-Gmail: ${isGmailToGmail}`);
    console.log(`   SMTP Host: ${process.env.SMTP_HOST || "smtp.gmail.com"}`);
    console.log(`   SMTP Port: ${process.env.SMTP_PORT || "587"}`);
    console.log(`   SMTP Secure: ${process.env.SMTP_SECURE || "false"}`);
    console.log(`   SMTP User: ${process.env.SMTP_USER ? process.env.SMTP_USER.substring(0, 5) + "***" : "NOT SET"}`);
    console.log(`   SMTP Pass: ${process.env.SMTP_PASS ? "***SET***" : "NOT SET"}`);
    
    // Warning for custom SMTP to Gmail
    if (isCustomSMTP && isGmailRecipient) {
      console.log(`⚠️ WARNING: Sending from custom SMTP (${process.env.SMTP_HOST}) to Gmail recipient`);
      console.log(`   Gmail may reject emails if SPF/DKIM records are not properly configured for ${process.env.SMTP_USER?.split("@")[1] || "your domain"}`);
      console.log(`   Check: https://mxtoolbox.com/spf.aspx?domain=${process.env.SMTP_USER?.split("@")[1] || "dgyard.com"}`);
    }
    
    // For Gmail-to-Gmail, skip verification to avoid connection issues
    // Gmail has stricter spam filters for Gmail-to-Gmail emails
    if (isGmail && !isGmailToGmail) {
      try {
        console.log("🔍 Verifying Gmail SMTP connection...");
        await transporter.verify();
        console.log("✅ Gmail SMTP connection verified");
      } catch (verifyError: any) {
        console.error("❌ Gmail SMTP verification failed:", verifyError.message);
        console.error("   Error code:", verifyError.code);
        // Don't fail immediately - try sending anyway
        // Verification sometimes fails but sending still works
      }
    }
    
    if (isGmailToGmail) {
      console.log("⚠️ Gmail-to-Gmail email detected - using optimized settings");
      console.log("   Note: Gmail may filter these emails to spam folder");
    }
    
    // CRITICAL: For Gmail, "from" address MUST match the authenticated SMTP_USER
    // Gmail silently rejects emails if "from" doesn't match authenticated account
    const fromAddress = process.env.SMTP_USER;
    if (!fromAddress) {
      throw new Error("SMTP_USER is not configured");
    }
    
    // Verify "from" matches authenticated user for Gmail
    if (isGmail) {
      const fromEmail = fromAddress.includes("<") 
        ? fromAddress.match(/<(.+)>/)?.[1] || fromAddress
        : fromAddress;
      
      console.log(`   From Address: ${fromEmail}`);
      console.log(`   Authenticated User: ${process.env.SMTP_USER}`);
      
      if (fromEmail.toLowerCase() !== process.env.SMTP_USER.toLowerCase()) {
        console.error(`⚠️ WARNING: From address (${fromEmail}) doesn't match authenticated user (${process.env.SMTP_USER})`);
        console.error(`   Gmail will silently reject emails if "from" doesn't match authenticated account`);
      }
    }
    
    const mailOptions: any = {
      from: `"D.G.Yard" <${fromAddress}>`, // Must match SMTP_USER exactly
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ""),
    };

    // Add Gmail-specific headers for better deliverability
    if (isGmailRecipient) {
      mailOptions.headers = {
        "X-Priority": "1",
        "X-MSMail-Priority": "High",
        "Importance": "high",
        "List-Unsubscribe": `<mailto:${process.env.SMTP_USER}?subject=unsubscribe>`,
        // Add domain authentication headers for custom SMTP
        ...(isCustomSMTP && {
          "X-Mailer": "D.G.Yard Email System",
          "Message-ID": `<${Date.now()}-${Math.random().toString(36)}@${process.env.SMTP_USER.split("@")[1] || "dgyard.com"}>`,
        }),
      };
    }
    
    // Gmail-to-Gmail specific optimizations
    if (isGmailToGmail) {
      // Use simpler email format for Gmail-to-Gmail
      // Add reply-to to avoid spam filters
      mailOptions.replyTo = process.env.SMTP_USER;
      mailOptions.headers = {
        ...mailOptions.headers,
        "X-Mailer": "D.G.Yard OTP System",
        "Precedence": "bulk",
      };
      
      // Ensure text version is clean
      if (!mailOptions.text) {
        mailOptions.text = options.html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
      }
    }

    // For Gmail-to-Gmail, add retry logic
    let info;
    let lastError;
    const maxRetries = isGmailToGmail ? 2 : 1;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (isGmailToGmail && attempt > 1) {
          console.log(`🔄 Retry attempt ${attempt} for Gmail-to-Gmail email...`);
          // Small delay before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        info = await transporter.sendMail(mailOptions);
        
        // Log detailed response from SMTP server
        console.log(`✅ Email sent successfully to ${options.to}${isGmailRecipient ? " (Gmail)" : ""}${isGmailToGmail ? " [Gmail-to-Gmail]" : ""}`);
        console.log(`   Message ID: ${info.messageId}`);
        console.log(`   SMTP Response: ${info.response || "N/A"}`);
        console.log(`   Accepted Recipients: ${info.accepted?.length || 0} - ${info.accepted?.join(", ") || "None"}`);
        console.log(`   Rejected Recipients: ${info.rejected?.length || 0} - ${info.rejected?.join(", ") || "None"}`);
        console.log(`   Pending Recipients: ${info.pending?.length || 0} - ${info.pending?.join(", ") || "None"}`);
        
        // Check if email was actually accepted by SMTP server
        if (info.rejected && info.rejected.length > 0) {
          console.error(`⚠️ WARNING: Email was rejected by SMTP server for: ${info.rejected.join(", ")}`);
          throw new Error(`Email rejected by SMTP server: ${info.response || "Unknown reason"}`);
        }
        
        // For Gmail, check if response indicates success
        if (isGmail && info.response) {
          const responseLower = info.response.toLowerCase();
          if (responseLower.includes("rejected") || responseLower.includes("blocked") || responseLower.includes("denied")) {
            console.error(`⚠️ WARNING: Gmail may have rejected the email. Response: ${info.response}`);
            throw new Error(`Gmail rejected email: ${info.response}`);
          }
        }
        
        return { success: true, messageId: info.messageId };
      } catch (error: any) {
        lastError = error;
        console.error(`❌ Attempt ${attempt} failed for ${options.to}${isGmailToGmail ? " (Gmail-to-Gmail)" : ""}`);
        console.error(`   Error: ${error.message}`);
        console.error(`   Error Code: ${error.code || "N/A"}`);
        console.error(`   Error Command: ${error.command || "N/A"}`);
        console.error(`   Full Error:`, error);
        
        // If it's a connection/auth error, don't retry
        if (error.code === "EAUTH" || error.code === "ECONNECTION") {
          console.error("   Stopping retries due to authentication/connection error");
          break;
        }
        
        // If last attempt, break
        if (attempt === maxRetries) {
          console.error("   All retry attempts exhausted");
          break;
        }
      }
    }
    
    // If we get here, all attempts failed
    throw lastError || new Error("Failed to send email after retries");
  } catch (error: any) {
    const isGmailRecipient = options.to.toLowerCase().includes("@gmail.com");
    const isGmailToGmail = isGmail && isGmailRecipient;
    
    console.error(`❌ Error sending email to ${options.to}${isGmailRecipient ? " (Gmail)" : ""}${isGmailToGmail ? " [Gmail-to-Gmail]" : ""}:`, error);
    
    // Gmail-specific error messages
    let errorMessage = error.message;
    if (isGmail) {
      if (error.code === "EAUTH") {
        errorMessage = "Gmail authentication failed. Please use App Password instead of regular password.";
      } else if (error.code === "ECONNECTION") {
        errorMessage = "Gmail connection failed. Check your internet connection and SMTP settings.";
      } else if (error.message.includes("Invalid login")) {
        errorMessage = "Invalid Gmail credentials. Use App Password from Google Account settings.";
      } else if (error.message.includes("quota") || error.message.includes("rate limit")) {
        errorMessage = "Gmail sending quota exceeded. Please try again later.";
      } else if (isGmailToGmail && error.message.includes("blocked") || error.message.includes("spam")) {
        errorMessage = "Gmail-to-Gmail email may be blocked by spam filters. Email might be in spam folder.";
      }
    }
    
    // Custom SMTP SSL/TLS error messages
    if (isCustomSMTP) {
      if (error.message?.includes("SSL") || error.message?.includes("TLS") || error.message?.includes("handshake")) {
        errorMessage = `SSL/TLS handshake failed. Check SMTP configuration:
- Port 587: Use SMTP_SECURE=false (STARTTLS)
- Port 465: Use SMTP_SECURE=true (SSL)
- Verify SMTP_REJECT_UNAUTHORIZED=false if using self-signed certificate`;
      } else if (error.code === "ECONNECTION") {
        errorMessage = `Connection to ${process.env.SMTP_HOST} failed. Check:
- Server is accessible
- Port ${process.env.SMTP_PORT || "587"} is open
- Firewall allows outbound connections`;
      } else if (error.code === "EAUTH") {
        errorMessage = "SMTP authentication failed. Check SMTP_USER and SMTP_PASS credentials.";
      }
    }
    
    // Log Gmail-to-Gmail specific troubleshooting
    if (isGmailToGmail) {
      console.error("🔧 Gmail-to-Gmail Troubleshooting:");
      console.error("   1. Check if email is in recipient's spam folder");
      console.error("   2. Verify SMTP_USER is a verified Gmail account");
      console.error("   3. Ensure App Password is correctly set");
      console.error("   4. Gmail has strict spam filters for Gmail-to-Gmail emails");
    }
    
    return { success: false, error: errorMessage };
  }
}

// Email Templates
export function getOrderConfirmationEmail(order: any) {
  const itemsList = order.items
    .map(
      (item: any) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
          <strong>${item.product.name}</strong><br>
          <small>Quantity: ${item.quantity} × ₹${item.price.toLocaleString()}</small>
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
          ₹${(item.quantity * item.price).toLocaleString()}
        </td>
      </tr>
    `
    )
    .join("");

  return {
    subject: `Order Confirmation - ${order.orderNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3A59FF 0%, #445AF7 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .order-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .total { background: #295EE7; color: white; padding: 15px; border-radius: 8px; text-align: right; font-size: 20px; font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Order Confirmed!</h1>
              <p>Thank you for your purchase</p>
            </div>
            <div class="content">
              <p>Dear ${order.user?.name || "Customer"},</p>
              <p>Your order has been confirmed and is being processed. We'll notify you once it's shipped.</p>
              
              <div class="order-info">
                <h2 style="margin-top: 0;">Order Details</h2>
                <p><strong>Order Number:</strong> ${order.orderNumber}</p>
                <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString("en-IN", { 
                  weekday: "long", 
                  year: "numeric", 
                  month: "long", 
                  day: "numeric" 
                })}</p>
                <p><strong>Payment Status:</strong> <span style="color: green; font-weight: bold;">${order.paymentStatus}</span></p>
                <p><strong>Order Status:</strong> ${order.status}</p>
              </div>

              <div class="order-info">
                <h3>Items Ordered</h3>
                <table class="table">
                  ${itemsList}
                </table>
              </div>

              <div class="order-info">
                <h3>Shipping Address</h3>
                <p>
                  ${order.address.name}<br>
                  ${order.address.addressLine1}<br>
                  ${order.address.addressLine2 ? order.address.addressLine2 + "<br>" : ""}
                  ${order.address.city}, ${order.address.state} - ${order.address.pincode}<br>
                  ${order.address.country}
                </p>
              </div>

              <div class="total">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                  <span>Subtotal:</span>
                  <span>₹${order.subtotal.toLocaleString()}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                  <span>Tax (GST):</span>
                  <span>₹${order.tax.toLocaleString()}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                  <span>Shipping:</span>
                  <span>${order.shipping === 0 ? "Free" : "₹" + order.shipping.toLocaleString()}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-top: 15px; padding-top: 15px; border-top: 2px solid rgba(255,255,255,0.3);">
                  <span>Total:</span>
                  <span>₹${order.total.toLocaleString()}</span>
                </div>
              </div>

              <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.APP_URL || "http://localhost:3000"}/orders/${order.id}" 
                   style="background: #3A59FF; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  View Order Details
                </a>
              </div>

              <div class="footer">
                <p>If you have any questions, please contact us at support@dgyard.com</p>
                <p>&copy; ${new Date().getFullYear()} D.G.Yard. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

export function getBookingConfirmationEmail(booking: any) {
  return {
    subject: `Booking Confirmation - ${booking.bookingNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3A59FF 0%, #445AF7 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Booking Confirmed!</h1>
              <p>We'll be in touch soon</p>
            </div>
            <div class="content">
              <p>Dear ${booking.user?.name || booking.name || "Customer"},</p>
              <p>Thank you for booking our service. Your booking has been confirmed and our team will contact you shortly.</p>
              
              <div class="info-box">
                <h2 style="margin-top: 0;">Booking Details</h2>
                <p><strong>Booking Number:</strong> ${booking.bookingNumber}</p>
                <p><strong>Service Type:</strong> ${booking.serviceType.replace(/_/g, " ")}</p>
                <p><strong>Status:</strong> ${booking.status}</p>
                ${booking.scheduledAt ? `<p><strong>Scheduled Date:</strong> ${new Date(booking.scheduledAt).toLocaleDateString("en-IN", { 
                  weekday: "long", 
                  year: "numeric", 
                  month: "long", 
                  day: "numeric" 
                })}</p>` : ""}
                <p><strong>Description:</strong> ${booking.description}</p>
              </div>

              <div class="info-box">
                <h3>Contact Information</h3>
                <p><strong>Address:</strong> ${booking.address}</p>
                <p><strong>City:</strong> ${booking.city}</p>
                <p><strong>State:</strong> ${booking.state}</p>
                <p><strong>Pincode:</strong> ${booking.pincode}</p>
                <p><strong>Phone:</strong> ${booking.phone}</p>
                <p><strong>Email:</strong> ${booking.email}</p>
              </div>

              <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.APP_URL || "http://localhost:3000"}/bookings/${booking.id}" 
                   style="background: #295EE7; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  View Booking Details
                </a>
              </div>

              <div class="footer">
                <p>If you have any questions, please contact us at support@dgyard.com</p>
                <p>&copy; ${new Date().getFullYear()} D.G.Yard. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

export function getPaymentSuccessEmail(order: any) {
  return {
    subject: `Payment Successful - Order ${order.orderNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #3A59FF 0%, #445AF7 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✓ Payment Successful!</h1>
              <p>Your payment has been processed</p>
            </div>
            <div class="content">
              <p>Dear ${order.user?.name || "Customer"},</p>
              <p>Great news! Your payment for order <strong>${order.orderNumber}</strong> has been successfully processed.</p>
              
              <div class="info-box">
                <h2 style="margin-top: 0;">Payment Details</h2>
                <p><strong>Order Number:</strong> ${order.orderNumber}</p>
                <p><strong>Amount Paid:</strong> ₹${order.total.toLocaleString()}</p>
                <p><strong>Payment Status:</strong> <span style="color: green; font-weight: bold;">PAID</span></p>
                ${order.razorpayPaymentId ? `<p><strong>Transaction ID:</strong> ${order.razorpayPaymentId}</p>` : ""}
              </div>

              <p>Your order is now being processed and will be shipped soon. You'll receive another email with tracking details once your order is dispatched.</p>

              <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.APP_URL || "http://localhost:3000"}/orders/${order.id}" 
                   style="background: #3A59FF; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  View Order Details
                </a>
              </div>

              <div class="footer">
                <p>If you have any questions, please contact us at support@dgyard.com</p>
                <p>&copy; ${new Date().getFullYear()} D.G.Yard. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

export function getPaymentFailureEmail(order: any, error?: string) {
  return {
    subject: `Payment Failed - Order ${order.orderNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Payment Failed</h1>
              <p>We couldn't process your payment</p>
            </div>
            <div class="content">
              <p>Dear ${order.user?.name || "Customer"},</p>
              <p>Unfortunately, your payment for order <strong>${order.orderNumber}</strong> could not be processed.</p>
              
              <div class="info-box">
                <h2 style="margin-top: 0;">Order Details</h2>
                <p><strong>Order Number:</strong> ${order.orderNumber}</p>
                <p><strong>Amount:</strong> ₹${order.total.toLocaleString()}</p>
                <p><strong>Payment Status:</strong> <span style="color: red; font-weight: bold;">FAILED</span></p>
                ${error ? `<p><strong>Error:</strong> ${error}</p>` : ""}
              </div>

              <p>Don't worry! Your order is still saved. You can try again by clicking the button below.</p>

              <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.APP_URL || "http://localhost:3000"}/checkout?orderId=${order.id}" 
                   style="background: #3A59FF; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Retry Payment
                </a>
              </div>

              <div class="footer">
                <p>If you continue to experience issues, please contact us at support@dgyard.com</p>
                <p>&copy; ${new Date().getFullYear()} D.G.Yard. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  };
}

