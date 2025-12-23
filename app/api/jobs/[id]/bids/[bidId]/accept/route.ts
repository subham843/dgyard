import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendNotification } from "@/lib/notifications";
import { sendEmail } from "@/lib/email";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; bidId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "DEALER") {
      return NextResponse.json({ error: "Only dealers can accept bids" }, { status: 403 });
    }

    const { id, bidId } = await params;
    const job = await prisma.jobPost.findUnique({
      where: { id },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.dealerId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const bid = await prisma.jobBid.findUnique({
      where: { id: bidId },
      include: {
        technician: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!bid) {
      return NextResponse.json({ error: "Bid not found" }, { status: 404 });
    }

    if (bid.jobId !== id) {
      return NextResponse.json({ error: "Bid does not belong to this job" }, { status: 400 });
    }

    // Update bid status
    await prisma.jobBid.update({
      where: { id: bidId },
      data: {
        status: "ACCEPTED",
      },
    });

    // Reject all other bids
    await prisma.jobBid.updateMany({
      where: {
        jobId: id,
        id: { not: bidId },
        status: "PENDING",
      },
      data: {
        status: "REJECTED",
      },
    });

    // Update job - set to WAITING_FOR_PAYMENT (dealer needs to pay first)
    const updatedJob = await prisma.jobPost.update({
      where: { id },
      data: {
        status: "WAITING_FOR_PAYMENT",
        assignedTechnicianId: bid.technicianId,
        assignedAt: new Date(),
        finalPrice: bid.offeredPrice,
        priceLocked: true,
        negotiationRounds: bid.roundNumber,
      },
    });

    // Notify technician
    if (bid.technician.user) {
      // Email notification
      try {
        const emailHtml = `
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #10b981;">🎉 Bid Accepted!</h2>
                <p>Hello ${bid.technician.fullName},</p>
                <p>Great news! Your bid for job <strong>${job.jobNumber}</strong> has been accepted by the dealer.</p>
                <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                  <p><strong>Job:</strong> ${job.title || job.jobNumber}</p>
                  <p><strong>Accepted Bid Amount:</strong> ₹${bid.offeredPrice.toLocaleString("en-IN")}</p>
                  <p><strong>Status:</strong> Waiting for payment from dealer</p>
                </div>
                <p>Once the dealer makes the payment, the job status will change to "ASSIGNED" and you can start working on it.</p>
                <div style="text-align: center; margin-top: 30px;">
                  <a href="${process.env.APP_URL || "http://localhost:3000"}/technician/dashboard" style="background: #3A59FF; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    View Job Details
                  </a>
                </div>
              </div>
            </body>
          </html>
        `;
        
        await sendEmail({
          to: bid.technician.email,
          subject: `Bid Accepted - ${job.jobNumber}`,
          html: emailHtml,
        });
      } catch (error) {
        console.error("Error sending email notification:", error);
      }

      // WhatsApp notification
      try {
        const whatsappMessage = `🎉 *Bid Accepted!*\n\n` +
          `Hello ${bid.technician.fullName},\n\n` +
          `Your bid for job *${job.jobNumber}* has been accepted!\n\n` +
          `*Job:* ${job.title || job.jobNumber}\n` +
          `*Accepted Amount:* ₹${bid.offeredPrice.toLocaleString("en-IN")}\n` +
          `*Status:* Waiting for payment\n\n` +
          `Once payment is received, you can start the job.\n\n` +
          `View Details: ${process.env.APP_URL || "http://localhost:3000"}/technician/dashboard`;
        
        await sendWhatsAppMessage({
          to: bid.technician.mobile,
          message: whatsappMessage,
        });
      } catch (error) {
        console.error("Error sending WhatsApp notification:", error);
      }

      // In-app notification
      await sendNotification({
        userId: bid.technician.user.id,
        jobId: id,
        type: "JOB_BID_ACCEPTED",
        title: "Bid Accepted!",
        message: `Your bid of ₹${bid.offeredPrice.toLocaleString("en-IN")} for job ${job.jobNumber} has been accepted. Waiting for payment.`,
        channels: ["IN_APP"],
        metadata: {
          jobNumber: job.jobNumber,
          jobId: id,
          bidId: bidId,
          offeredPrice: bid.offeredPrice,
        },
      });
    }

    return NextResponse.json({ success: true, job: updatedJob });
  } catch (error: any) {
    console.error("Error accepting bid:", error);
    return NextResponse.json(
      { error: error.message || "Failed to accept bid" },
      { status: 500 }
    );
  }
}






