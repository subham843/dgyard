import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public API - Get installation rates for quotation
export const revalidate = 3600;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const cableLength = searchParams.get("cableLength");

    const where: any = {
      active: true,
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (cableLength) {
      const length = parseFloat(cableLength);
      where.maxCableLength = {
        gte: length,
      };
    }

    const installations = await prisma.quotationInstallation.findMany({
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
        maxCableLength: "asc",
      },
    });

    return NextResponse.json(
      { installations },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );
  } catch (error) {
    console.error("Error fetching installation rates:", error);
    return NextResponse.json(
      { error: "Failed to fetch installation rates" },
      { status: 500 }
    );
  }
}

