import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { recalculateTrustScore } from "@/lib/trust-score-engine";

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
    const { userType } = await request.json();

    if (!userType) {
      return NextResponse.json(
        { error: "userType is required" },
        { status: 400 }
      );
    }

    const newScore = await recalculateTrustScore(userId, userType);

    return NextResponse.json({
      success: true,
      newScore,
      message: "Trust score recalculated",
    });
  } catch (error: any) {
    console.error("Error recalculating trust score:", error);
    return NextResponse.json(
      { error: "Failed to recalculate trust score", details: error.message },
      { status: 500 }
    );
  }
}




