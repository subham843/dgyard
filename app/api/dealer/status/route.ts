import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const dealer = await prisma.dealer.findUnique({
      where: { userId: session.user.id },
      include: {
        user: {
          select: {
            email: true,
            phone: true,
            emailVerified: true,
            phoneVerified: true,
          },
        },
      },
    });

    if (!dealer) {
      return NextResponse.json({ dealer: null });
    }

    return NextResponse.json({ dealer });
  } catch (error: any) {
    console.error("Error fetching dealer status:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch dealer status" },
      { status: 500 }
    );
  }
}











