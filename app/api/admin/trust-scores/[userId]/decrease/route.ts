import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { updateTrustScore } from "@/lib/trust-score-engine";

export async function POST(
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
    const { amount, reason, userType } = await request.json();

    if (!amount || !reason || !userType) {
      return NextResponse.json(
        { error: "Amount, reason, and userType are required" },
        { status: 400 }
      );
    }

    // Check admin permission
    const isSuperAdmin = session.user.email === "subham@dgyard.com";
    
    if (amount > 5 && !isSuperAdmin) {
      return NextResponse.json(
        { error: "Normal admins can only adjust by ±5 points. Super admin required for larger adjustments." },
        { status: 403 }
      );
    }

    // Get current trust score
    const { prisma } = await import("@/lib/prisma");
    let currentScore = 50.0;
    
    if (userType === "TECHNICIAN") {
      const technician = await prisma.technician.findUnique({
        where: { userId },
        select: { trustScore: true },
      });
      currentScore = technician?.trustScore || 50.0;
    } else if (userType === "DEALER") {
      const dealer = await prisma.dealer.findUnique({
        where: { userId },
        select: { trustScore: true },
      });
      currentScore = dealer?.trustScore || 50.0;
    }

    const newScore = Math.max(0, currentScore - parseFloat(amount));

    await updateTrustScore(
      userId,
      userType,
      newScore,
      "MANUAL_DECREASE",
      reason,
      session.user.id
    );

    return NextResponse.json({
      success: true,
      oldScore: currentScore,
      newScore,
      changeAmount: -parseFloat(amount),
    });
  } catch (error: any) {
    console.error("Error decreasing trust score:", error);
    return NextResponse.json(
      { error: "Failed to decrease trust score", details: error.message },
      { status: 500 }
    );
  }
}




