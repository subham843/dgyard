import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  checkCancellationEligibility,
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

    const { reason } = await request.json().catch(() => ({}));

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

    // Check eligibility
    const eligibility = checkCancellationEligibility(
      order.orderPlacedAt || order.createdAt,
      order.technicianAssignedAt,
      order.workStartedAt,
      order.status,
      order.deliveryAt
    );

    if (!eligibility.eligible) {
      return NextResponse.json(
        {
          error: eligibility.reason || "Cancellation not allowed",
          timeRemaining: eligibility.timeRemaining,
        },
        { status: 400 }
      );
    }

    // Update order with cancellation request
    const updatedOrder = await prisma.order.update({
      where: { id: params.id },
      data: {
        cancelRequestedAt: new Date(),
        cancellationReason: reason || null,
        status: "CANCELLED",
        // Note: cancelApprovedAt will be set by admin when they approve
      },
    });

    return NextResponse.json({
      success: true,
      message: "Cancellation request submitted successfully",
      order: updatedOrder,
    });
  } catch (error: any) {
    console.error("Cancel order error:", error);
    return NextResponse.json(
      { error: "Failed to process cancellation request" },
      { status: 500 }
    );
  }
}





