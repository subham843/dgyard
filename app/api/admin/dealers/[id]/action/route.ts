import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { getDealerStatusUpdateEmail } from "@/lib/email-templates";
import { sendWhatsAppMessage, getDealerStatusUpdateWhatsAppMessage } from "@/lib/whatsapp";
import { sendNotification } from "@/lib/notifications";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const { action, note, freeTrialServices } = await request.json();

    if (!["approve", "reject", "correction"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action" },
        { status: 400 }
      );
    }

    const dealer = await prisma.dealer.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            email: true,
            phone: true,
            name: true,
          },
        },
      },
    });

    if (!dealer) {
      return NextResponse.json(
        { error: "Dealer not found" },
        { status: 404 }
      );
    }

    let newStatus: "APPROVED" | "REJECTED" | "PENDING_APPROVAL";
    let message = "";

    if (action === "approve") {
      newStatus = "APPROVED";
      message = "Dealer approved successfully";
    } else if (action === "reject") {
      newStatus = "REJECTED";
      message = "Dealer rejected";
    } else {
      newStatus = "PENDING_APPROVAL";
      message = "Correction requested sent to dealer";
    }

    const updateData: any = { accountStatus: newStatus };
    
    // If approving, save free trial services if provided
    if (action === "approve" && freeTrialServices !== null && freeTrialServices !== undefined) {
      updateData.freeTrialServices = parseInt(freeTrialServices) || null;
    }

    const updatedDealer = await prisma.dealer.update({
      where: { id: params.id },
      data: updateData,
      include: {
        user: {
          select: {
            email: true,
            phone: true,
            name: true,
          },
        },
      },
    });

    // Send email notification
    try {
      console.log(`[Dealer ${action}] Sending email to: ${dealer.user.email}`);
      const emailTemplate = getDealerStatusUpdateEmail(updatedDealer, action, note, freeTrialServices);
      const emailResult = await sendEmail({
        to: dealer.user.email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
      });
      
      if (emailResult.success) {
        console.log(`[Dealer ${action}] Email sent successfully`);
      } else {
        console.error(`[Dealer ${action}] Email failed:`, emailResult.error);
      }
    } catch (emailError: any) {
      console.error(`[Dealer ${action}] Error sending email:`, emailError);
      console.error(`[Dealer ${action}] Email error details:`, {
        message: emailError?.message,
        stack: emailError?.stack,
      });
      // Don't fail the request if email fails
    }

    // Send WhatsApp notification
    try {
      // Get phone number - prefer dealer.mobile, fallback to user.phone
      const phoneNumber = dealer.mobile || dealer.user?.phone;
      
      if (!phoneNumber) {
        console.warn(`[Dealer ${action}] No phone number found for dealer: ${dealer.fullName}`);
      } else {
        console.log(`[Dealer ${action}] Sending WhatsApp to: ${phoneNumber}`);
        const whatsappMessage = getDealerStatusUpdateWhatsAppMessage(
          dealer.fullName,
          action,
          note,
          freeTrialServices
        );
        const whatsappResult = await sendWhatsAppMessage({
          to: phoneNumber,
          message: whatsappMessage,
        });
        
        if (whatsappResult.success) {
          console.log(`[Dealer ${action}] WhatsApp sent successfully`);
        } else {
          console.error(`[Dealer ${action}] WhatsApp failed:`, whatsappResult.error);
        }
      }
    } catch (whatsappError: any) {
      console.error(`[Dealer ${action}] Error sending WhatsApp notification:`, whatsappError);
      console.error(`[Dealer ${action}] WhatsApp error details:`, {
        message: whatsappError?.message,
        stack: whatsappError?.stack,
      });
      // Don't fail the request if WhatsApp fails
    }

    // Send dashboard notification (only for approval)
    if (action === "approve") {
      try {
        const trialMessage = freeTrialServices && freeTrialServices > 0 
          ? ` You have been granted ${freeTrialServices} free trial service${freeTrialServices > 1 ? 's' : ''} to get started.`
          : "";
        await sendNotification({
          userId: dealer.userId,
          type: "DEALER_APPROVED",
          title: "Account Approved - Onboarding Complete",
          message: `Congratulations! Your dealer account has been approved. Your onboarding is now complete.${trialMessage} You can now start using all dealer features on our platform.`,
          channels: ["IN_APP"],
          metadata: {
            freeTrialServices: freeTrialServices || null,
          },
        });
      } catch (notificationError) {
        console.error("Error sending dashboard notification:", notificationError);
        // Don't fail the request if notification fails
      }
    }

    // Get phone number for response
    const phoneNumber = dealer.mobile || dealer.user?.phone;

    return NextResponse.json({
      success: true,
      message,
      dealer: updatedDealer,
      notifications: {
        email: dealer.user?.email || null,
        whatsapp: phoneNumber || null,
      },
    });
  } catch (error: any) {
    console.error("Error updating dealer status:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update dealer status" },
      { status: 500 }
    );
  }
}











