import { getDealerRegistrationEmail } from "./email-templates/dealer-registration";

export function getDealerStatusUpdateEmail(
  dealer: any,
  action: "approve" | "reject" | "correction",
  note?: string,
  freeTrialServices?: number | null
) {
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  
  let subject = "";
  let title = "";
  let message = "";
  let actionMessage = "";

  if (action === "approve") {
    subject = "Dealer Account Approved - D.G.Yard";
    title = "🎉 Your Dealer Account Has Been Approved!";
    const trialMessage = freeTrialServices && freeTrialServices > 0 
      ? ` You have been granted ${freeTrialServices} free trial service${freeTrialServices > 1 ? 's' : ''} to get started.`
      : "";
    message = `Congratulations ${dealer.fullName}! Your dealer account has been approved. Your onboarding is now complete.${trialMessage} You can now start using all dealer features on our platform.`;
    actionMessage = "You can now log in to your dashboard and start managing your dealer account.";
  } else if (action === "reject") {
    subject = "Dealer Account Application Status - D.G.Yard";
    title = "Dealer Account Application";
    message = `Dear ${dealer.fullName}, we regret to inform you that your dealer account application could not be approved at this time.`;
    actionMessage = note || "Please review your application details and contact us if you have any questions.";
  } else {
    subject = "Correction Required - Dealer Registration - D.G.Yard";
    title = "Correction Required for Your Dealer Registration";
    message = `Dear ${dealer.fullName}, we need some corrections to your dealer registration information before we can proceed with approval.`;
    actionMessage = note || "Please review your registration details and make the necessary corrections.";
  }

  return {
    subject,
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
            .button { background: #3A59FF; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
            .status-badge {
              display: inline-block;
              padding: 6px 12px;
              border-radius: 20px;
              font-weight: bold;
              margin: 10px 0;
            }
            .status-approved { background: #d4edda; color: #155724; }
            .status-rejected { background: #f8d7da; color: #721c24; }
            .status-correction { background: #fff3cd; color: #856404; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${title}</h1>
            </div>
            <div class="content">
              <p>${message}</p>
              
              <div class="info-box">
                <h2 style="margin-top: 0;">Account Status</h2>
                <span class="status-badge status-${action}">
                  ${action === "approve" ? "APPROVED" : action === "reject" ? "REJECTED" : "CORRECTION REQUIRED"}
                </span>
                <p>${actionMessage}</p>
                ${action === "approve" && freeTrialServices && freeTrialServices > 0 ? `<div style="background: #d4edda; padding: 15px; border-radius: 6px; margin-top: 15px;"><strong>🎁 Free Trial:</strong> You have been granted ${freeTrialServices} free trial service${freeTrialServices > 1 ? 's' : ''} to get started with our platform.</div>` : ""}
                ${note && action === "correction" ? `<div style="background: #fff3cd; padding: 15px; border-radius: 6px; margin-top: 15px;"><strong>Note:</strong> ${note}</div>` : ""}
              </div>

              <div class="info-box">
                <h3>Your Registration Details</h3>
                <p><strong>Business Name:</strong> ${dealer.businessName}</p>
                <p><strong>Email:</strong> ${dealer.user?.email}</p>
                <p><strong>Mobile:</strong> ${dealer.mobile}</p>
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

export { getDealerRegistrationEmail };











