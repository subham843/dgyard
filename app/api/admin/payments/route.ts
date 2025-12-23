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

    // Fetch job payments
    const payments = await prisma.jobPayment.findMany({
      take: 100,
      orderBy: { createdAt: "desc" },
      include: {
        job: {
          select: {
            jobNumber: true,
            customerName: true,
          },
        },
        dealer: {
          select: {
            name: true,
          },
        },
      },
    });

    // Get stats
    const [pendingPayments, releasedPayments] = await Promise.all([
      prisma.jobPayment.count({ where: { status: "PENDING" } }),
      prisma.jobPayment.count({ where: { status: "RELEASED" } }),
    ]);

    const completedPayments = releasedPayments;
    const failedPayments = 0; // Adjust based on your failure tracking

    return NextResponse.json({
      payments: payments.map((p) => ({
        id: p.id,
        type: "JOB",
        amount: Number(p.immediateAmount || p.amount || 0),
        status: p.status,
        method: p.paymentMethod || "ONLINE",
        userId: p.dealerId,
        userName: p.dealer?.name || "Unknown",
        description: `Payment for job ${p.job?.jobNumber || p.jobId}`,
        createdAt: p.createdAt,
      })),
      stats: {
        pendingPayments,
        completedPayments,
        failedPayments,
        totalHolds: 0,
        totalCredits: 0,
        totalDebits: 0,
      },
    });
  } catch (error: any) {
    console.error("Error fetching payments:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments", details: error.message },
      { status: 500 }
    );
  }
}

