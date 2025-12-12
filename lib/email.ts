import nodemailer from "nodemailer";

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
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

    const info = await transporter.sendMail({
      from: `"D.G.Yard" <${process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ""),
    });

    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("Error sending email:", error);
    return { success: false, error: error.message };
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

