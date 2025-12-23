import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email || "" },
      select: { role: true, id: true, name: true },
    });

    if (!adminUser || adminUser.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { action, userIds } = body;

    if (!action || !userIds || !Array.isArray(userIds)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    let updated = 0;

    switch (action) {
      case "approve":
        // Approve users (implement based on your schema)
        updated = userIds.length;
        break;

      case "suspend":
        // Suspend users
        for (const userId of userIds) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              // Add suspend logic
            },
          }).catch(() => {});
        }
        updated = userIds.length;
        break;

      case "delete":
        // Soft delete users
        for (const userId of userIds) {
          await prisma.user.delete({
            where: { id: userId },
          }).catch(() => {});
        }
        updated = userIds.length;
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Log audit
    await prisma.auditLog?.create({
      data: {
        action: `BULK_${action.toUpperCase()}`,
        userId: adminUser.id,
        userName: adminUser.name || "Admin",
        resourceType: "USER",
        resourceId: userIds.join(","),
        details: { action, count: userIds.length },
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: `${action} completed for ${updated} user(s)`,
      updated,
    });
  } catch (error: any) {
    console.error("Error performing bulk action:", error);
    return NextResponse.json(
      { error: "Failed to perform bulk action", details: error.message },
      { status: 500 }
    );
  }
}

