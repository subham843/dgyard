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

    // Fetch ledger entries
    const entries = await prisma.ledgerEntry.findMany({
      take: 100,
      orderBy: { createdAt: "desc" },
      include: {
        account: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        job: {
          select: {
            jobNumber: true,
          },
        },
      },
    });

    return NextResponse.json({
      entries: entries.map((e) => ({
        id: e.id,
        userId: e.account.userId || "",
        userName: e.account.user?.name || e.account.accountName || "System",
        type: e.entryType,
        amount: Number(e.amount || 0),
        status: "COMPLETED", // Ledger entries are always completed once created
        reason: e.description || "N/A",
        createdAt: e.createdAt,
      })),
    });
  } catch (error: any) {
    console.error("Error fetching ledger:", error);
    return NextResponse.json(
      { error: "Failed to fetch ledger", details: error.message },
      { status: 500 }
    );
  }
}

