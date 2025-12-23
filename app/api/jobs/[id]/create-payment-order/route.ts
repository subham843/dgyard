/**
 * Create Razorpay Order for Job Payment
 * 
 * This endpoint creates a Razorpay order directly for job payments
 * without requiring an Order model entry.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: jobId } = await params;
    const data = await request.json();

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || user.role !== "DEALER") {
      return NextResponse.json(
        { error: "Only dealers can create payment orders" },
        { status: 403 }
      );
    }

    // Get job details
    const job = await prisma.jobPost.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Verify job belongs to dealer
    if (job.dealerId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized to create payment for this job" },
        { status: 403 }
      );
    }

    const amount = data.amount || job.finalPrice || job.estimatedCost || 0;

    if (amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than 0" },
        { status: 400 }
      );
    }

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
        name: user.name || "",
        email: user.email || "",
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





