import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { validateJobStateForOperation, validateStateTransition } from "@/lib/services/job-state-validator";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let jobId: string | undefined;
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const technician = await prisma.technician.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!technician) {
      return NextResponse.json(
        { error: "Technician profile not found" },
        { status: 404 }
      );
    }

    const { id } = await params;
    jobId = id;
    
    const job = await prisma.jobPost.findUnique({
      where: { id },
      include: {
        technician: true,
        dealer: {
          include: {
            dealer: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    if (job.assignedTechnicianId !== technician.id) {
      return NextResponse.json(
        { error: "You are not assigned to this job" },
        { status: 403 }
      );
    }

    // Validate state for complete operation
    const stateValidation = validateJobStateForOperation(job.status, "complete");
    if (!stateValidation.valid) {
      return NextResponse.json({ error: stateValidation.error }, { status: 400 });
    }

    // Validate state transition
    const transitionValidation = validateStateTransition(job.status, "COMPLETION_PENDING_APPROVAL");
    if (!transitionValidation.valid) {
      return NextResponse.json({ error: transitionValidation.error }, { status: 400 });
    }

    const { beforePhotos, afterPhotos, remarks, customerOtp, workChecklist } = await request.json();

    // Validation
    if (!beforePhotos || beforePhotos.length === 0) {
      return NextResponse.json(
        { error: "Before photos are required" },
        { status: 400 }
      );
    }

    if (!afterPhotos || afterPhotos.length === 0) {
      return NextResponse.json(
        { error: "After photos are required" },
        { status: 400 }
      );
    }

    // Remarks is now optional - validation removed

    if (!customerOtp) {
      return NextResponse.json(
        { error: "Customer OTP is required" },
        { status: 400 }
      );
    }

    // Verify OTP
    if (job.completionOtp !== customerOtp.toString()) {
      return NextResponse.json(
        { error: "Invalid OTP" },
        { status: 400 }
      );
    }

    // Check if OTP has expired
    if (!job.otpExpiresAt || new Date() > new Date(job.otpExpiresAt)) {
      return NextResponse.json(
        { error: "OTP has expired. Please request a new OTP." },
        { status: 400 }
      );
    }

    // Check if OTP already verified
    if (job.otpVerifiedAt) {
      return NextResponse.json(
        { error: "OTP already verified" },
        { status: 400 }
      );
    }

    // Update job status to COMPLETION_PENDING_APPROVAL (waiting for dealer approval)
    await prisma.jobPost.update({
      where: { id },
      data: {
        status: "COMPLETION_PENDING_APPROVAL",
        beforePhotos: beforePhotos,
        afterPhotos: afterPhotos,
        notes: remarks || job.notes || "", // Use notes field for remarks
        otpVerifiedAt: new Date(),
        // Don't set completedAt or warrantyStartDate yet - wait for approval
      },
    });

    // Update technician stats (totalJobs and completedJobs)
    // This ensures trust score calculation works correctly
    try {
      const currentTechnician = await prisma.technician.findUnique({
        where: { id: technician.id },
        select: { totalJobs: true, completedJobs: true },
      });

      if (currentTechnician) {
        const newCompletedJobs = currentTechnician.completedJobs + 1;
        // Increment completedJobs and ensure totalJobs is at least equal to completedJobs
        const updateData: any = {
          completedJobs: {
            increment: 1,
          },
        };
        
        // Set totalJobs to at least match completedJobs (for backward compatibility)
        if (currentTechnician.totalJobs === 0 || currentTechnician.totalJobs < newCompletedJobs) {
          updateData.totalJobs = newCompletedJobs;
        }
        
        await prisma.technician.update({
          where: { id: technician.id },
          data: updateData,
        });
      }
    } catch (statError) {
      console.error("Error updating technician stats:", statError);
      // Don't fail the request if stats update fails
    }

    // Payment split will be created when dealer approves (via approve endpoint)
    // Don't create payment here - wait for dealer approval

    // Send notifications to dealer and customer
    try {
      const jobDealer = job.dealer;
      const jobTechnician = job.technician;
      const dealerEmail = jobDealer?.dealer?.email || job.dealerEmail;
      const dealerPhone = jobDealer?.dealer?.mobile || job.dealerPhone;
      const dealerName = jobDealer?.dealer?.businessName || job.dealerName;
      const technicianName = jobTechnician?.fullName || "Technician";
      const reviewLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/jobs/${id}/review`;

      // Notify Dealer
      if (dealerEmail) {
        try {
          await sendEmail({
            to: dealerEmail,
            subject: `Job Completed - ${job.jobNumber}`,
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
                    .button { display: inline-block; padding: 12px 24px; background: #3A59FF; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="header">
                      <h1>⏳ Job Pending Approval</h1>
                    </div>
                    <div class="content">
                      <p>Hello ${dealerName},</p>
                      <p>The technician has marked job <strong>${job.title}</strong> as completed and is waiting for your approval.</p>
                      <p><strong>Job Number:</strong> ${job.jobNumber}</p>
                      <p><strong>Technician:</strong> ${technicianName}</p>
                      <p><strong>Completed At:</strong> ${new Date().toLocaleString('en-IN')}</p>
                      <p style="margin-top: 30px; padding: 15px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                        <strong>⚠️ Action Required:</strong> Please review and approve the work to release payment to the technician.
                      </p>
                      <p style="margin-top: 20px;">
                        <strong>Please review the technician's work:</strong>
                      </p>
                      <a href="${reviewLink}?type=DEALER_TO_TECHNICIAN" class="button">Review & Approve</a>
                      <p style="margin-top: 30px; font-size: 14px; color: #666;">
                        Your feedback helps maintain quality standards.
                      </p>
                    </div>
                  </div>
                </body>
              </html>
            `,
            text: `Job Pending Approval!\n\nHello ${dealerName},\n\nThe technician has marked job "${job.title}" (${job.jobNumber}) as completed. Please review and approve to release payment.\n\nReview: ${reviewLink}?type=DEALER_TO_TECHNICIAN`,
          });
        } catch (error) {
          console.error("Error sending email to dealer:", error);
        }
      }

      // WhatsApp to Dealer
      if (dealerPhone) {
        try {
          await sendWhatsAppMessage({
            to: dealerPhone,
            message: `⏳ *Job Pending Approval*\n\nJob: ${job.title}\nJob Number: ${job.jobNumber}\nTechnician: ${technicianName}\n\n⚠️ Action Required: Please review and approve to release payment.\n\nReview: ${reviewLink}?type=DEALER_TO_TECHNICIAN`,
          });
        } catch (error) {
          console.error("Error sending WhatsApp to dealer:", error);
        }
      }

      // Notify Customer
      if (job.customerEmail) {
        try {
          await sendEmail({
            to: job.customerEmail,
            subject: `Service Completed - ${job.jobNumber}`,
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
                    .button { display: inline-block; padding: 12px 24px; background: #3A59FF; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="header">
                      <h1>✅ Service Completed!</h1>
                    </div>
                    <div class="content">
                      <p>Hello ${job.customerName},</p>
                      <p>Your service request has been completed successfully!</p>
                      <p><strong>Service:</strong> ${job.title}</p>
                      <p><strong>Job Number:</strong> ${job.jobNumber}</p>
                      <p><strong>Technician:</strong> ${technicianName}</p>
                      <p style="margin-top: 30px;">
                        <strong>We'd love your feedback:</strong>
                      </p>
                      <a href="${reviewLink}?type=CUSTOMER_TO_TECHNICIAN" class="button">Review Technician</a>
                      <a href="${reviewLink}?type=CUSTOMER_TO_DEALER" class="button" style="background: #10b981; margin-left: 10px;">Review Dealer</a>
                      <p style="margin-top: 30px; font-size: 14px; color: #666;">
                        Your feedback helps us improve our services.
                      </p>
                    </div>
                  </div>
                </body>
              </html>
            `,
            text: `Service Completed!\n\nHello ${job.customerName},\n\nYour service "${job.title}" (${job.jobNumber}) has been completed by ${technicianName}.\n\nPlease review:\nTechnician: ${reviewLink}?type=CUSTOMER_TO_TECHNICIAN\nDealer: ${reviewLink}?type=CUSTOMER_TO_DEALER`,
          });
        } catch (error) {
          console.error("Error sending email to customer:", error);
        }
      }

      // WhatsApp to Customer
      if (job.customerPhone) {
        try {
          await sendWhatsAppMessage({
            to: job.customerPhone,
            message: `✅ *Service Completed!*\n\nService: ${job.title}\nJob Number: ${job.jobNumber}\nTechnician: ${technicianName}\n\nPlease review:\nTechnician: ${reviewLink}?type=CUSTOMER_TO_TECHNICIAN\nDealer: ${reviewLink}?type=CUSTOMER_TO_DEALER`,
          });
        } catch (error) {
          console.error("Error sending WhatsApp to customer:", error);
        }
      }

      // Create in-app notifications
      try {
        // Notification to Dealer
        await prisma.notification.create({
          data: {
            userId: job.dealerId,
            jobId: id,
            type: "JOB_COMPLETED",
            title: "Job Pending Approval",
            message: `Job ${job.jobNumber} has been completed by technician. Please review and approve to release payment.`,
            channel: "IN_APP",
            metadata: {
              link: `/jobs/${id}/review?type=DEALER_TO_TECHNICIAN`,
              reviewType: "DEALER_TO_TECHNICIAN",
            },
          },
        });

        // Notification to Customer (if customer has account)
        // Note: Customer might not have account, so we'll try to find by email/phone
        const customerUser = await prisma.user.findFirst({
          where: {
            OR: [
              { email: job.customerEmail || "" },
              { phone: job.customerPhone || "" },
            ],
          },
        });

        if (customerUser) {
          await prisma.notification.create({
            data: {
              userId: customerUser.id,
              jobId: id,
              type: "JOB_COMPLETED",
              title: "Service Completed",
              message: `Your service ${job.jobNumber} has been completed. Please review.`,
              channel: "IN_APP",
              metadata: {
                link: `/jobs/${id}/review?type=CUSTOMER_TO_TECHNICIAN`,
                reviewType: "CUSTOMER_TO_TECHNICIAN",
              },
            },
          });
        }
      } catch (error) {
        console.error("Error creating notifications:", error);
      }
    } catch (error) {
      console.error("Error sending completion notifications:", error);
      // Don't fail the request if notifications fail
    }

    return NextResponse.json({
      success: true,
      message: "Job completed successfully. Waiting for dealer approval.",
    });
  } catch (error: any) {
    console.error("Error completing job:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      jobId: jobId,
    });
    return NextResponse.json(
      { 
        error: "Failed to complete job",
        message: error.message || "An unexpected error occurred",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

