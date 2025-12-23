import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LedgerAccountType, LedgerEntryCategory } from "@prisma/client";

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
    const period = searchParams.get("period") || "today"; // today, month, all
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Calculate date range
    let dateFilter: any = {};
    if (period === "today") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dateFilter = { gte: today };
    } else if (period === "month") {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      dateFilter = { gte: monthStart };
    } else if (startDate && endDate) {
      dateFilter = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // Get platform commission ledger entries
    const platformEntries = await prisma.ledgerEntry.findMany({
      where: {
        accountType: LedgerAccountType.PLATFORM_COMMISSION,
        category: LedgerEntryCategory.COMMISSION,
        type: "CREDIT",
        createdAt: dateFilter,
      },
      include: {
        job: {
          select: {
            id: true,
            jobNumber: true,
            serviceType: true,
          },
        },
      },
    });

    // Calculate totals
    const totalPlatformRevenue = platformEntries.reduce(
      (sum, entry) => sum + entry.amount,
      0
    );

    // Service vs Product breakdown
    const serviceCommission = platformEntries
      .filter((entry) => entry.jobId)
      .reduce((sum, entry) => sum + entry.amount, 0);

    const productCommission = platformEntries
      .filter((entry) => !entry.jobId)
      .reduce((sum, entry) => sum + entry.amount, 0);

    // Dealer-wise earnings
    const dealerEarnings = await prisma.ledgerEntry.groupBy({
      by: ["userId"],
      where: {
        accountType: LedgerAccountType.PLATFORM_COMMISSION,
        category: LedgerEntryCategory.COMMISSION,
        type: "CREDIT",
        createdAt: dateFilter,
        userId: { not: null },
      },
      _sum: {
        amount: true,
      },
    });

    const dealerDetails = await Promise.all(
      dealerEarnings.map(async (dealer) => {
        if (!dealer.userId) return null;
        const user = await prisma.user.findUnique({
          where: { id: dealer.userId },
          select: {
            id: true,
            name: true,
            email: true,
            dealer: {
              select: {
                accountStatus: true,
              },
            },
          },
        });
        return {
          dealerId: dealer.userId,
          dealerName: user?.name || "Unknown",
          dealerEmail: user?.email || "",
          earnings: dealer._sum.amount || 0,
        };
      })
    );

    // Platform ledger balance (total accumulated)
    const allPlatformEntries = await prisma.ledgerEntry.findMany({
      where: {
        accountType: LedgerAccountType.PLATFORM_COMMISSION,
        category: LedgerEntryCategory.COMMISSION,
        type: "CREDIT",
      },
    });

    const platformLedgerBalance = allPlatformEntries.reduce(
      (sum, entry) => sum + entry.amount,
      0
    );

    // Recent transactions
    const recentTransactions = platformEntries
      .slice(0, 10)
      .map((entry) => ({
        id: entry.id,
        amount: entry.amount,
        description: entry.description,
        createdAt: entry.createdAt,
        jobNumber: entry.job?.jobNumber,
        serviceType: entry.job?.serviceType,
      }));

    return NextResponse.json({
      totalPlatformRevenue,
      serviceCommission,
      productCommission,
      platformLedgerBalance,
      dealerEarnings: dealerDetails.filter((d) => d !== null),
      recentTransactions,
      period,
      dateRange: dateFilter,
    });
  } catch (error: any) {
    console.error("Error fetching platform revenue:", error);
    return NextResponse.json(
      { error: "Failed to fetch platform revenue", details: error.message },
      { status: 500 }
    );
  }
}

