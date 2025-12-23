// WhatsApp Notification Service using WhatsApp Web

import { getWhatsAppService } from "./whatsapp-web";

export interface WhatsAppMessage {
  to: string; // Phone number in format: +91XXXXXXXXXX
  message: string;
}

export async function sendWhatsAppMessage(options: WhatsAppMessage) {
  try {
    const service = getWhatsAppService();
    const status = service.getConnectionStatus();

    // Check if WhatsApp Web is connected
    if (!status.isConnected) {
      console.warn("WhatsApp Web is not connected. Message not sent.");
      return { 
        success: false, 
        error: "WhatsApp Web is not connected. Please connect WhatsApp in admin settings." 
      };
    }

    // Send message using WhatsApp Web
    const result = await service.sendMessage(options.to, options.message);
    
    return { 
      success: true, 
      message: "WhatsApp message sent successfully",
      messageId: result.messageId 
    };
  } catch (error: any) {
    console.error("Error sending WhatsApp message:", error);
    return { 
      success: false, 
      error: error.message || "Failed to send WhatsApp message" 
    };
  }
}

export function getDealerRegistrationWhatsAppMessage(dealerName: string, businessName: string) {
  return `Hello ${dealerName}, thank you for registering as a dealer with D.G.Yard. Your mobile number and email have been verified. Your account is pending admin approval and will be reviewed within 24 hours. You will receive notifications via email and WhatsApp once approved. You can also check your status on your dashboard.`;
}

export function getDealerStatusUpdateWhatsAppMessage(
  dealerName: string,
  action: "approve" | "reject" | "correction",
  note?: string,
  freeTrialServices?: number | null
) {
  if (action === "approve") {
    const trialMessage = freeTrialServices && freeTrialServices > 0 
      ? ` You have been granted ${freeTrialServices} free trial service${freeTrialServices > 1 ? 's' : ''} to get started.`
      : "";
    return `Hello ${dealerName}, congratulations! Your dealer account has been approved. Your onboarding is now complete.${trialMessage} You can now log in to your dashboard and start using all dealer features.`;
  } else if (action === "reject") {
    return `Hello ${dealerName}, we regret to inform you that your dealer account application could not be approved at this time. Please contact support for more information.`;
  } else {
    return `Hello ${dealerName}, we need some corrections to your dealer registration. ${note || "Please review your registration details and make the necessary corrections."}`;
  }
}











