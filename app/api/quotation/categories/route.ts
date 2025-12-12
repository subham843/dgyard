import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public API - Get only active categories for quotation
// Cache for 1 hour (3600 seconds)
export const revalidate = 3600;

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: {
        active: true,
        enableForQuotation: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        icon: true,
        subCategories: {
          where: {
            active: true,
          },
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            icon: true,
          },
          orderBy: {
            name: "asc",
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(
      { categories },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );
  } catch (error) {
    console.error("Error fetching categories for quotation:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

