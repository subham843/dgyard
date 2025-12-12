import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Debug endpoint to check session and user role
 * Remove this in production
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({
        authenticated: false,
        message: "No session found. Please login first.",
        loginUrl: "/auth/signin",
      });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user?.email || "" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return NextResponse.json({
      authenticated: true,
      session: {
        user: {
          id: session.user?.id,
          email: session.user?.email,
          name: session.user?.name,
          role: session.user?.role,
        },
      },
      database: {
        user: user,
        roleMatch: user?.role === session.user?.role,
      },
      access: {
        isAdmin: user?.role === "ADMIN",
        canAccessAdmin: user?.role === "ADMIN",
      },
      debug: {
        sessionRole: session.user?.role,
        dbRole: user?.role,
        tokenRole: session.user?.role,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Failed to check session",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

