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
      return NextResponse.json({ error: "Only dealers can reject bids" }, { status: 403 });
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
        job: {
          select: {
            jobNumber: true,
            title: true,
          },
        },
      },
    });

    if (!bid) {
      return NextResponse.json({ error: "Bid not found" }, { status: 404 });
    }

    await prisma.jobBid.update({
      where: { id: bidId },
      data: {
        status: "REJECTED",
      },
    });

    // Check if this was the last pending bid for the job
    const remainingPendingBids = await prisma.jobBid.count({
      where: {
        jobId: id,
        status: { in: ["PENDING", "COUNTERED"] },
      },
    });

    // If no more pending bids and job is in negotiation, return to pool
    if (remainingPendingBids === 0 && job.status === "PENDING") {
      // Track rejection for cooldown
      await prisma.jobPost.update({
        where: { id },
        data: {
          reCirculationCount: (job.reCirculationCount || 0) + 1,
          lastRejectedAt: new Date(),
        },
      });
    }

    // Notify technician about bid rejection
    if (bid.technician.user) {
      // Email notification
      try {
        const emailHtml = `
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #dc2626;">Bid Rejected</h2>
                <p>Hello ${bid.technician.fullName},</p>
                <p>We regret to inform you that your bid for job <strong>${bid.job.jobNumber}</strong> has been rejected by the dealer.</p>
                <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p><strong>Job:</strong> ${bid.job.title || bid.job.jobNumber}</p>
                  <p><strong>Your Bid Amount:</strong> ₹${bid.offeredPrice.toLocaleString("en-IN")}</p>
                </div>
                <p>You can view other available jobs and submit new bids on your dashboard.</p>
                <div style="text-align: center; margin-top: 30px;">
                  <a href="${process.env.APP_URL || "http://localhost:3000"}/technician/dashboard" style="background: #3A59FF; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    View Dashboard
                  </a>
                </div>
              </div>
            </body>
          </html>
        `;
        
        await sendEmail({
          to: bid.technician.email,
          subject: `Bid Rejected - ${bid.job.jobNumber}`,
          html: emailHtml,
        });
      } catch (error) {
        console.error("Error sending email notification:", error);
      }

      // WhatsApp notification
      try {
        const whatsappMessage = `❌ *Bid Rejected*\n\n` +
          `Hello ${bid.technician.fullName},\n\n` +
          `Your bid for job *${bid.job.jobNumber}* has been rejected.\n\n` +
          `*Job:* ${bid.job.title || bid.job.jobNumber}\n` +
          `*Your Bid:* ₹${bid.offeredPrice.toLocaleString("en-IN")}\n\n` +
          `You can view other available jobs on your dashboard.\n\n` +
          `Dashboard: ${process.env.APP_URL || "http://localhost:3000"}/technician/dashboard`;
        
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
        type: "JOB_BID_REJECTED",
        title: "Bid Rejected",
        message: `Your bid of ₹${bid.offeredPrice.toLocaleString("en-IN")} for job ${bid.job.jobNumber} has been rejected.`,
        channels: ["IN_APP"],
        metadata: {
          jobNumber: bid.job.jobNumber,
          jobId: id,
          bidId: bidId,
          offeredPrice: bid.offeredPrice,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error rejecting bid:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reject bid" },
      { status: 500 }
    );
  }
}






