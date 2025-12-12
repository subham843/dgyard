import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Filter territory categories by category and/or subcategory
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const subCategoryId = searchParams.get("subCategoryId");

    if (!categoryId && !subCategoryId) {
      return NextResponse.json(
        { error: "Category ID or Sub Category ID is required" },
        { status: 400 }
      );
    }

    // Find territory categories that are linked to the given category or subcategory
    let territoryCategoryIds: string[] = [];

    if (categoryId) {
      const categoryTerritories = await prisma.territoryCategoryCategory.findMany({
        where: { categoryId },
        select: { territoryCategoryId: true },
      });
      territoryCategoryIds.push(...categoryTerritories.map((t) => t.territoryCategoryId));
    }

    if (subCategoryId) {
      const subCategoryTerritories = await prisma.territoryCategorySubCategory.findMany({
        where: { subCategoryId },
        select: { territoryCategoryId: true },
      });
      const subCategoryTerritoryIds = subCategoryTerritories.map((t) => t.territoryCategoryId);
      
      // If both categoryId and subCategoryId provided, find intersection
      if (categoryId && territoryCategoryIds.length > 0) {
        territoryCategoryIds = territoryCategoryIds.filter((id) =>
          subCategoryTerritoryIds.includes(id)
        );
      } else {
        territoryCategoryIds = subCategoryTerritoryIds;
      }
    }

    // Remove duplicates
    territoryCategoryIds = [...new Set(territoryCategoryIds)];

    if (territoryCategoryIds.length === 0) {
      return NextResponse.json({ territoryCategories: [] });
    }

    // Fetch all territory categories linked to the category/subcategory
    // Show all territory categories regardless of enableForQuotation status
    const territoryCategories = await prisma.territoryCategory.findMany({
      where: {
        id: { in: territoryCategoryIds },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({ territoryCategories });
  } catch (error) {
    console.error("Error filtering territory categories:", error);
    return NextResponse.json(
      { error: "Failed to filter territory categories" },
      { status: 500 }
    );
  }
}

