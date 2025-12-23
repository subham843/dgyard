import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  checkRefundEligibility,
  canRequestRefund,
} from "@/lib/cancellation-refund-utils";

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

    const { reason, isDamagedProduct, proofImages } = await request.json().catch(() => ({}));

    // Get order
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        user: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (order.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Check if refund can be requested
    if (!canRequestRefund(order.status, order.paymentStatus, order.cancelApprovedAt)) {
      return NextResponse.json(
        { error: "Refund cannot be requested for this order" },
        { status: 400 }
      );
    }

    // Check eligibility
    const eligibility = checkRefundEligibility(
      order.cancelApprovedAt,
      order.deliveryAt,
      order.damagedProductReportedAt,
      order.refundStatus
    );

    if (!eligibility.eligible) {
      return NextResponse.json(
        {
          error: eligibility.reason || "Refund request not allowed",
          timeRemaining: eligibility.timeRemaining,
        },
        { status: 400 }
      );
    }

    // If damaged product, update damagedProductReportedAt
    const updateData: any = {
      refundRequestedAt: new Date(),
      refundReason: reason || null,
      refundStatus: "REQUESTED",
    };

    // If it's a delivered order, treat as damaged product report
    if ((isDamagedProduct || order.status === "DELIVERED") && order.deliveryAt) {
      updateData.damagedProductReportedAt = new Date();
      // Store proof images in adminNotes for now (can be enhanced with separate table)
      if (proofImages && proofImages.length > 0) {
        updateData.adminNotes = `Proof images: ${proofImages.join(", ")}`;
      }
    }

    // Update order with refund request
    const updatedOrder = await prisma.order.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: "Refund request submitted successfully. It will be reviewed by our team.",
      order: updatedOrder,
    });
  } catch (error: any) {
    console.error("Refund request error:", error);
    return NextResponse.json(
      { error: "Failed to process refund request" },
      { status: 500 }
    );
  }
}

