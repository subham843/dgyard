import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // "SERVICE" or "PRODUCT"
    const status = searchParams.get("status");

    // Get payments from orders and bookings
    const where: any = { userId: session.user.id };
    if (status) where.paymentStatus = status;

    const orders = await prisma.order.findMany({
      where: {
        userId: session.user.id,
        ...(status && { paymentStatus: status }),
      },
      select: {
        id: true,
        orderNumber: true,
        total: true,
        paymentStatus: true,
        createdAt: true,
        items: {
          select: {
            product: {
              select: {
                name: true,
              },
            },
            quantity: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const bookings = await prisma.booking.findMany({
      where: {
        userId: session.user.id,
        ...(status && { paymentStatus: status }),
      },
      select: {
        id: true,
        bookingNumber: true,
        serviceType: true,
        paymentStatus: true,
        totalAmount: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Transform to unified payment format
    const payments = [
      ...orders.map((order) => ({
        id: order.id,
        type: "PRODUCT",
        amount: order.total,
        status: order.paymentStatus,
        reference: order.orderNumber,
        description: `Order: ${order.items.map((i) => i.product.name).join(", ")}`,
        createdAt: order.createdAt,
      })),
      ...bookings
        .filter((b) => b.totalAmount && b.totalAmount > 0)
        .map((booking) => ({
          id: booking.id,
          type: "SERVICE",
          amount: booking.totalAmount || 0,
          status: booking.paymentStatus || "PENDING",
          reference: booking.bookingNumber,
          description: `Service: ${booking.serviceType}`,
          createdAt: booking.createdAt,
        })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Filter by type if provided
    const filteredPayments = type
      ? payments.filter((p) => p.type === type)
      : payments;

    return NextResponse.json({ payments: filteredPayments });
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}





