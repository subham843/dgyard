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
      select: { role: true },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = params;
    const body = await request.json();
    const { reason } = body;

    // Hold settlement (implement based on your schema)
    return NextResponse.json({ success: true, message: "Settlement held" });
  } catch (error: any) {
    console.error("Error holding settlement:", error);
    return NextResponse.json(
      { error: "Failed to hold settlement", details: error.message },
      { status: 500 }
    );
  }
}

