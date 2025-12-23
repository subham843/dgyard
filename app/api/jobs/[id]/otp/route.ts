import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { adminAuth } from "@/lib/firebase-admin";
import { sendEmail } from "@/lib/email";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

// POST - Send OTP to customer for job completion
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
      return NextResponse.json({ error: "Only technicians can complete jobs" }, { status: 403 });
    }

    const technician = await prisma.technician.findUnique({
      where: { userId: session.user.id },
    });

    if (!technician) {
      return NextResponse.json({ error: "Technician profile not found" }, { status: 404 });
    }

    const { id } = await params;
    const job = await prisma.jobPost.findUnique({
      where: { id },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.assignedTechnicianId !== technician.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (job.status !== "IN_PROGRESS") {
      return NextResponse.json({ error: "Job must be in progress to complete" }, { status: 400 });
    }

    // Use Firebase to send OTP
    const phoneNumber = job.customerPhone.startsWith("+") 
      ? job.customerPhone 
      : `+91${job.customerPhone.replace(/\D/g, "")}`;

    try {
      // Generate OTP using Firebase Admin
      // Note: Firebase Admin doesn't directly send SMS, but we can use it to verify
      // For now, we'll generate OTP and use Firebase Admin for verification
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiresAt = new Date();
      otpExpiresAt.setMinutes(otpExpiresAt.getMinutes() + 30); // OTP valid for 30 minutes

      // Store OTP in job
      const updatedJob = await prisma.jobPost.update({
        where: { id },
        data: {
          completionOtp: otp,
          otpExpiresAt: otpExpiresAt,
        },
      });

      // Send OTP via WhatsApp and Email
      const otpMessage = `Your job completion OTP is: *${otp}*\n\nJob: ${job.title}\nJob Number: ${job.jobNumber}\n\nThis OTP is valid for 30 minutes. Please share this OTP with the technician to complete the job.`;

      // WhatsApp notification
      let whatsappSent = false;
      let whatsappError = null;
      try {
        const whatsappResult = await sendWhatsAppMessage({
          to: phoneNumber,
          message: `✅ *Job Completed!*\n\n${otpMessage}`,
        });
        whatsappSent = true;
        console.log(`OTP WhatsApp sent successfully to ${phoneNumber}`);
      } catch (error: any) {
        whatsappError = error.message;
        console.error(`Failed to send OTP WhatsApp to ${phoneNumber}:`, error);
      }

      // Email notification
      let emailSent = false;
      let emailError = null;
      const isGmailRecipient = job.customerEmail?.toLowerCase().includes("@gmail.com");
      
      if (job.customerEmail && job.customerEmail.trim()) {
        try {
          console.log(`📧 Attempting to send OTP email to: ${job.customerEmail}${isGmailRecipient ? " (Gmail)" : ""}`);
          
          const emailResult = await sendEmail({
            to: job.customerEmail.trim(),
            subject: `Job Completion OTP - ${job.jobNumber}`,
            html: `
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #3A59FF 0%, #445AF7 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
                    .otp-box { background: white; padding: 30px; border-radius: 8px; margin: 20px 0; text-align: center; border: 2px solid #3A59FF; }
                    .otp { font-size: 32px; font-weight: bold; color: #3A59FF; letter-spacing: 8px; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="header">
                      <h1>Job Completed!</h1>
                    </div>
                    <div class="content">
                      <p>Hello ${job.customerName},</p>
                      <p>Your job has been completed. Please verify using the OTP below:</p>
                      <div class="otp-box">
                        <p style="margin: 0 0 10px 0; font-size: 14px; color: #666;">Your OTP is:</p>
                        <div class="otp">${otp}</div>
                        <p style="margin: 10px 0 0 0; font-size: 12px; color: #666;">Valid for 30 minutes</p>
                      </div>
                      <p><strong>Job:</strong> ${job.title}</p>
                      <p><strong>Job Number:</strong> ${job.jobNumber}</p>
                      <p style="margin-top: 20px; font-size: 14px; color: #666;">
                        Please share this OTP with the technician to complete the job verification.
                      </p>
                    </div>
                  </div>
                </body>
              </html>
            `,
            text: `Job Completion OTP\n\nHello ${job.customerName},\n\nYour job has been completed. Please verify using the OTP below:\n\nOTP: ${otp}\n\nJob: ${job.title}\nJob Number: ${job.jobNumber}\n\nThis OTP is valid for 30 minutes. Please share this OTP with the technician to complete the job verification.`,
          });
          
          if (emailResult && emailResult.success) {
            emailSent = true;
            console.log(`✅ OTP email sent successfully to ${job.customerEmail}${isGmailRecipient ? " (Gmail)" : ""}, Message ID: ${emailResult.messageId || 'N/A'}`);
          } else {
            emailError = emailResult?.error || "Unknown error";
            console.error(`❌ Failed to send OTP email to ${job.customerEmail}${isGmailRecipient ? " (Gmail)" : ""}:`, emailError);
            
            // Log Gmail-specific troubleshooting
            if (isGmailRecipient && emailError.includes("App Password")) {
              console.error("🔧 Gmail Troubleshooting: Make sure SMTP_PASS is an App Password, not your regular Gmail password.");
              console.error("   Steps: Google Account → Security → 2-Step Verification → App Passwords");
            }
          }
        } catch (error: any) {
          emailError = error.message || "Email sending exception";
          console.error(`❌ Exception sending OTP email to ${job.customerEmail}${isGmailRecipient ? " (Gmail)" : ""}:`, error);
        }
      } else {
        console.warn(`⚠️ No customer email found for job ${job.jobNumber} (email: ${job.customerEmail || 'null'})`);
      }

      // Build response message
      let message = "OTP sent to customer";
      const channels = [];
      const warnings = [];
      
      // WhatsApp status
      if (whatsappSent) {
        channels.push("WhatsApp");
      } else if (whatsappError) {
        warnings.push(`WhatsApp failed: ${whatsappError}`);
      }
      
      // Email status
      if (emailSent) {
        channels.push("Email");
      } else if (emailError) {
        warnings.push(`Email failed: ${emailError}`);
      } else if (!job.customerEmail || !job.customerEmail.trim()) {
        warnings.push("No customer email on file");
      }
      
      if (channels.length > 0) {
        message = `OTP sent to customer via ${channels.join(" and ")}`;
      } else {
        message = "OTP generated but failed to send via any channel";
      }
      
      if (warnings.length > 0) {
        message += ` (${warnings.join(", ")})`;
      }

      return NextResponse.json({
        success: channels.length > 0, // Success only if at least one channel worked
        message,
        job: updatedJob,
        whatsappSent,
        whatsappError: whatsappError || null,
        emailSent,
        emailError: emailError || null,
        channels: channels,
        warnings: warnings.length > 0 ? warnings : null,
      });
    } catch (error: any) {
      console.error("Error sending OTP:", error);
      return NextResponse.json(
        { error: error.message || "Failed to send OTP" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error in OTP send:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send OTP" },
      { status: 500 }
    );
  }
}

// PATCH - Verify OTP and complete job
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { otp, firebaseIdToken } = data;

    const { id } = await params;
    const job = await prisma.jobPost.findUnique({
      where: { id },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Get dealer and technician info from stored fields or fetch separately
    // JobPost already has dealerName, dealerPhone, dealerEmail stored
    const dealerInfo = {
      fullName: job.dealerName,
      mobile: job.dealerPhone,
      email: job.dealerEmail,
    };

    // Fetch technician info if needed
    const technician = job.assignedTechnicianId ? await prisma.technician.findUnique({
      where: { id: job.assignedTechnicianId },
      select: {
        fullName: true,
        mobile: true,
        email: true,
      },
    }) : null;

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Verify OTP
    if (!otp) {
      return NextResponse.json({ error: "OTP is required" }, { status: 400 });
    }

    // If Firebase ID token is provided, verify it
    if (firebaseIdToken && adminAuth) {
      try {
        const decodedToken = await adminAuth.verifyIdToken(firebaseIdToken);
        // Verify phone number matches
        if (decodedToken.phone_number !== job.customerPhone && 
            decodedToken.phone_number !== `+91${job.customerPhone.replace(/\D/g, "")}`) {
          return NextResponse.json({ error: "Phone number mismatch" }, { status: 400 });
        }
      } catch (error) {
        console.error("Firebase token verification error:", error);
        // Fall back to OTP verification if Firebase token verification fails
      }
    }

    // Verify OTP matches
    if (job.completionOtp !== otp.toString()) {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
    }

    // Check if OTP has expired
    if (!job.otpExpiresAt || new Date() > new Date(job.otpExpiresAt)) {
      return NextResponse.json({ error: "OTP has expired" }, { status: 400 });
    }

    // Check if already verified
    if (job.otpVerifiedAt) {
      return NextResponse.json({ error: "OTP already verified" }, { status: 400 });
    }

    // Mark job as completion pending approval (dealer/customer must approve)
    const updatedJob = await prisma.jobPost.update({
      where: { id },
      data: {
        status: "COMPLETION_PENDING_APPROVAL" as any, // Type will be updated after Prisma generate
        otpVerifiedAt: new Date(),
        completedAt: new Date(), // Technician completed work at this time
      },
    });

    // Update technician stats
    if (job.assignedTechnicianId) {
      await prisma.technician.update({
        where: { id: job.assignedTechnicianId },
        data: {
          completedJobs: { increment: 1 },
        },
      });
    }

    // Notify dealer and technician
    try {
      const completionMessage = `✅ *Job Completed & Verified!*\n\nJob #${job.jobNumber} has been completed and verified by the customer.\n\nJob: ${job.title}`;

      if (dealerInfo && dealerInfo.mobile) {
        await sendWhatsAppMessage({
          to: dealerInfo.mobile.startsWith("+") ? dealerInfo.mobile : `+91${dealerInfo.mobile.replace(/\D/g, "")}`,
          message: completionMessage,
        });
      }

      if (technician && technician.mobile) {
        await sendWhatsAppMessage({
          to: technician.mobile,
          message: completionMessage,
        });
      }
    } catch (error) {
      console.error("Error sending completion notifications:", error);
    }

    return NextResponse.json({
      success: true,
      message: "OTP verified successfully. Job marked as completed.",
      job: updatedJob,
    });
  } catch (error: any) {
    console.error("Error verifying OTP:", error);
    return NextResponse.json(
      { error: error.message || "Failed to verify OTP" },
      { status: 500 }
    );
  }
}








