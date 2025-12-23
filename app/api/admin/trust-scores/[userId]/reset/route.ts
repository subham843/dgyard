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
    const { userType } = await request.json();

    if (!userType) {
      return NextResponse.json(
        { error: "userType is required" },
        { status: 400 }
      );
    }

    // Reset requires super admin
    const isSuperAdmin = session.user.email === "subham@dgyard.com";
    
    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: "Super admin privileges required to reset trust score" },
        { status: 403 }
      );
    }

    await updateTrustScore(
      userId,
      userType,
      50.0,
      "MANUAL_RESET",
      "Trust score reset to neutral (50) by super admin",
      session.user.id
    );

    return NextResponse.json({
      success: true,
      newScore: 50.0,
      message: "Trust score reset to 50",
    });
  } catch (error: any) {
    console.error("Error resetting trust score:", error);
    return NextResponse.json(
      { error: "Failed to reset trust score", details: error.message },
      { status: 500 }
    );
  }
}




