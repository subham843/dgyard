import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/reviews/moderation
 * Get reviews for moderation (flagged, hidden, all)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email || "" },
      select: { role: true },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const filter = searchParams.get("filter") || "all"; // all, flagged, hidden, pending
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (filter === "flagged") {
      where.isFlagged = true;
      where.isHidden = false;
    } else if (filter === "hidden") {
      where.isHidden = true;
    } else if (filter === "pending") {
      where.isLocked = false;
      where.isHidden = false;
      where.isFlagged = false;
    }

    const [reviews, total] = await Promise.all([
      prisma.jobReview.findMany({
        where,
        include: {
          job: {
            select: {
              id: true,
              jobNumber: true,
              title: true,
            },
          },
          reviewer: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: [
          { isFlagged: "desc" },
          { createdAt: "desc" },
        ],
        skip,
        take: limit,
      }),
      prisma.jobReview.count({ where }),
    ]);

    return NextResponse.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Error fetching reviews for moderation:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/reviews/moderation
 * Update review moderation status
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email || "" },
      select: { id: true, role: true },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { reviewId, action, reason } = body; // action: hide, unhide, flag, unflag

    if (!reviewId || !action) {
      return NextResponse.json(
        { error: "Review ID and action are required" },
        { status: 400 }
      );
    }

    const updateData: any = {};

    if (action === "hide") {
      updateData.isHidden = true;
      updateData.hiddenBy = user.id;
      updateData.hiddenAt = new Date();
      updateData.hiddenReason = reason || null;
    } else if (action === "unhide") {
      updateData.isHidden = false;
      updateData.hiddenBy = null;
      updateData.hiddenAt = null;
      updateData.hiddenReason = null;
    } else if (action === "flag") {
      updateData.isFlagged = true;
    } else if (action === "unflag") {
      updateData.isFlagged = false;
    }

    const review = await prisma.jobReview.update({
      where: { id: reviewId },
      data: updateData,
      include: {
        job: {
          select: {
            jobNumber: true,
            title: true,
          },
        },
        reviewer: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Review ${action === "hide" ? "hidden" : action === "unhide" ? "unhidden" : action === "flag" ? "flagged" : "unflagged"} successfully`,
      review,
    });
  } catch (error: any) {
    console.error("Error updating review moderation:", error);
    return NextResponse.json(
      { error: "Failed to update review", details: error.message },
      { status: 500 }
    );
  }
}

