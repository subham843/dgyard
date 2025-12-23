import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email || "" },
      select: { role: true, id: true, name: true },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = params;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    await prisma.jobPost.update({
      where: { id },
      data: { 
        status: status as any, // Cast to JobStatus enum
        ...(status === "COMPLETED" && { completedAt: new Date() }),
        ...(status === "CANCELLED" && { cancelledAt: new Date() }),
      },
    });

    // Log audit
    await prisma.auditLog?.create({
      data: {
        action: "JOB_STATUS_CHANGED",
        userId: user.id,
        userName: user.name || "Admin",
        resourceType: "SERVICE_JOB",
        resourceId: id,
        details: { status, changedBy: user.name },
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, message: "Job status updated" });
  } catch (error: any) {
    console.error("Error updating job status:", error);
    return NextResponse.json(
      { error: "Failed to update job status", details: error.message },
      { status: 500 }
    );
  }
}

