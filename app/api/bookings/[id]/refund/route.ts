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

    const { reason } = await request.json().catch(() => ({}));

    // Get booking
    const booking = await prisma.booking.findUnique({
      where: { id: params.id },
      include: {
        user: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (booking.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // For bookings, check if payment was made (estimatedCost or actualCost)
    const hasPayment = booking.estimatedCost && booking.estimatedCost > 0;

    // Check if refund can be requested
    if (!hasPayment && !canRequestRefund(booking.status, "PENDING", booking.cancelApprovedAt)) {
      return NextResponse.json(
        { error: "Refund cannot be requested for this booking" },
        { status: 400 }
      );
    }

    // Check eligibility
    const eligibility = checkRefundEligibility(
      booking.cancelApprovedAt,
      null, // Bookings don't have delivery
      null, // Bookings don't have damaged product reports
      booking.refundStatus
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

    // Update booking with refund request
    const updatedBooking = await prisma.booking.update({
      where: { id: params.id },
      data: {
        refundRequestedAt: new Date(),
        refundReason: reason || null,
        refundStatus: "REQUESTED",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Refund request submitted successfully. It will be reviewed by our team.",
      booking: updatedBooking,
    });
  } catch (error: any) {
    console.error("Refund request error:", error);
    return NextResponse.json(
      { error: "Failed to process refund request" },
      { status: 500 }
    );
  }
}





