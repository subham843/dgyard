import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public API - Get only active products for quotation
// Also ensures brand, category, and subcategory are active
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const subCategoryId = searchParams.get("subCategoryId");
    const brandId = searchParams.get("brandId");
    const territoryCategoryId = searchParams.get("territoryCategoryId");
    const search = searchParams.get("search");

    const where: any = {
      active: true,
      // Ensure related brand is active
      brand: {
        active: true,
      },
      // Ensure related category is active
      categoryRelation: {
        active: true,
      },
    };

    // If subcategory specified, ensure it's active
    if (subCategoryId) {
      where.subCategory = {
        id: subCategoryId,
        active: true,
      };
    } else if (categoryId) {
      where.categoryId = categoryId;
    }

    if (brandId) {
      where.brandId = brandId;
    }

    if (territoryCategoryId) {
      where.territoryCategoryId = territoryCategoryId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        price: true,
        comparePrice: true,
        sku: true,
        images: true,
        specifications: true,
        brand: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        categoryRelation: {
          select: {
            id: true,
            name: true,
          },
        },
        subCategory: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error("Error fetching products for quotation:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

