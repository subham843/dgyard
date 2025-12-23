import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Delete all sessions except current one
    await prisma.session.deleteMany({
      where: {
        userId: session.user.id,
        sessionToken: {
          not: session.sessionToken || "",
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Logged out from all devices",
    });
  } catch (error) {
    console.error("Error logging out from all devices:", error);
    return NextResponse.json(
      { error: "Failed to logout from all devices" },
      { status: 500 }
    );
  }
}





