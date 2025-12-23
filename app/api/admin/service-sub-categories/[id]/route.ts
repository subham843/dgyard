import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch single service sub category
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const serviceSubCategory = await prisma.serviceSubCategory.findUnique({
      where: { id: params.id },
      include: {
        serviceCategory: {
          select: { id: true, title: true },
        },
        serviceDomainSubCategories: {
          include: {
            serviceDomain: {
              select: { id: true, title: true },
            },
          },
        },
      },
    });

    if (!serviceSubCategory) {
      return NextResponse.json(
        { error: "Service sub category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ serviceSubCategory });
  } catch (error) {
    console.error("Error fetching service sub category:", error);
    return NextResponse.json(
      { error: "Failed to fetch service sub category" },
      { status: 500 }
    );
  }
}

// PATCH - Update service sub category
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
    const { title, shortDescription, serviceCategoryId, warrantyDays, active, order } = data;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (shortDescription !== undefined) updateData.shortDescription = shortDescription;
    if (serviceCategoryId !== undefined) updateData.serviceCategoryId = serviceCategoryId;
    if (warrantyDays !== undefined) updateData.warrantyDays = warrantyDays !== null ? parseInt(warrantyDays) : null;
    if (active !== undefined) updateData.active = active;
    if (order !== undefined) updateData.order = order;

    const serviceSubCategory = await prisma.serviceSubCategory.update({
      where: { id: params.id },
      data: updateData,
      include: {
        serviceCategory: {
          select: { id: true, title: true },
        },
      },
    });

    return NextResponse.json({ serviceSubCategory });
  } catch (error: any) {
    console.error("Error updating service sub category:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: `A service sub category with this title already exists in this category. Please use a different title.` },
        { status: 400 }
      );
    }
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Service sub category not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to update service sub category" },
      { status: 500 }
    );
  }
}

// DELETE - Delete service sub category
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const serviceSubCategory = await prisma.serviceSubCategory.findUnique({
      where: { id: params.id },
      include: { serviceDomainSubCategories: { take: 1 } },
    });

    if (!serviceSubCategory) {
      return NextResponse.json(
        { error: "Service sub category not found" },
        { status: 404 }
      );
    }

    if (serviceSubCategory.serviceDomainSubCategories.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete service sub category with associated service domains" },
        { status: 400 }
      );
    }

    await prisma.serviceSubCategory.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting service sub category:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Service sub category not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to delete service sub category" },
      { status: 500 }
    );
  }
}
