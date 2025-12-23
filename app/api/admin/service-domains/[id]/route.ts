import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch single service domain
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const serviceDomain = await prisma.serviceDomain.findUnique({
      where: { id: params.id },
      include: {
        serviceSubCategories: {
          include: {
            serviceSubCategory: true,
          },
        },
        _count: {
          select: { skills: true },
        },
      },
    });

    if (!serviceDomain) {
      return NextResponse.json(
        { error: "Service domain not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ serviceDomain });
  } catch (error) {
    console.error("Error fetching service domain:", error);
    return NextResponse.json(
      { error: "Failed to fetch service domain" },
      { status: 500 }
    );
  }
}

// PATCH - Update service domain
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
    const { title, shortDescription, serviceSubCategoryIds, active, order } = data;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (shortDescription !== undefined) updateData.shortDescription = shortDescription;
    if (active !== undefined) updateData.active = active;
    if (order !== undefined) updateData.order = order;

    // Handle many-to-many relationship update
    if (serviceSubCategoryIds !== undefined && Array.isArray(serviceSubCategoryIds)) {
      // Delete existing relations and create new ones
      await prisma.serviceDomainSubCategory.deleteMany({
        where: { serviceDomainId: params.id },
      });
      
      updateData.serviceSubCategories = {
        create: serviceSubCategoryIds.map((subCategoryId: string) => ({
          serviceSubCategoryId: subCategoryId,
        })),
      };
    }

    const serviceDomain = await prisma.serviceDomain.update({
      where: { id: params.id },
      data: updateData,
      include: {
        serviceSubCategories: {
          include: {
            serviceSubCategory: {
              select: { id: true, title: true },
            },
          },
        },
      },
    });

    return NextResponse.json({ serviceDomain });
  } catch (error: any) {
    console.error("Error updating service domain:", error);
    if (error.code === "P2002") {
      const titleText = title || data.title || "this title";
      return NextResponse.json(
        { error: `A service domain with the title "${titleText}" already exists. Please use a different title.` },
        { status: 400 }
      );
    }
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Service domain not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to update service domain" },
      { status: 500 }
    );
  }
}

// DELETE - Delete service domain
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const serviceDomain = await prisma.serviceDomain.findUnique({
      where: { id: params.id },
      include: { skills: { take: 1 } },
    });

    if (!serviceDomain) {
      return NextResponse.json(
        { error: "Service domain not found" },
        { status: 404 }
      );
    }

    if (serviceDomain.skills.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete service domain with associated skills" },
        { status: 400 }
      );
    }

    await prisma.serviceDomain.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting service domain:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Service domain not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to delete service domain" },
      { status: 500 }
    );
  }
}










