import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public API - Get wiring configurations for quotation
export const revalidate = 3600;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");

    const where: any = {
      active: true,
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const wirings = await prisma.quotationWiring.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        cableName: "asc",
      },
    });

    return NextResponse.json(
      { wirings },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );
  } catch (error) {
    console.error("Error fetching wiring configurations:", error);
    return NextResponse.json(
      { error: "Failed to fetch wiring configurations" },
      { status: 500 }
    );
  }
}

