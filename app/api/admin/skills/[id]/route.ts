import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch single skill
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const skill = await prisma.skill.findUnique({
      where: { id: params.id },
      include: {
        serviceDomain: {
          include: {
            serviceSubCategories: {
              include: {
                serviceSubCategory: {
                  include: {
                    serviceCategory: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!skill) {
      return NextResponse.json(
        { error: "Skill not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ skill });
  } catch (error) {
    console.error("Error fetching skill:", error);
    return NextResponse.json(
      { error: "Failed to fetch skill" },
      { status: 500 }
    );
  }
}

// PATCH - Update skill
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { title, shortDescription, serviceDomainId, active, order } = data;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (shortDescription !== undefined) updateData.shortDescription = shortDescription;
    if (serviceDomainId !== undefined) updateData.serviceDomainId = serviceDomainId;
    if (active !== undefined) updateData.active = active;
    if (order !== undefined) updateData.order = order;

    const skill = await prisma.skill.update({
      where: { id: params.id },
      data: updateData,
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
    console.error("Error updating skill:", error);
    if (error.code === "P2002") {
      const domainId = data.serviceDomainId || updateData.serviceDomainId;
      const domain = domainId ? await prisma.serviceDomain.findUnique({
        where: { id: domainId },
        select: { title: true },
      }).catch(() => null) : null;
      const titleText = title || "this title";
      return NextResponse.json(
        { error: `A skill with the title "${titleText}" already exists${domain ? ` in "${domain.title}" domain` : ""}. Please use a different title.` },
        { status: 400 }
      );
    }
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Skill not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to update skill" },
      { status: 500 }
    );
  }
}

// DELETE - Delete skill
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const skill = await prisma.skill.findUnique({
      where: { id: params.id },
    });

    if (!skill) {
      return NextResponse.json(
        { error: "Skill not found" },
        { status: 404 }
      );
    }

    await prisma.skill.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting skill:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Skill not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to delete skill" },
      { status: 500 }
    );
  }
}










