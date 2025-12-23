import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
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

    // Fetch sellers (users with role DEALER who have products)
    const dealers = await prisma.user.findMany({
      where: { role: "DEALER", status: { not: "DELETED" } },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        _count: {
          select: {
            products: true,
            orders: true,
          },
        },
      },
    });

    const sellers = await Promise.all(
      dealers.map(async (dealer) => {
        // Calculate revenue from orders
        const revenueResult = await prisma.order.aggregate({
          where: {
            // Adjust based on your order-seller relationship
            status: { in: ["COMPLETED", "DELIVERED"] },
          },
          _sum: { totalAmount: true },
        }).catch(() => ({ _sum: { totalAmount: null } }));

        return {
          id: dealer.id,
          name: dealer.name || "Unknown",
          email: dealer.email || "",
          productsCount: dealer._count.products || 0,
          ordersCount: dealer._count.orders || 0,
          totalRevenue: Number(revenueResult._sum.totalAmount || 0),
          status: dealer.status === "ACTIVE" ? "ACTIVE" : "SUSPENDED",
          settlementCycle: "T+7", // Default settlement cycle
        };
      })
    );

    const [totalSellers, activeSellers] = await Promise.all([
      Promise.resolve(sellers.length),
      Promise.resolve(sellers.filter((s) => s.status === "ACTIVE").length),
    ]);

    return NextResponse.json({
      sellers,
      stats: {
        totalSellers,
        activeSellers,
      },
    });
  } catch (error: any) {
    console.error("Error fetching sellers:", error);
    return NextResponse.json(
      { error: "Failed to fetch sellers", details: error.message },
      { status: 500 }
    );
  }
}

