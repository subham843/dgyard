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

    // Check for new items in last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const [newJobs, newOrders, newUsers, pendingApprovals] = await Promise.all([
      prisma.jobPost.count({
        where: { createdAt: { gte: fiveMinutesAgo } },
      }),
      prisma.order.count({
        where: { createdAt: { gte: fiveMinutesAgo } },
      }),
      prisma.user.count({
        where: { createdAt: { gte: fiveMinutesAgo } },
      }),
      prisma.user.count({
        where: {
          OR: [
            { role: "DEALER", dealer: { accountStatus: "PENDING_APPROVAL" } },
            { role: "TECHNICIAN", technicianProfile: { accountStatus: "PENDING_APPROVAL" } },
          ],
        },
      }),
    ]);

    const hasUpdates = newJobs > 0 || newOrders > 0 || newUsers > 0 || pendingApprovals > 0;

    return NextResponse.json({
      hasUpdates,
      counts: {
        newJobs,
        newOrders,
        newUsers,
        pendingApprovals,
      },
    });
  } catch (error: any) {
    console.error("Error checking updates:", error);
    return NextResponse.json({ hasUpdates: false });
  }
}

