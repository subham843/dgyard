import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET - Check Google My Business connection status
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

    const settings = await prisma.settings.findFirst({
      select: {
        gmbAccessToken: true,
        gmbRefreshToken: true,
        gmbTokenExpiry: true,
        gmbLocationId: true,
        gmbAccountName: true,
      },
    });

    const isConnected = !!(
      settings?.gmbAccessToken && 
      settings?.gmbRefreshToken
    );

    const isExpired = settings?.gmbTokenExpiry
      ? new Date() > new Date(settings.gmbTokenExpiry)
      : false;

    return NextResponse.json({
      connected: isConnected && !isExpired,
      locationId: settings?.gmbLocationId || null,
      accountName: settings?.gmbAccountName || null,
      tokenExpiry: settings?.gmbTokenExpiry || null,
    });
  } catch (error: any) {
    console.error("Error checking GMB status:", error);
    return NextResponse.json(
      { error: error.message || "Failed to check status" },
      { status: 500 }
    );
  }
}

