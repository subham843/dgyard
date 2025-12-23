import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
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

    const { action, note } = await request.json();

    if (!["approve", "reject", "correction"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action" },
        { status: 400 }
      );
    }

    const technician = await prisma.technician.findUnique({
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

    if (!technician) {
      return NextResponse.json(
        { error: "Technician not found" },
        { status: 404 }
      );
    }

    let newStatus: "APPROVED" | "REJECTED" | "PENDING_APPROVAL";
    let message = "";

    if (action === "approve") {
      newStatus = "APPROVED";
      message = "Technician approved successfully";
    } else if (action === "reject") {
      newStatus = "REJECTED";
      message = "Technician rejected";
    } else {
      newStatus = "PENDING_APPROVAL";
      message = "Correction requested sent to technician";
    }

    const updatedTechnician = await prisma.technician.update({
      where: { id: params.id },
      data: { accountStatus: newStatus },
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
      console.log(`[Technician ${action}] Sending email to: ${technician.email || technician.user.email}`);
      const emailSubject = action === "approve" 
        ? "Technician Account Approved - D.G.Yard"
        : action === "reject"
        ? "Technician Account Rejected - D.G.Yard"
        : "Correction Required - Technician Registration - D.G.Yard";
      
      const emailBody = action === "approve"
        ? `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Congratulations! Your Technician Account Has Been Approved</h2>
            <p>Dear ${technician.fullName},</p>
            <p>Your technician account has been approved by our admin team. You can now access your technician dashboard and start receiving service job assignments.</p>
            <p><strong>Next Steps:</strong></p>
            <ul>
              <li>Log in to your dashboard</li>
              <li>Complete your profile if needed</li>
              <li>Start receiving job assignments in your operating area</li>
            </ul>
            <p>Thank you for joining D.G.Yard Connect!</p>
            <p>Best regards,<br>D.G.Yard Team</p>
          </div>
        `
        : action === "reject"
        ? `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">Technician Account Rejected</h2>
            <p>Dear ${technician.fullName},</p>
            <p>We regret to inform you that your technician registration has been rejected.</p>
            ${note ? `<p><strong>Reason:</strong> ${note}</p>` : ""}
            <p>If you have any questions, please contact our support team.</p>
            <p>Best regards,<br>D.G.Yard Team</p>
          </div>
        `
        : `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #f59e0b;">Correction Required - Technician Registration</h2>
            <p>Dear ${technician.fullName},</p>
            <p>Your technician registration requires some corrections before approval.</p>
            <p><strong>Correction Note:</strong></p>
            <p>${note || "Please review your registration details and make necessary corrections."}</p>
            <p>Please log in to your dashboard and update your registration details accordingly.</p>
            <p>Best regards,<br>D.G.Yard Team</p>
          </div>
        `;

      await sendEmail({
        to: technician.email || technician.user.email,
        subject: emailSubject,
        html: emailBody,
      });
      console.log(`[Technician ${action}] Email sent successfully`);
    } catch (emailError: any) {
      console.error(`[Technician ${action}] Error sending email:`, emailError);
      // Don't fail the request if email fails
    }

    // Send WhatsApp notification
    try {
      const phoneNumber = technician.mobile || technician.user?.phone;
      
      if (phoneNumber) {
        console.log(`[Technician ${action}] Sending WhatsApp to: ${phoneNumber}`);
        const whatsappMessage = action === "approve"
          ? `🎉 Congratulations ${technician.fullName}! Your technician account has been approved. You can now access your dashboard and start receiving job assignments. - D.G.Yard`
          : action === "reject"
          ? `We regret to inform you that your technician registration has been rejected.${note ? ` Reason: ${note}` : ""} Please contact support if you have questions. - D.G.Yard`
          : `Your technician registration requires corrections.${note ? ` ${note}` : ""} Please log in and update your details. - D.G.Yard`;
        
        await sendWhatsAppMessage({
          to: phoneNumber,
          message: whatsappMessage,
        });
        console.log(`[Technician ${action}] WhatsApp sent successfully`);
      }
    } catch (whatsappError: any) {
      console.error(`[Technician ${action}] Error sending WhatsApp:`, whatsappError);
      // Don't fail the request if WhatsApp fails
    }

    // Send dashboard notification (only for approval)
    if (action === "approve") {
      try {
        await sendNotification({
          userId: technician.userId,
          type: "TECHNICIAN_APPROVED",
          title: "Account Approved - Onboarding Complete",
          message: "Congratulations! Your technician account has been approved. You can now access the technician dashboard and start receiving service job assignments.",
          channels: ["IN_APP"],
        });
      } catch (notificationError) {
        console.error("Error sending dashboard notification:", notificationError);
        // Don't fail the request if notification fails
      }
    }

    const phoneNumber = technician.mobile || technician.user?.phone;

    return NextResponse.json({
      success: true,
      message,
      technician: updatedTechnician,
      notifications: {
        email: technician.email || technician.user?.email || null,
        whatsapp: phoneNumber || null,
      },
    });
  } catch (error: any) {
    console.error("Error updating technician status:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update technician status" },
      { status: 500 }
    );
  }
}











