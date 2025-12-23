import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch single service category
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const serviceCategory = await prisma.serviceCategory.findUnique({
      where: { id: params.id },
      include: {
        serviceSubCategories: {
          include: {
            serviceDomainSubCategories: {
              include: {
                serviceDomain: {
                  select: { id: true, title: true },
                },
              },
            },
          },
        },
        _count: {
          select: { serviceSubCategories: true },
        },
      },
    });

    if (!serviceCategory) {
      return NextResponse.json(
        { error: "Service category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ serviceCategory });
  } catch (error) {
    console.error("Error fetching service category:", error);
    return NextResponse.json(
      { error: "Failed to fetch service category" },
      { status: 500 }
    );
  }
}

// PATCH - Update service category
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
    const { title, shortDescription, warrantyDays, active, order } = data;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (shortDescription !== undefined) updateData.shortDescription = shortDescription;
    if (warrantyDays !== undefined) updateData.warrantyDays = warrantyDays !== null ? parseInt(warrantyDays) : null;
    if (active !== undefined) updateData.active = active;
    if (order !== undefined) updateData.order = order;

    const serviceCategory = await prisma.serviceCategory.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({ serviceCategory });
  } catch (error: any) {
    console.error("Error updating service category:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: `A service category with the title "${data.title || 'this title'}" already exists. Please use a different title.` },
        { status: 400 }
      );
    }
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Service category not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to update service category" },
      { status: 500 }
    );
  }
}

// DELETE - Delete service category
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const serviceCategory = await prisma.serviceCategory.findUnique({
      where: { id: params.id },
      include: { serviceSubCategories: { take: 1 } },
    });

    if (!serviceCategory) {
      return NextResponse.json(
        { error: "Service category not found" },
        { status: 404 }
      );
    }

    if (serviceCategory.serviceSubCategories.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete service category with associated subcategories" },
        { status: 400 }
      );
    }

    await prisma.serviceCategory.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting service category:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Service category not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to delete service category" },
      { status: 500 }
    );
  }
}

