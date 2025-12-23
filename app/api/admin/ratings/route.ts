import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recalculateTrustScore } from "@/lib/trust-score-engine";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const star = searchParams.get("star");
    const jobId = searchParams.get("jobId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    // Build where clause
    const where: any = {};

    if (role && role !== "all") {
      where.reviewerRole = role;
    }

    if (star && star !== "all") {
      where.rating = parseInt(star);
    }

    if (jobId) {
      where.jobId = jobId;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    if (status && status !== "all") {
      if (status === "hidden") {
        where.isHidden = true;
      } else if (status === "disputed") {
        where.isDisputed = true;
      } else if (status === "flagged") {
        where.isFlagged = true;
      } else if (status === "active") {
        where.isHidden = false;
        where.isDisputed = false;
      }
    }

    // Search functionality
    if (search) {
      where.OR = [
        { comment: { contains: search, mode: "insensitive" } },
        {
          job: {
            OR: [
              { jobNumber: { contains: search, mode: "insensitive" } },
              { title: { contains: search, mode: "insensitive" } },
            ],
          },
        },
        {
          reviewer: {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          },
        },
      ];
    }

    const ratings = await prisma.jobReview.findMany({
      where,
      include: {
        job: {
          select: {
            id: true,
            jobNumber: true,
            title: true,
            beforePhotos: true,
            afterPhotos: true,
            completionOtp: true,
            otpVerifiedAt: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ ratings });
  } catch (error: any) {
    console.error("Error fetching ratings:", error);
    return NextResponse.json(
      { error: "Failed to fetch ratings", details: error.message },
      { status: 500 }
    );
  }
}




