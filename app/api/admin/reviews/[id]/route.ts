import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH - Update review
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const data = await request.json();

    const review = await prisma.review.update({
      where: { id: params.id },
      data: {
        name: data.name,
        role: data.role !== undefined ? data.role : null,
        content: data.content,
        rating: data.rating ? parseInt(data.rating) : undefined,
        image: data.image !== undefined ? data.image : null,
        source: data.source,
        googleReviewId: data.googleReviewId !== undefined ? data.googleReviewId : null,
        verified: data.verified,
        featured: data.featured,
        active: data.active,
        order: data.order ? parseInt(data.order) : undefined,
      },
    });

    return NextResponse.json({ review });
  } catch (error: any) {
    console.error("Error updating review:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update review" },
      { status: 500 }
    );
  }
}

// DELETE - Delete review
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await prisma.review.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting review:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete review" },
      { status: 500 }
    );
  }
}

