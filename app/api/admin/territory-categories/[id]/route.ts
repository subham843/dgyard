import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch single territory category
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const territoryCategory = await prisma.territoryCategory.findUnique({
      where: { id: params.id },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        subCategories: {
          include: {
            subCategory: {
              include: {
                category: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
        products: {
          select: { id: true, name: true },
        },
      },
    });

    if (!territoryCategory) {
      return NextResponse.json(
        { error: "Territory category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ territoryCategory });
  } catch (error) {
    console.error("Error fetching territory category:", error);
    return NextResponse.json(
      { error: "Failed to fetch territory category" },
      { status: 500 }
    );
  }
}

// PATCH - Update territory category
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
    const { name, description, active, enableForQuotation, categoryIds, subCategoryIds } = data;

    const updateData: any = {};
    if (name !== undefined) {
      updateData.name = name;
      updateData.slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    }
    if (description !== undefined) updateData.description = description;
    if (active !== undefined) updateData.active = active;
    if (enableForQuotation !== undefined) updateData.enableForQuotation = enableForQuotation;

    // Handle categories and subcategories update
    if (categoryIds !== undefined || subCategoryIds !== undefined) {
      // Delete existing relations
      await prisma.territoryCategoryCategory.deleteMany({
        where: { territoryCategoryId: params.id },
      });
      await prisma.territoryCategorySubCategory.deleteMany({
        where: { territoryCategoryId: params.id },
      });

      // Create new relations
      if (categoryIds && categoryIds.length > 0) {
        await prisma.territoryCategoryCategory.createMany({
          data: categoryIds.map((categoryId: string) => ({
            territoryCategoryId: params.id,
            categoryId,
          })),
        });
      }

      if (subCategoryIds && subCategoryIds.length > 0) {
        await prisma.territoryCategorySubCategory.createMany({
          data: subCategoryIds.map((subCategoryId: string) => ({
            territoryCategoryId: params.id,
            subCategoryId,
          })),
        });
      }
    }

    const territoryCategory = await prisma.territoryCategory.update({
      where: { id: params.id },
      data: updateData,
      include: {
        categories: {
          include: {
            category: {
              select: { id: true, name: true },
            },
          },
        },
        subCategories: {
          include: {
            subCategory: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    return NextResponse.json({ territoryCategory });
  } catch (error: any) {
    console.error("Error updating territory category:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Territory category with this name or slug already exists" },
        { status: 400 }
      );
    }
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Territory category not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update territory category" },
      { status: 500 }
    );
  }
}

// DELETE - Delete territory category
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const territoryCategory = await prisma.territoryCategory.findUnique({
      where: { id: params.id },
      include: { products: { take: 1 } },
    });

    if (!territoryCategory) {
      return NextResponse.json(
        { error: "Territory category not found" },
        { status: 404 }
      );
    }

    if (territoryCategory.products.length > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete territory category with associated products",
        },
        { status: 400 }
      );
    }

    await prisma.territoryCategory.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting territory category:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Territory category not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to delete territory category" },
      { status: 500 }
    );
  }
}

