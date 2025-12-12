import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public API - Get only active brands for quotation
// Cache for 1 hour (3600 seconds)
export const revalidate = 3600;

export async function GET() {
  try {
    const brands = await prisma.brand.findMany({
      where: {
        active: true,
        enableForQuotation: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        description: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(
      { brands },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );
  } catch (error) {
    console.error("Error fetching brands for quotation:", error);
    return NextResponse.json(
      { error: "Failed to fetch brands" },
      { status: 500 }
    );
  }
}

