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
    const { reason } = await request.json();

    if (!reason) {
      return NextResponse.json(
        { error: "Reason is required" },
        { status: 400 }
      );
    }

    const updatedReview = await prisma.jobReview.update({
      where: { id },
      data: {
        isDisputed: true,
        disputedBy: session.user.id,
        disputedAt: new Date(),
        disputeReason: reason,
      },
    });

    return NextResponse.json({ rating: updatedReview });
  } catch (error: any) {
    console.error("Error marking rating as disputed:", error);
    return NextResponse.json(
      { error: "Failed to mark as disputed", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
        isDisputed: false,
        disputedBy: null,
        disputedAt: null,
        disputeReason: null,
      },
    });

    return NextResponse.json({ rating: updatedReview });
  } catch (error: any) {
    console.error("Error removing dispute:", error);
    return NextResponse.json(
      { error: "Failed to remove dispute", details: error.message },
      { status: 500 }
    );
  }
}




