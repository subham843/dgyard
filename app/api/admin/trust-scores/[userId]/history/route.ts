import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { userId } = await params;

    const history = await prisma.trustScoreHistory.findMany({
      where: { userId },
      orderBy: {
        createdAt: "desc",
      },
      take: 100, // Limit to last 100 entries
    });

    return NextResponse.json({ history });
  } catch (error: any) {
    console.error("Error fetching trust score history:", error);
    return NextResponse.json(
      { error: "Failed to fetch history", details: error.message },
      { status: 500 }
    );
  }
}




