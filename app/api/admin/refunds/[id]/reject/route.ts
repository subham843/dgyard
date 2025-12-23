import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email || "" },
      select: { role: true, id: true, name: true },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = params;
    const body = await request.json();
    const { reason } = body;

    if (!reason) {
      return NextResponse.json({ error: "Rejection reason is required" }, { status: 400 });
    }

    // Try Orders
    const order = await prisma.order.findUnique({ where: { id } }).catch(() => null);
    if (order && order.refundStatus && order.refundStatus !== "NONE") {
      await prisma.order.update({
        where: { id },
        data: {
          refundStatus: "REJECTED",
          adminNotes: reason,
        },
      });

      await prisma.auditLog.create({
        data: {
          action: "REFUND_REJECTED",
          userId: user.id,
          userRole: "ADMIN",
          description: `Refund rejected for order ${order.orderNumber}: ${reason}`,
          amount: order.total,
          jobId: id,
          metadata: { refundId: id, type: "ORDER", reason },
        },
      }).catch(() => {});

      return NextResponse.json({ success: true, message: "Refund rejected" });
    }

    // Try Bookings
    const booking = await prisma.booking.findUnique({ where: { id } }).catch(() => null);
    if (booking && booking.refundStatus && booking.refundStatus !== "NONE") {
      await prisma.booking.update({
        where: { id },
        data: {
          refundStatus: "REJECTED",
          adminNotes: reason,
        },
      });

      await prisma.auditLog.create({
        data: {
          action: "REFUND_REJECTED",
          userId: user.id,
          userRole: "ADMIN",
          description: `Refund rejected for booking ${booking.bookingNumber}: ${reason}`,
          amount: booking.actualCost || booking.estimatedCost || 0,
          metadata: { refundId: id, type: "BOOKING", reason },
        },
      }).catch(() => {});

      return NextResponse.json({ success: true, message: "Refund rejected" });
    }

    return NextResponse.json({ error: "Refund not found" }, { status: 404 });
  } catch (error: any) {
    console.error("Error rejecting refund:", error);
    return NextResponse.json(
      { error: "Failed to reject refund", details: error.message },
      { status: 500 }
    );
  }
}
