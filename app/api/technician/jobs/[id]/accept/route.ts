import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendNotification } from "@/lib/notifications";
import { sendEmail } from "@/lib/email";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { validateJobStateForOperation, validateStateTransition } from "@/lib/services/job-state-validator";

// Helper function to calculate distance
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "TECHNICIAN") {
      return NextResponse.json({ error: "Only technicians can accept jobs" }, { status: 403 });
    }

    const { id } = await params;
    
    const technician = await prisma.technician.findUnique({
      where: { userId: session.user.id },
      include: { user: true },
    });

    if (!technician) {
      return NextResponse.json({ error: "Technician profile not found" }, { status: 404 });
    }

    const job = await prisma.jobPost.findUnique({
      where: { id },
      include: {
        dealer: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Validate state for accept operation
    const stateValidation = validateJobStateForOperation(job.status, "accept");
    if (!stateValidation.valid) {
      return NextResponse.json({ error: stateValidation.error }, { status: 400 });
    }

    // Check if job is soft-locked by another technician
    if (job.status === "SOFT_LOCKED") {
      // Check if soft lock has expired
      if (job.softLockExpiresAt && new Date() > job.softLockExpiresAt) {
        // Soft lock expired, release it and allow this technician to accept
        await prisma.jobPost.update({
          where: { id },
          data: {
            status: "PENDING",
            softLockedAt: null,
            softLockExpiresAt: null,
            softLockedByTechnicianId: null,
          },
        });
      } else if (job.softLockedByTechnicianId !== technician.id) {
        // Job is soft-locked by another technician
        return NextResponse.json({ 
          error: "Job is currently being processed by another technician. Please try again in a moment." 
        }, { status: 409 }); // 409 Conflict
      }
      // If soft-locked by this technician, continue (they're confirming)
    }

    if (job.assignedTechnicianId) {
      return NextResponse.json({ error: "Job is already assigned" }, { status: 400 });
    }

    // Check if this technician previously rejected this job (cooldown period)
    if (job.rejectedTechnicianIds && job.rejectedTechnicianIds.includes(technician.id)) {
      // Check if enough time has passed since rejection (5 minutes cooldown)
      if (job.lastRejectedAt) {
        const cooldownPeriod = 5 * 60 * 1000; // 5 minutes in milliseconds
        const timeSinceRejection = Date.now() - job.lastRejectedAt.getTime();
        if (timeSinceRejection < cooldownPeriod) {
          const remainingSeconds = Math.ceil((cooldownPeriod - timeSinceRejection) / 1000);
          return NextResponse.json({ 
            error: `You rejected this job recently. Please wait ${remainingSeconds} seconds before accepting again.` 
          }, { status: 429 }); // 429 Too Many Requests
        }
      }
    }

    // Use job's estimatedCost as the accepted price
    const acceptedPrice = job.estimatedCost || 0;
    if (acceptedPrice <= 0) {
      return NextResponse.json({ error: "Job has no valid price" }, { status: 400 });
    }

    // Calculate distance
    let distanceKm: number | null = null;
    if (job.latitude && job.longitude && technician.latitude && technician.longitude) {
      distanceKm = calculateDistance(
        job.latitude,
        job.longitude,
        technician.latitude,
        technician.longitude
      );
    }

    // SOFT LOCK MECHANISM: If job is PENDING, soft-lock it first (30-60 seconds)
    const softLockDuration = 45 * 1000; // 45 seconds (between 30-60)
    const softLockExpiresAt = new Date(Date.now() + softLockDuration);
    
    // If job is not already soft-locked, create soft lock
    if (job.status === "PENDING") {
      await prisma.jobPost.update({
        where: { id },
        data: {
          status: "SOFT_LOCKED",
          softLockedAt: new Date(),
          softLockExpiresAt: softLockExpiresAt,
          softLockedByTechnicianId: technician.id,
        },
      });
    }

    // Create a bid and immediately accept it
    const bid = await prisma.jobBid.create({
      data: {
        jobId: id,
        technicianId: technician.id,
        offeredPrice: acceptedPrice,
        message: "Accepted job directly",
        status: "ACCEPTED",
        roundNumber: 1,
        distanceKm,
        technicianRating: technician.rating,
      },
    });

    // Reject all other pending bids for this job
    await prisma.jobBid.updateMany({
      where: {
        jobId: id,
        id: { not: bid.id },
        status: { in: ["PENDING", "COUNTERED"] },
      },
      data: {
        status: "REJECTED",
      },
    });

    // Update job - keep in SOFT_LOCKED state (dealer needs to confirm first)
    // The job will transition to WAITING_FOR_PAYMENT when dealer confirms
    const updatedJob = await prisma.jobPost.update({
      where: { id },
      data: {
        status: "SOFT_LOCKED", // Keep in SOFT_LOCKED until dealer confirms
        assignedTechnicianId: technician.id, // Temporarily assign for soft lock
        finalPrice: acceptedPrice,
        priceLocked: false, // Don't lock price yet - wait for dealer confirmation
        // Keep soft lock fields - timer will be reset when dealer views the page
        softLockedAt: new Date(),
        softLockExpiresAt: softLockExpiresAt,
        softLockedByTechnicianId: technician.id,
      },
    });

    // Notify dealer
    if (job.dealer?.user) {
      try {
        // Email notification
        const emailHtml = `
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #3A59FF;">✅ Job Accepted by Technician</h2>
                <p>Hello ${job.dealer.businessName || job.dealer.user.name},</p>
                <p>Technician <strong>${technician.fullName}</strong> has accepted job <strong>${job.jobNumber}</strong> directly.</p>
                <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3A59FF;">
                  <p><strong>Job:</strong> ${job.title || job.jobNumber}</p>
                  <p><strong>Accepted Price:</strong> ₹${acceptedPrice.toLocaleString("en-IN")}</p>
                  <p><strong>Status:</strong> Soft Locked - Please confirm within 45 seconds</p>
                </div>
                <p>Please confirm the acceptance and proceed with payment to complete the job assignment.</p>
                <div style="text-align: center; margin-top: 30px;">
                  <a href="${process.env.APP_URL || "http://localhost:3000"}/dealer/dashboard?module=service-jobs" style="background: #3A59FF; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    View Job & Pay
                  </a>
                </div>
              </div>
            </body>
          </html>
        `;
        
        await sendEmail({
          to: job.dealer.user.email || "",
          subject: `Job Accepted - Payment Required: ${job.jobNumber}`,
          html: emailHtml,
        });
      } catch (error) {
        console.error("Error sending email notification to dealer:", error);
      }

      // WhatsApp notification
      try {
        const whatsappMessage = `✅ *Job Accepted!*\n\n` +
          `Hello ${job.dealer.businessName || job.dealer.user.name},\n\n` +
          `Technician *${technician.fullName}* has accepted job *${job.jobNumber}* directly.\n\n` +
          `*Job:* ${job.title || job.jobNumber}\n` +
          `*Accepted Price:* ₹${acceptedPrice.toLocaleString("en-IN")}\n` +
          `*Status:* Soft Locked - Please confirm within 45 seconds\n\n` +
          `Please confirm the acceptance and proceed with payment to complete the job assignment.\n\n` +
          `View Job: ${process.env.APP_URL || "http://localhost:3000"}/dealer/dashboard?module=service-jobs`;
        
        if (job.dealer.mobile) {
          await sendWhatsAppMessage({
            to: job.dealer.mobile,
            message: whatsappMessage,
          });
        }
      } catch (error) {
        console.error("Error sending WhatsApp notification to dealer:", error);
      }

      // In-app notification
      await sendNotification({
        userId: job.dealerId,
        jobId: id,
        type: "JOB_ACCEPTED",
        title: "Job Accepted by Technician",
        message: `Technician ${technician.fullName} has accepted job ${job.jobNumber} for ₹${acceptedPrice.toLocaleString("en-IN")}. Please confirm within 45 seconds and proceed with payment.`,
        channels: ["IN_APP", "EMAIL"],
        metadata: {
          jobNumber: job.jobNumber,
          jobId: id,
          bidId: bid.id,
          technicianName: technician.fullName,
          acceptedPrice: acceptedPrice,
        },
      });
    }

    // Notify technician
    if (technician.user) {
      try {
        // Email notification
        const emailHtml = `
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #10b981;">🎉 Job Accepted!</h2>
                <p>Hello ${technician.fullName},</p>
                <p>You have successfully accepted job <strong>${job.jobNumber}</strong>.</p>
                <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                  <p><strong>Job:</strong> ${job.title || job.jobNumber}</p>
                  <p><strong>Accepted Price:</strong> ₹${acceptedPrice.toLocaleString("en-IN")}</p>
                  <p><strong>Status:</strong> Soft Locked - Waiting for dealer confirmation</p>
                </div>
                <p>The dealer has 45 seconds to confirm your acceptance. Once confirmed, they will proceed with payment.</p>
                <p>Once the dealer confirms and makes the payment, the job status will change to "ASSIGNED" and you can start working on it.</p>
                <p><strong>Note:</strong> If the dealer doesn't confirm within 45 seconds, the soft lock will expire and the job will be returned to the pool.</p>
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
          to: technician.email,
          subject: `Job Accepted - ${job.jobNumber}`,
          html: emailHtml,
        });
      } catch (error) {
        console.error("Error sending email notification to technician:", error);
      }

      // WhatsApp notification
      try {
        const whatsappMessage = `🎉 *Job Accepted!*\n\n` +
          `Hello ${technician.fullName},\n\n` +
          `You have successfully accepted job *${job.jobNumber}*.\n\n` +
          `*Job:* ${job.title || job.jobNumber}\n` +
          `*Accepted Price:* ₹${acceptedPrice.toLocaleString("en-IN")}\n` +
          `*Status:* Soft Locked - Waiting for dealer confirmation\n\n` +
          `The dealer has 45 seconds to confirm. Once confirmed and payment is received, you can start the job.\n\n` +
          `View Details: ${process.env.APP_URL || "http://localhost:3000"}/technician/dashboard`;
        
        await sendWhatsAppMessage({
          to: technician.mobile,
          message: whatsappMessage,
        });
      } catch (error) {
        console.error("Error sending WhatsApp notification to technician:", error);
      }

      // In-app notification
      await sendNotification({
        userId: technician.user.id,
        jobId: id,
        type: "JOB_ACCEPTED",
        title: "Job Accepted!",
        message: `You have accepted job ${job.jobNumber} for ₹${acceptedPrice.toLocaleString("en-IN")}. The dealer has 45 seconds to confirm. Once confirmed, they will proceed with payment. If the dealer doesn't confirm within 45 seconds, the job will be returned to the pool.`,
        channels: ["IN_APP"],
        metadata: {
          jobNumber: job.jobNumber,
          jobId: id,
          bidId: bid.id,
          acceptedPrice: acceptedPrice,
          paymentDeadlineAt: paymentDeadlineAt.toISOString(),
        },
      });
    }

    return NextResponse.json({ 
      success: true, 
      job: updatedJob,
      message: "Job accepted successfully. Waiting for dealer confirmation (45 seconds)." 
    });
  } catch (error: any) {
    console.error("Error accepting job:", error);
    return NextResponse.json(
      { error: error.message || "Failed to accept job" },
      { status: 500 }
    );
  }
}


