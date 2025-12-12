import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const active = searchParams.get("active");
    const featured = searchParams.get("featured");

    const where: any = {};
    
    if (category) {
      where.category = category;
    }
    
    if (active !== null) {
      where.active = active === "true";
    }

    if (featured !== null) {
      where.featured = featured === "true";
    }

    const offers = await prisma.offer.findMany({
      where,
      orderBy: [
        { featured: "desc" },
        { order: "asc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({ offers });
  } catch (error) {
    console.error("Error fetching offers:", error);
    return NextResponse.json(
      { error: "Failed to fetch offers" },
      { status: 500 }
    );
  }
}

