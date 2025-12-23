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

    // Check eligibility
    const eligibility = checkCancellationEligibility(
      booking.bookingPlacedAt || booking.createdAt,
      booking.technicianAssignedAt,
      booking.workStartedAt,
      booking.status
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

    // Update booking with cancellation request
    const updatedBooking = await prisma.booking.update({
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
      booking: updatedBooking,
    });
  } catch (error: any) {
    console.error("Cancel booking error:", error);
    return NextResponse.json(
      { error: "Failed to process cancellation request" },
      { status: 500 }
    );
  }
}





