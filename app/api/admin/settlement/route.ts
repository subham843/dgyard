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

    // Placeholder - adjust based on your settlement schema
    const settlements: any[] = [];

    const pending = settlements.filter((s) => s.status === "PENDING").length;
    const totalPending = settlements
      .filter((s) => s.status === "PENDING")
      .reduce((sum, s) => sum + Number(s.settlementAmount || 0), 0);

    return NextResponse.json({
      settlements: settlements.map((s) => ({
        id: s.id,
        sellerId: s.sellerId,
        sellerName: s.sellerName || "Unknown",
        period: s.period || "N/A",
        totalSales: Number(s.totalSales || 0),
        commission: Number(s.commission || 0),
        deductions: Number(s.deductions || 0),
        settlementAmount: Number(s.settlementAmount || 0),
        status: s.status,
        settlementDate: s.settlementDate || new Date(),
        paidDate: s.paidDate,
        cycle: s.cycle || "T+7",
      })),
      stats: {
        pending,
        totalPending,
        thisMonth: settlements.length,
        totalPaid: 0,
      },
    });
  } catch (error: any) {
    console.error("Error fetching settlements:", error);
    return NextResponse.json(
      { error: "Failed to fetch settlements", details: error.message },
      { status: 500 }
    );
  }
}

