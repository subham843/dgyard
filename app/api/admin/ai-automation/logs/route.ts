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

    // Placeholder - implement actual AI logs from your schema
    const logs = [
      {
        id: "1",
        ruleId: "1",
        ruleName: "Trust Score Calculation",
        decision: "Updated trust score to 85",
        confidence: 92,
        details: { userId: "user1", oldScore: 80, newScore: 85 },
        timestamp: new Date(),
        overridden: false,
      },
    ];

    return NextResponse.json({ logs });
  } catch (error: any) {
    console.error("Error fetching AI logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch AI logs", details: error.message },
      { status: 500 }
    );
  }
}

