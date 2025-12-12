import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const [
      totalProducts,
      totalOrders,
      totalUsers,
      totalBookings,
      orders,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.user.count(),
      prisma.booking.count(),
      prisma.order.findMany({
        where: { paymentStatus: "PAID" },
        select: { total: true },
      }),
    ]);

    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total), 0);
    const pendingOrders = await prisma.order.count({
      where: { status: "PENDING" },
    });

    return NextResponse.json({
      totalProducts,
      totalOrders,
      totalUsers,
      totalBookings,
      totalRevenue,
      pendingOrders,
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}




















