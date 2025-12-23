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

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalQuotations, todayQuotations, quotationsWithTotal] = await Promise.all([
      prisma.quotation.count().catch(() => 0),
      prisma.quotation.count({
        where: { createdAt: { gte: today } },
      }).catch(() => 0),
      prisma.quotation.findMany({
        select: { totalPrice: true },
      }).catch(() => []),
    ]);

    const avgQuotationValue = quotationsWithTotal.length > 0
      ? quotationsWithTotal.reduce((sum, q) => sum + Number(q.totalPrice || 0), 0) / quotationsWithTotal.length
      : 0;

    // Calculate conversion rate (quotations that led to orders)
    const convertedQuotations = await prisma.quotation.count({
      where: {
        orderId: { not: null },
      },
    }).catch(() => 0);

    const conversionRate = totalQuotations > 0
      ? (convertedQuotations / totalQuotations) * 100
      : 0;

    return NextResponse.json({
      totalCalculations: totalQuotations,
      todayCalculations: todayQuotations,
      avgQuotationValue: Math.round(avgQuotationValue),
      conversionRate,
    });
  } catch (error: any) {
    console.error("Error fetching calculator stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats", details: error.message },
      { status: 500 }
    );
  }
}

