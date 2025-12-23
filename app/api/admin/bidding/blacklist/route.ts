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

    const user = await prisma.user.findUnique({
      where: { email: session.user.email || "" },
      select: { role: true },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { technicianId } = body;

    if (!technicianId) {
      return NextResponse.json({ error: "Technician ID is required" }, { status: 400 });
    }

    // Blacklist technician from bidding (implement based on your schema)
    // await prisma.technician.update({ where: { id: technicianId }, data: { blacklisted: true } });

    return NextResponse.json({ success: true, message: "Technician blacklisted" });
  } catch (error: any) {
    console.error("Error blacklisting technician:", error);
    return NextResponse.json(
      { error: "Failed to blacklist technician", details: error.message },
      { status: 500 }
    );
  }
}

