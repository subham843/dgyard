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

    // Get last 30 days of revenue data
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    // Get service revenue (from JobPost)
    const serviceJobs = await prisma.jobPost.findMany({
      where: {
        status: "COMPLETED",
        completedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        completedAt: true,
        finalPrice: true,
      },
    });

    // Get product revenue (from Orders)
    const orders = await prisma.order.findMany({
      where: {
        status: { in: ["DELIVERED", "CONFIRMED"] },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        createdAt: true,
        total: true,
      },
    });

    // Group by date
    const revenueByDate: Record<string, number> = {};

    serviceJobs.forEach((job) => {
      if (job.completedAt) {
        const date = new Date(job.completedAt).toISOString().split("T")[0];
        revenueByDate[date] = (revenueByDate[date] || 0) + Number(job.finalPrice || 0);
      }
    });

    orders.forEach((order) => {
      const date = new Date(order.createdAt).toISOString().split("T")[0];
      revenueByDate[date] = (revenueByDate[date] || 0) + Number(order.total || 0);
    });

    // Convert to array format
    const data = Object.entries(revenueByDate)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error("Error fetching revenue chart data:", error);
    return NextResponse.json(
      { error: "Failed to fetch chart data", details: error.message },
      { status: 500 }
    );
  }
}

