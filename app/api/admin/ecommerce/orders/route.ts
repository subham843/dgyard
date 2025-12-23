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

    const where: any = {};
    if (status && status !== "all") {
      where.status = status;
    }

    const orders = await prisma.order.findMany({
      where,
      take: 100,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    });

    // Get stats
    const [total, pending, processing, shipped, delivered, codRisk] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.order.count({ where: { status: "PROCESSING" } }),
      prisma.order.count({ where: { status: "SHIPPED" } }),
      prisma.order.count({ where: { status: "DELIVERED" } }),
      prisma.order.count({
        where: {
          paymentMethod: "COD",
          status: { in: ["PENDING", "PROCESSING"] },
        },
      }),
    ]);

    return NextResponse.json({
      orders: orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber || o.id,
        customerName: o.user?.name || "Unknown",
        customerEmail: o.user?.email || "",
        sellerName: "Seller", // Get from order items
        totalAmount: Number(o.totalAmount || 0),
        status: o.status || "PENDING",
        paymentMethod: o.paymentMethod || "UNKNOWN",
        paymentStatus: o.paymentStatus || "PENDING",
        shippingAddress: o.shippingAddress || "N/A",
        items: 0, // Count from order items
        createdAt: o.createdAt,
        isCODRisk: o.paymentMethod === "COD" && ["PENDING", "PROCESSING"].includes(o.status || ""),
      })),
      stats: {
        total,
        pending,
        processing,
        shipped,
        delivered,
        codRisk,
      },
    });
  } catch (error: any) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders", details: error.message },
      { status: 500 }
    );
  }
}
