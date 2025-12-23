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

    const warranties = await prisma.warranty.findMany({
      where: {
        job: {
          dealerId: session.user.id,
        },
      },
      include: {
        job: {
          select: {
            id: true,
            jobNumber: true,
            title: true,
          },
        },
        reworkTechnician: {
          select: {
            id: true,
            fullName: true,
            mobile: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ warranties });
  } catch (error: any) {
    console.error("Error fetching warranties:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch warranties" },
      { status: 500 }
    );
  }
}






