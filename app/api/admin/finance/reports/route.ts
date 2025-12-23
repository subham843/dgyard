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
    const period = searchParams.get("period") || "month";
    const startDate = searchParams.get("start");
    const endDate = searchParams.get("end");

    // Calculate date range
    let start: Date;
    let end = new Date();
    end.setHours(23, 59, 59, 999);

    switch (period) {
      case "today":
        start = new Date();
        start.setHours(0, 0, 0, 0);
        break;
      case "week":
        start = new Date();
        start.setDate(start.getDate() - 7);
        break;
      case "month":
        start = new Date();
        start.setMonth(start.getMonth() - 1);
        break;
      case "year":
        start = new Date();
        start.setFullYear(start.getFullYear() - 1);
        break;
      case "custom":
        start = startDate ? new Date(startDate) : new Date();
        end = endDate ? new Date(endDate) : new Date();
        break;
      default:
        start = new Date();
        start.setMonth(start.getMonth() - 1);
    }

    // Fetch service revenue
    const serviceRevenue = await prisma.serviceJob.aggregate({
      where: {
        status: "COMPLETED",
        completedAt: { gte: start, lte: end },
      },
      _sum: { finalAmount: true },
    }).then(r => Number(r._sum.finalAmount || 0)).catch(() => 0);

    // Fetch product revenue
    const productRevenue = await prisma.order.aggregate({
      where: {
        status: { in: ["COMPLETED", "DELIVERED"] },
        createdAt: { gte: start, lte: end },
      },
      _sum: { totalAmount: true },
    }).then(r => Number(r._sum.totalAmount || 0)).catch(() => 0);

    const totalRevenue = serviceRevenue + productRevenue;
    const commission = totalRevenue * 0.15; // 15% commission (adjust as needed)
    const gst = totalRevenue * 0.18; // 18% GST (adjust as needed)

    // Fetch payouts
    const payouts = await prisma.payout?.aggregate({
      where: {
        status: "COMPLETED",
        createdAt: { gte: start, lte: end },
      },
      _sum: { amount: true },
    }).then(r => Number(r._sum.amount || 0)).catch(() => 0);

    const periodLabel = period === "custom"
      ? `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`
      : `This ${period.charAt(0).toUpperCase() + period.slice(1)}`;

    return NextResponse.json({
      serviceRevenue,
      productRevenue,
      totalRevenue,
      commission,
      gst,
      payouts,
      period: periodLabel,
    });
  } catch (error: any) {
    console.error("Error generating report:", error);
    return NextResponse.json(
      { error: "Failed to generate report", details: error.message },
      { status: 500 }
    );
  }
}

