import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const offers = await prisma.offer.findMany({
      orderBy: [
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

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const data = await request.json();

    const offer = await prisma.offer.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        image: data.image || null,
        discount: data.discount ? parseFloat(data.discount) : null,
        originalPrice: data.originalPrice ? parseFloat(data.originalPrice) : null,
        offerPrice: data.offerPrice ? parseFloat(data.offerPrice) : null,
        validFrom: data.validFrom ? new Date(data.validFrom) : null,
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
        active: data.active !== undefined ? data.active : true,
        featured: data.featured || false,
        order: data.order ? parseInt(data.order) : 0,
        ctaText: data.ctaText || null,
        ctaLink: data.ctaLink || null,
      },
    });

    return NextResponse.json({ offer });
  } catch (error: any) {
    console.error("Error creating offer:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create offer" },
      { status: 500 }
    );
  }
}

