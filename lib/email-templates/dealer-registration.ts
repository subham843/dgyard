export function getDealerRegistrationEmail(dealer: any) {
  const appUrl = process.env.APP_URL || "http://localhost:3000";

  return {
    subject: "Dealer Registration Successful - D.G.Yard",
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
            .status-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; border-radius: 6px; margin: 20px 0; }
            .button { background: #3A59FF; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Registration Successful!</h1>
              <p>Welcome to D.G.Yard Dealer Network</p>
            </div>
            <div class="content">
              <p>Dear ${dealer.fullName},</p>
              
              <p>Thank you for registering as a dealer with D.G.Yard. Your mobile number and email have been successfully verified.</p>

              <div class="status-box">
                <h2 style="margin-top: 0; color: #856404;">⏳ Pending Admin Approval</h2>
                <p><strong>Your account is currently pending admin approval.</strong></p>
                <p>Our admin team will review your registration details and approve your account within 24 hours. You will receive notifications via email and WhatsApp once your account is approved.</p>
                <p>You can also check your account status by logging into your dashboard.</p>
              </div>

              <div class="info-box">
                <h3>Registration Details</h3>
                <p><strong>Business Name:</strong> ${dealer.businessName}</p>
                <p><strong>Email:</strong> ${dealer.user?.email}</p>
                <p><strong>Mobile:</strong> ${dealer.mobile}</p>
                <p><strong>Status:</strong> <span style="color: #ffc107; font-weight: bold;">Pending Approval</span></p>
              </div>

              <div style="text-align: center; margin-top: 30px;">
                <a href="${appUrl}/dashboard" class="button">
                  Go to Dashboard
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











