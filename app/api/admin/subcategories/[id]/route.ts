import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch single subcategory
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subCategory = await prisma.subCategory.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        products: {
          select: { id: true, name: true },
        },
      },
    });

    if (!subCategory) {
      return NextResponse.json(
        { error: "SubCategory not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ subCategory });
  } catch (error) {
    console.error("Error fetching subcategory:", error);
    return NextResponse.json(
      { error: "Failed to fetch subcategory" },
      { status: 500 }
    );
  }
}

// PATCH - Update subcategory
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
    const { name, description, icon, categoryId, active, enableForQuotation } = data;

    const updateData: any = {};
    if (name !== undefined) {
      updateData.name = name;
      updateData.slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    }
    if (description !== undefined) updateData.description = description;
    if (icon !== undefined) updateData.icon = icon;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (active !== undefined) updateData.active = active;
    if (enableForQuotation !== undefined) updateData.enableForQuotation = enableForQuotation;

    const subCategory = await prisma.subCategory.update({
      where: { id: params.id },
      data: updateData,
      include: {
        category: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json({ subCategory });
  } catch (error: any) {
    console.error("Error updating subcategory:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "SubCategory with this name and category already exists" },
        { status: 400 }
      );
    }
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "SubCategory not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update subcategory" },
      { status: 500 }
    );
  }
}

// DELETE - Delete subcategory
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subCategory = await prisma.subCategory.findUnique({
      where: { id: params.id },
      include: { products: { take: 1 } },
    });

    if (!subCategory) {
      return NextResponse.json(
        { error: "SubCategory not found" },
        { status: 404 }
      );
    }

    if (subCategory.products.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete subcategory with associated products" },
        { status: 400 }
      );
    }

    await prisma.subCategory.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting subcategory:", error);
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "SubCategory not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to delete subcategory" },
      { status: 500 }
    );
  }
}

