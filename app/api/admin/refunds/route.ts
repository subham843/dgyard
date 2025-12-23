import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email || "" },
      select: { role: true },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const type = searchParams.get("type");

    // Fetch refunds from Orders and Bookings
    const whereOrder: any = {
      refundStatus: { not: "NONE" },
    };
    const whereBooking: any = {
      refundStatus: { not: "NONE" },
    };

    if (status && status !== "all") {
      whereOrder.refundStatus = status;
      whereBooking.refundStatus = status;
    }

    const [orderRefunds, bookingRefunds] = await Promise.all([
      prisma.order.findMany({
        where: whereOrder,
        take: 50,
        orderBy: { refundRequestedAt: "desc" },
        include: {
          user: { select: { name: true, email: true } },
          items: {
            include: {
              product: { select: { name: true } },
            },
          },
        },
      }),
      prisma.booking.findMany({
        where: whereBooking,
        take: 50,
        orderBy: { refundRequestedAt: "desc" },
        include: {
          user: { select: { name: true, email: true } },
        },
      }),
    ]);

    // Combine and format refunds
    const refunds = [
      ...orderRefunds.map((order) => ({
        id: order.id,
        refundNumber: order.orderNumber,
        type: "ORDER" as const,
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerName: order.user?.name || "Unknown",
        customerEmail: order.user?.email || "",
        sellerName: "Platform", // Orders are direct purchases
        productName: order.items?.[0]?.product?.name || "Product",
        amount: order.total,
        reason: order.refundReason || "N/A",
        status: order.refundStatus || "REQUESTED",
        requestDate: order.refundRequestedAt || order.createdAt,
        processedDate: order.refundApprovedAt,
        paymentMethod: order.paymentMethod || "UNKNOWN",
        items: order.items.map((item) => ({
          productName: item.product.name,
          quantity: item.quantity,
          price: item.price,
        })),
      })),
      ...bookingRefunds.map((booking) => ({
        id: booking.id,
        refundNumber: booking.bookingNumber,
        type: "BOOKING" as const,
        orderId: booking.id,
        orderNumber: booking.bookingNumber,
        customerName: booking.user?.name || "Unknown",
        customerEmail: booking.user?.email || "",
        sellerName: "Platform",
        productName: booking.serviceType || "Service",
        amount: booking.actualCost || booking.estimatedCost || 0,
        reason: booking.refundReason || "N/A",
        status: booking.refundStatus || "REQUESTED",
        requestDate: booking.refundRequestedAt || booking.createdAt,
        processedDate: booking.refundApprovedAt,
        paymentMethod: booking.paymentMethod || "UNKNOWN",
        items: [],
      })),
    ].sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime()).slice(0, 100);

    // Get stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [orderStats, bookingStats] = await Promise.all([
      prisma.order.groupBy({
        by: ["refundStatus"],
        where: {
          refundStatus: { not: "NONE" },
          refundRequestedAt: { gte: today },
        },
        _count: true,
        _sum: { total: true },
      }),
      prisma.booking.groupBy({
        by: ["refundStatus"],
        where: {
          refundStatus: { not: "NONE" },
          refundRequestedAt: { gte: today },
        },
        _count: true,
      }),
    ]);

    const pending = refunds.filter((r) => r.status === "REQUESTED").length;
    const approved = refunds.filter((r) => r.status === "APPROVED").length;
    const rejected = refunds.filter((r) => r.status === "REJECTED").length;
    const totalAmount = refunds
      .filter((r) => r.status === "REQUESTED" || r.status === "APPROVED")
      .reduce((sum, r) => sum + r.amount, 0);
    const todayRequests = orderStats.reduce((sum, s) => sum + (s._count || 0), 0) +
      bookingStats.reduce((sum, s) => sum + (s._count || 0), 0);

    return NextResponse.json({
      refunds,
      stats: {
        pending,
        approved,
        rejected,
        totalAmount,
        todayRequests,
      },
    });
  } catch (error: any) {
    console.error("Error fetching refunds:", error);
    return NextResponse.json(
      { error: "Failed to fetch refunds", details: error.message },
      { status: 500 }
    );
  }
}
