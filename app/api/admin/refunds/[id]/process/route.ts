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

    // Try Orders
    const order = await prisma.order.findUnique({ where: { id } }).catch(() => null);
    if (order && order.refundStatus === "APPROVED") {
      await prisma.order.update({
        where: { id },
        data: {
          refundStatus: "COMPLETED",
          status: "REFUNDED",
        },
      });

      await prisma.auditLog.create({
        data: {
          action: "REFUND_PROCESSED",
          userId: user.id,
          userRole: "ADMIN",
          description: `Refund processed for order ${order.orderNumber}`,
          amount: order.total,
          jobId: id,
          metadata: { refundId: id, type: "ORDER" },
        },
      }).catch(() => {});

      return NextResponse.json({ success: true, message: "Refund processed successfully" });
    }

    // Try Bookings
    const booking = await prisma.booking.findUnique({ where: { id } }).catch(() => null);
    if (booking && booking.refundStatus === "APPROVED") {
      await prisma.booking.update({
        where: { id },
        data: {
          refundStatus: "COMPLETED",
        },
      });

      await prisma.auditLog.create({
        data: {
          action: "REFUND_PROCESSED",
          userId: user.id,
          userRole: "ADMIN",
          description: `Refund processed for booking ${booking.bookingNumber}`,
          amount: booking.actualCost || booking.estimatedCost || 0,
          metadata: { refundId: id, type: "BOOKING" },
        },
      }).catch(() => {});

      return NextResponse.json({ success: true, message: "Refund processed successfully" });
    }

    return NextResponse.json(
      { error: "Refund not found or not approved" },
      { status: 404 }
    );
  } catch (error: any) {
    console.error("Error processing refund:", error);
    return NextResponse.json(
      { error: "Failed to process refund", details: error.message },
      { status: 500 }
    );
  }
}
