import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public API - Get active skills for technician registration
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceDomainId = searchParams.get("serviceDomainId");

    const where: any = {
      active: true,
    };
    
    if (serviceDomainId) {
      where.serviceDomainId = serviceDomainId;
    }

    const skills = await prisma.skill.findMany({
      where,
      select: {
        id: true,
        title: true,
        shortDescription: true,
        serviceDomain: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: [
        { order: "asc" },
        { title: "asc" },
      ],
    });

    return NextResponse.json(
      { skills },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );
  } catch (error) {
    console.error("Error fetching skills:", error);
    return NextResponse.json(
      { error: "Failed to fetch skills" },
      { status: 500 }
    );
  }
}











