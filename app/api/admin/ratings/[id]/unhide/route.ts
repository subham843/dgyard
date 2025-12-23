import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const updatedReview = await prisma.jobReview.update({
      where: { id },
      data: {
        isHidden: false,
        hiddenBy: null,
        hiddenAt: null,
        hiddenReason: null,
      },
    });

    return NextResponse.json({ rating: updatedReview });
  } catch (error: any) {
    console.error("Error unhiding rating:", error);
    return NextResponse.json(
      { error: "Failed to unhide rating", details: error.message },
      { status: 500 }
    );
  }
}




