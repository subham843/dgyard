import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { jobId, amount } = await request.json();

    if (!jobId || !amount) {
      return NextResponse.json(
        { error: "Job ID and amount are required" },
        { status: 400 }
      );
    }

    // Verify job belongs to dealer
    const job = await prisma.jobPost.findUnique({
      where: { id: jobId },
      include: {
        dealer: {
          select: {
            id: true,
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

    if (job.dealerId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized to pay for this job" },
        { status: 403 }
      );
    }

    if (job.status !== "WAITING_FOR_PAYMENT") {
      return NextResponse.json(
        { error: `Job is not waiting for payment. Current status: ${job.status}` },
        { status: 400 }
      );
    }

    // Get user details for prefill
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        name: true,
        email: true,
      },
    });

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Convert to paise
      currency: "INR",
      receipt: job.jobNumber,
      notes: {
        jobId: job.id,
        jobNumber: job.jobNumber,
        userId: session.user.id,
        type: "JOB_PAYMENT",
      },
    });

    return NextResponse.json({
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID,
      name: "D.G.Yard",
      description: `Payment for Job ${job.jobNumber}`,
      prefill: {
        name: user?.name || "",
        email: user?.email || "",
      },
      theme: {
        color: "#3A59FF",
      },
    });
  } catch (error: any) {
    console.error("Error creating Razorpay order for job:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create payment order" },
      { status: 500 }
    );
  }
}


