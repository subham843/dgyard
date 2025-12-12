import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch all territory categories
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const territoryCategories = await prisma.territoryCategory.findMany({
      include: {
        categories: {
          include: {
            category: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
        subCategories: {
          include: {
            subCategory: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
        _count: {
          select: { products: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ territoryCategories });
  } catch (error) {
    console.error("Error fetching territory categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch territory categories" },
      { status: 500 }
    );
  }
}

// POST - Create new territory category
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { name, description, active, enableForQuotation, categoryIds, subCategoryIds } = data;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Create territory category with categories and subcategories
    const territoryCategory = await prisma.territoryCategory.create({
      data: {
        name,
        slug,
        description,
        active: active !== undefined ? active : true,
        enableForQuotation: enableForQuotation !== undefined ? enableForQuotation : true,
        categories: {
          create: (categoryIds || []).map((categoryId: string) => ({
            categoryId,
          })),
        },
        subCategories: {
          create: (subCategoryIds || []).map((subCategoryId: string) => ({
            subCategoryId,
          })),
        },
      },
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
    console.error("Error creating territory category:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Territory category with this name or slug already exists" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create territory category" },
      { status: 500 }
    );
  }
}

