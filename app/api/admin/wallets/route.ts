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
    const role = searchParams.get("role");
    const search = searchParams.get("search");

    // This is a placeholder - adjust based on your wallet/ledger schema
    const wallets: any[] = [];

    // Calculate stats
    const totalBalance = wallets.reduce((sum, w) => sum + (w.balance || 0), 0);
    const totalHolds = wallets.reduce((sum, w) => sum + (w.holdAmount || 0), 0);

    return NextResponse.json({
      wallets: wallets.map((w) => ({
        id: w.id,
        userId: w.userId,
        userName: w.userName || "Unknown",
        userRole: w.userRole || "CUSTOMER",
        balance: Number(w.balance || 0),
        holdAmount: Number(w.holdAmount || 0),
        availableBalance: Number(w.balance || 0) - Number(w.holdAmount || 0),
        totalCredits: Number(w.totalCredits || 0),
        totalDebits: Number(w.totalDebits || 0),
        lastTransaction: w.lastTransaction,
      })),
      stats: {
        totalWallets: wallets.length,
        totalBalance,
        totalHolds,
        totalAvailable: totalBalance - totalHolds,
      },
    });
  } catch (error: any) {
    console.error("Error fetching wallets:", error);
    return NextResponse.json(
      { error: "Failed to fetch wallets", details: error.message },
      { status: 500 }
    );
  }
}

