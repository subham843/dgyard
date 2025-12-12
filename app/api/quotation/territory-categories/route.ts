import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public API - Get only active territory categories for quotation
// Cache for 1 hour (3600 seconds)
export const revalidate = 3600;

export async function GET() {
  try {
    const territoryCategories = await prisma.territoryCategory.findMany({
      where: {
        active: true,
        enableForQuotation: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(
      { territoryCategories },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );
  } catch (error) {
    console.error("Error fetching territory categories for quotation:", error);
    return NextResponse.json(
      { error: "Failed to fetch territory categories" },
      { status: 500 }
    );
  }
}

