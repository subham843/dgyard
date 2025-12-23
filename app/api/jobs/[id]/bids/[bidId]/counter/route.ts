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
      return NextResponse.json({ error: "Only dealers can send counter offers" }, { status: 403 });
    }

    const { id, bidId } = await params;
    const { amount } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Valid amount is required" }, { status: 400 });
    }

    const job = await prisma.jobPost.findUnique({
      where: { id },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.dealerId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (job.negotiationRounds >= 2) {
      return NextResponse.json(
        { error: "Maximum negotiation rounds (2) reached" },
        { status: 400 }
      );
    }

    const originalBid = await prisma.jobBid.findUnique({
      where: { id: bidId },
      include: {
        technician: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!originalBid) {
      return NextResponse.json({ error: "Bid not found" }, { status: 404 });
    }

    // Create counter offer
    const counterBid = await prisma.jobBid.create({
      data: {
        jobId: id,
        technicianId: originalBid.technicianId,
        offeredPrice: amount,
        status: "PENDING",
        isCounterOffer: true,
        roundNumber: job.negotiationRounds + 1,
        previousBidId: bidId,
        distanceKm: originalBid.distanceKm,
        technicianRating: originalBid.technicianRating,
      },
    });

    // Update original bid status
    await prisma.jobBid.update({
      where: { id: bidId },
      data: {
        status: "COUNTERED",
      },
    });

    // Update job negotiation rounds
    await prisma.jobPost.update({
      where: { id },
      data: {
        negotiationRounds: job.negotiationRounds + 1,
      },
    });

    // Notify technician
    if (originalBid.technician.user) {
      // Email notification
      try {
        const emailHtml = `
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #f59e0b;">💰 Counter Offer Received</h2>
                <p>Hello ${originalBid.technician.fullName},</p>
                <p>The dealer has sent you a counter offer for job <strong>${job.jobNumber}</strong>.</p>
                <div style="background: #fffbeb; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                  <p><strong>Job:</strong> ${job.title || job.jobNumber}</p>
                  <p><strong>Your Original Bid:</strong> ₹${originalBid.offeredPrice.toLocaleString("en-IN")}</p>
                  <p><strong>Counter Offer:</strong> ₹${amount.toLocaleString("en-IN")}</p>
                  ${amount < originalBid.offeredPrice ? `<p style="color: #dc2626;"><strong>Note:</strong> The counter offer is lower than your original bid.</p>` : `<p style="color: #10b981;"><strong>Note:</strong> The counter offer is higher than your original bid.</p>`}
                </div>
                <p>Please review the counter offer and accept or decline it on your dashboard.</p>
                <div style="text-align: center; margin-top: 30px;">
                  <a href="${process.env.APP_URL || "http://localhost:3000"}/technician/dashboard" style="background: #3A59FF; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    Review Counter Offer
                  </a>
                </div>
              </div>
            </body>
          </html>
        `;
        
        await sendEmail({
          to: originalBid.technician.email,
          subject: `Counter Offer Received - ${job.jobNumber}`,
          html: emailHtml,
        });
      } catch (error) {
        console.error("Error sending email notification:", error);
      }

      // WhatsApp notification
      try {
        const whatsappMessage = `💰 *Counter Offer Received*\n\n` +
          `Hello ${originalBid.technician.fullName},\n\n` +
          `You have received a counter offer for job *${job.jobNumber}*.\n\n` +
          `*Job:* ${job.title || job.jobNumber}\n` +
          `*Your Bid:* ₹${originalBid.offeredPrice.toLocaleString("en-IN")}\n` +
          `*Counter Offer:* ₹${amount.toLocaleString("en-IN")}\n\n` +
          `Review and respond on your dashboard.\n\n` +
          `Dashboard: ${process.env.APP_URL || "http://localhost:3000"}/technician/dashboard`;
        
        await sendWhatsAppMessage({
          to: originalBid.technician.mobile,
          message: whatsappMessage,
        });
      } catch (error) {
        console.error("Error sending WhatsApp notification:", error);
      }

      // In-app notification
      await sendNotification({
        userId: originalBid.technician.user.id,
        jobId: id,
        type: "JOB_COUNTER_OFFER",
        title: "Counter Offer Received",
        message: `Counter offer of ₹${amount.toLocaleString("en-IN")} received for job ${job.jobNumber}. Your bid: ₹${originalBid.offeredPrice.toLocaleString("en-IN")}`,
        channels: ["IN_APP"],
        metadata: {
          jobNumber: job.jobNumber,
          jobId: id,
          bidId: counterBid.id,
          originalBidId: bidId,
          offeredPrice: amount,
          originalPrice: originalBid.offeredPrice,
        },
      });
    }

    return NextResponse.json({ success: true, bid: counterBid });
  } catch (error: any) {
    console.error("Error sending counter offer:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send counter offer" },
      { status: 500 }
    );
  }
}






