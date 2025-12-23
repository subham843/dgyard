import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch all skills
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const serviceDomainId = searchParams.get("serviceDomainId");

    const where: any = {};
    if (serviceDomainId) {
      where.serviceDomainId = serviceDomainId;
    }

    const skills = await prisma.skill.findMany({
      where,
      include: {
        serviceDomain: {
          select: { 
            id: true, 
            title: true, 
            shortDescription: true,
            serviceSubCategories: {
              include: {
                serviceSubCategory: {
                  select: {
                    id: true,
                    title: true,
                    shortDescription: true,
                    serviceCategory: {
                      select: {
                        id: true,
                        title: true,
                        shortDescription: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [
        { order: "asc" },
        { createdAt: "desc" },
      ],
    });

    console.log(`✅ Fetched ${skills.length} skills from database`);
    return NextResponse.json({ skills });
  } catch (error) {
    console.error("Error fetching skills:", error);
    return NextResponse.json(
      { error: "Failed to fetch skills" },
      { status: 500 }
    );
  }
}

// POST - Create new skill
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { title, shortDescription, serviceDomainId, active, order } = data;

    if (!title || !serviceDomainId) {
      return NextResponse.json(
        { error: "Title and serviceDomainId are required" },
        { status: 400 }
      );
    }

    const skill = await prisma.skill.create({
      data: {
        title,
        shortDescription,
        serviceDomainId,
        active: active !== undefined ? active : true,
        order: order !== undefined ? order : 0,
      },
      include: {
        serviceDomain: {
          select: { 
            id: true, 
            title: true, 
            shortDescription: true,
            serviceSubCategories: {
              include: {
                serviceSubCategory: {
                  select: {
                    id: true,
                    title: true,
                    shortDescription: true,
                    serviceCategory: {
                      select: {
                        id: true,
                        title: true,
                        shortDescription: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ skill });
  } catch (error: any) {
    console.error("Error creating skill:", error);
    if (error.code === "P2002") {
      const domain = await prisma.serviceDomain.findUnique({
        where: { id: serviceDomainId },
        select: { title: true },
      }).catch(() => null);
      return NextResponse.json(
        { error: `A skill with the title "${title}" already exists${domain ? ` in "${domain.title}" domain` : ""}. Please use a different title.` },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to create skill" },
      { status: 500 }
    );
  }
}










