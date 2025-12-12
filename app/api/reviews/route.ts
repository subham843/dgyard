import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public API - Get all active reviews
// Cache for 1 hour (3600 seconds)
export const revalidate = 3600;

export async function GET() {
  try {
    const reviews = await prisma.review.findMany({
      where: {
        active: true,
      },
      select: {
        id: true,
        name: true,
        role: true,
        content: true,
        rating: true,
        image: true,
        source: true,
        verified: true,
        featured: true,
        createdAt: true,
      },
      orderBy: [
        { featured: "desc" },
        { order: "asc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json(
      { reviews },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

