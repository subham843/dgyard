import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await prisma.quotationHddSetting.findMany({
      include: {
        category: true,
        subCategory: true,
        territoryCategories: {
          include: {
            territoryCategory: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Error fetching HDD settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch HDD settings" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { categoryId, subCategoryId, territoryCategories, territoryCategoryIds } = body;

    if (!categoryId || !subCategoryId) {
      return NextResponse.json(
        { error: "Category and Sub Category are required" },
        { status: 400 }
      );
    }

    // Support both old format (territoryCategoryIds) and new format (territoryCategories with capacity)
    const territoryCategoryList = territoryCategories || (territoryCategoryIds ? territoryCategoryIds.map((id: string) => ({ territoryCategoryId: id })) : []);

    if (!territoryCategoryList || territoryCategoryList.length === 0) {
      return NextResponse.json(
        { error: "At least one territory category with capacity is required" },
        { status: 400 }
      );
    }

    console.log("Creating HDD setting with:", { categoryId, subCategoryId, territoryCategoryList });

    // Create the HDD setting first
    const setting = await prisma.quotationHddSetting.create({
      data: {
        categoryId,
        subCategoryId,
      },
      include: {
        category: true,
        subCategory: true,
      },
    });

    // Then create territory category relationships with capacity
    if (territoryCategoryList && Array.isArray(territoryCategoryList) && territoryCategoryList.length > 0) {
      try {
        // Check if the model exists in Prisma client
        if (!prisma.quotationHddSettingTerritoryCategory) {
          console.error("Prisma model 'quotationHddSettingTerritoryCategory' not found. Please regenerate Prisma client.");
          throw new Error("Database model not available. Please restart the server.");
        }
        
        for (const item of territoryCategoryList) {
          const territoryCategoryId = typeof item === 'string' ? item : item.territoryCategoryId;
          const capacityGB = typeof item === 'object' && item.capacityGB ? item.capacityGB : null;
          const capacityTB = typeof item === 'object' && item.capacityTB ? item.capacityTB : null;

          if (!territoryCategoryId || typeof territoryCategoryId !== 'string' || territoryCategoryId.trim() === '') {
            continue;
          }

          try {
            await prisma.quotationHddSettingTerritoryCategory.create({
              data: {
                quotationHddSettingId: setting.id,
                territoryCategoryId: territoryCategoryId.trim(),
                capacityGB: capacityGB,
                capacityTB: capacityTB,
              },
            });
          } catch (createError: any) {
            // Skip if duplicate or other error (already exists)
            if (createError.code !== 'P2002') {
              console.error(`Error creating territory category link:`, createError);
            }
          }
        }
      } catch (error: any) {
        console.error("Error in territory category creation:", error);
        // Log the error but don't fail the entire operation
        console.warn("Continuing without territory categories due to error:", error.message);
      }
    }

    // Fetch the complete setting with all relations
    const completeSetting = await prisma.quotationHddSetting.findUnique({
      where: { id: setting.id },
      include: {
        category: true,
        subCategory: true,
        territoryCategories: {
          include: {
            territoryCategory: true,
          },
        },
      },
    });

    return NextResponse.json({ setting: completeSetting || setting }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating HDD setting:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create HDD setting. Please check your selections." },
      { status: 500 }
    );
  }
}

