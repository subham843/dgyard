import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGMBAuthUrl } from "@/lib/gmb-auth";

/**
 * GET - Get Google My Business OAuth authorization URL
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const authUrl = getGMBAuthUrl();

    return NextResponse.json({ authUrl });
  } catch (error: any) {
    console.error("Error generating GMB auth URL:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate authorization URL" },
      { status: 500 }
    );
  }
}

