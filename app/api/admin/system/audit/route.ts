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
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 50;
    const skip = (page - 1) * limit;

    // Fetch audit logs
    const logs = await prisma.auditLog.findMany({
      take: limit,
      skip,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      logs: logs.map((log) => ({
        id: log.id,
        action: log.action,
        description: log.description,
        userId: log.userId || "",
        userName: log.user?.name || "System",
        userRole: log.userRole,
        jobId: log.jobId || undefined,
        amount: log.amount ? Number(log.amount) : undefined,
        previousValue: log.previousValue,
        newValue: log.newValue,
        createdAt: log.createdAt,
      })),
      page,
      hasMore: logs.length === limit,
    });
  } catch (error: any) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit logs", details: error.message },
      { status: 500 }
    );
  }
}

