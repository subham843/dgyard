import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Get AI-powered analytics and insights
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "ADMIN" && user?.role !== "MODERATOR") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Get date ranges
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Sales Statistics
    const totalOrders = await prisma.order.count();
    const ordersLast30Days = await prisma.order.count({
      where: { createdAt: { gte: last30Days } },
    });
    const ordersLast7Days = await prisma.order.count({
      where: { createdAt: { gte: last7Days } },
    });

    const totalRevenue = await prisma.order.aggregate({
      _sum: { total: true },
    });

    const revenueLast30Days = await prisma.order.aggregate({
      where: { createdAt: { gte: last30Days } },
      _sum: { total: true },
    });

    const revenueLast7Days = await prisma.order.aggregate({
      where: { createdAt: { gte: last7Days } },
      _sum: { total: true },
    });

    // Popular Products
    const popularProducts = await prisma.orderItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true },
      _count: { id: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 10,
    });

    const productDetails = await Promise.all(
      popularProducts.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: {
            id: true,
            name: true,
            price: true,
            brand: { select: { name: true } },
          },
        });
        return {
          ...product,
          totalQuantity: item._sum.quantity || 0,
          orderCount: item._count.id || 0,
        };
      })
    );

    // Popular Brands
    const brandStats = await prisma.orderItem.findMany({
      include: {
        product: {
          include: { brand: true },
        },
      },
      where: {
        order: {
          createdAt: { gte: last30Days },
        },
      },
    });

    const brandCounts: { [key: string]: { count: number; revenue: number } } = {};
    brandStats.forEach((item) => {
      const brandName = item.product.brand?.name || "Unknown";
      if (!brandCounts[brandName]) {
        brandCounts[brandName] = { count: 0, revenue: 0 };
      }
      brandCounts[brandName].count += item.quantity;
      brandCounts[brandName].revenue += item.product.price * item.quantity;
    });

    const popularBrands = Object.entries(brandCounts)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Order Status Distribution
    const orderStatuses = await prisma.order.groupBy({
      by: ["status"],
      _count: { id: true },
    });

    // Peak Hours Analysis
    const ordersWithHours = await prisma.order.findMany({
      where: { createdAt: { gte: last30Days } },
      select: { createdAt: true },
    });

    const hourCounts: { [key: number]: number } = {};
    ordersWithHours.forEach((order) => {
      const hour = order.createdAt.getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const peakHours = Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // AI Insights & Recommendations
    const insights = [];
    
    // Revenue trend
    const revenueTrend = (revenueLast7Days._sum.total || 0) / 7 > (revenueLast30Days._sum.total || 0) / 30
      ? "increasing"
      : "decreasing";
    
    if (revenueTrend === "increasing") {
      insights.push({
        type: "success",
        title: "Revenue Growth",
        message: "Your revenue is trending upward! Last 7 days show strong performance.",
      });
    } else {
      insights.push({
        type: "warning",
        title: "Revenue Decline",
        message: "Revenue has decreased. Consider promotional campaigns or new product launches.",
      });
    }

    // Product recommendations
    if (productDetails.length > 0) {
      const topProduct = productDetails[0];
      insights.push({
        type: "info",
        title: "Top Seller",
        message: `${topProduct?.name} is your best-selling product. Consider increasing stock or creating bundle deals.`,
      });
    }

    // Peak hours recommendation
    if (peakHours.length > 0) {
      const bestHour = peakHours[0];
      insights.push({
        type: "info",
        title: "Peak Sales Time",
        message: `Most orders come between ${bestHour.hour}:00 - ${bestHour.hour + 1}:00. Schedule marketing campaigns during this time.`,
      });
    }

    // Low stock alert (if applicable)
    const lowStockProducts = await prisma.product.findMany({
      where: {
        stock: { lte: 10 },
        active: true,
      },
      take: 5,
      select: { name: true, stock: true },
    });

    if (lowStockProducts.length > 0) {
      insights.push({
        type: "warning",
        title: "Low Stock Alert",
        message: `${lowStockProducts.length} products are running low on stock. Consider restocking soon.`,
        products: lowStockProducts,
      });
    }

    return NextResponse.json({
      summary: {
        totalOrders,
        ordersLast30Days,
        ordersLast7Days,
        totalRevenue: totalRevenue._sum.total || 0,
        revenueLast30Days: revenueLast30Days._sum.total || 0,
        revenueLast7Days: revenueLast7Days._sum.total || 0,
        averageOrderValue: ordersLast30Days > 0 
          ? (revenueLast30Days._sum.total || 0) / ordersLast30Days 
          : 0,
      },
      popularProducts: productDetails,
      popularBrands,
      orderStatuses: orderStatuses.map(s => ({
        status: s.status,
        count: s._count.id,
      })),
      peakHours,
      insights,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
