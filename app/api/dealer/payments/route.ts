import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "DEALER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const payments = await prisma.jobPayment.findMany({
      where: {
        dealerId: session.user.id,
      },
      include: {
        job: {
          select: {
            id: true,
            jobNumber: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const summary = {
      totalEarnings: payments
        .filter((p) => p.status === "RELEASED" && p.paymentType === "SERVICE_PAYMENT")
        .reduce((sum, p) => sum + (p.netAmount || p.amount), 0),
      pendingPayments: payments
        .filter((p) => p.status === "PENDING")
        .reduce((sum, p) => sum + p.amount, 0),
      releasedPayments: payments
        .filter((p) => p.status === "RELEASED")
        .reduce((sum, p) => sum + (p.netAmount || p.amount), 0),
      warrantyHolds: payments
        .filter((p) => p.isWarrantyHold && p.status === "ESCROW_HOLD")
        .reduce((sum, p) => sum + p.amount, 0),
    };

    return NextResponse.json({ payments, summary });
  } catch (error: any) {
    console.error("Error fetching dealer payments:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch payments" },
      { status: 500 }
    );
  }
}






