import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
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
    const { resolution } = body;

    if (!resolution) {
      return NextResponse.json({ error: "Resolution is required" }, { status: 400 });
    }

    // Update dispute
    await prisma.dispute?.update({
      where: { id },
      data: {
        status: "RESOLVED",
        resolutionNotes: resolution,
        resolvedAt: new Date(),
        resolvedBy: user.id,
      },
    }).catch(() => {
      throw new Error("Dispute not found");
    });

    return NextResponse.json({ success: true, message: "Dispute closed" });
  } catch (error: any) {
    console.error("Error closing dispute:", error);
    return NextResponse.json(
      { error: "Failed to close dispute", details: error.message },
      { status: 500 }
    );
  }
}

