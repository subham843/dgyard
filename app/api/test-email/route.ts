import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendEmail } from "@/lib/email";

// Test endpoint to debug email sending
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only allow admins to test emails
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Only admins can test emails" }, { status: 403 });
    }

    const { to, subject, html } = await request.json();

    if (!to) {
      return NextResponse.json({ error: "Email address is required" }, { status: 400 });
    }

    console.log("🧪 Testing email sending...");
    console.log("   To:", to);
    console.log("   Subject:", subject || "Test Email");
    console.log("   SMTP_USER:", process.env.SMTP_USER);
    console.log("   SMTP_HOST:", process.env.SMTP_HOST || "smtp.gmail.com");
    console.log("   SMTP_PORT:", process.env.SMTP_PORT || "587");

    const result = await sendEmail({
      to,
      subject: subject || "Test Email from D.G.Yard",
      html: html || `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #3A59FF 0%, #445AF7 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Test Email</h1>
              </div>
              <div class="content">
                <p>This is a test email from D.G.Yard system.</p>
                <p>If you received this email, the email system is working correctly!</p>
                <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Test email sent successfully",
        messageId: result.messageId,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Error in test email endpoint:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send test email" },
      { status: 500 }
    );
  }
}




