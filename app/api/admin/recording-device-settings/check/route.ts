import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const subCategoryId = searchParams.get("subCategoryId");

    if (!categoryId || !subCategoryId) {
      return NextResponse.json(
        { error: "Category ID and Sub Category ID are required" },
        { status: 400 }
      );
    }

    console.log("Checking Recording Device Setting for:", { categoryId, subCategoryId });

    // Check if Recording Device Setting exists for this category/subcategory
    const setting = await prisma.quotationRecordingDeviceSetting.findFirst({
      where: {
        categoryId,
        subCategoryId,
        active: true,
      },
      include: {
        territoryCategories: {
          include: {
            territoryCategory: true,
          },
        },
      },
    });

    console.log("Recording Device Setting found:", setting ? "Yes" : "No");
    if (setting) {
      console.log("Territory Categories in setting:", setting.territoryCategories.length);
      // Log each territory category for debugging
      setting.territoryCategories.forEach((tc: any, index: number) => {
        console.log(`TC ${index + 1}:`, {
          id: tc.territoryCategory?.id,
          name: tc.territoryCategory?.name,
          enableForQuotation: tc.territoryCategory?.enableForQuotation,
        });
      });
    }

    if (!setting) {
      return NextResponse.json({
        hasSetting: false,
        territoryCategories: [],
      });
    }

    // Extract territory categories from the setting and filter by enableForQuotation = true
    const allTerritoryCategories = setting.territoryCategories
      .map((tc: any) => {
        if (!tc || !tc.territoryCategory) {
          console.warn("Null or undefined territory category in setting");
          return null;
        }
        return tc.territoryCategory;
      })
      .filter((tc: any) => tc !== null && tc !== undefined); // Filter out null/undefined
    
    console.log("All territory categories (after null filter):", allTerritoryCategories.length);
    
    if (allTerritoryCategories.length === 0) {
      console.warn("No territory categories found in Recording Device Setting after mapping");
    }
    
    // Log all territory categories with their enableForQuotation status
    allTerritoryCategories.forEach((tc: any) => {
      console.log(`TC: "${tc.name}" (ID: ${tc.id}) - enableForQuotation: ${tc.enableForQuotation} (type: ${typeof tc.enableForQuotation})`);
    });
    
    // Filter by enableForQuotation = true and map to response format
    // Also check for boolean true explicitly (handle string "true" cases)
    const territoryCategories = allTerritoryCategories
      .filter((tc: any) => {
        // Check for boolean true or string "true"
        const isEnabled = tc.enableForQuotation === true || tc.enableForQuotation === "true";
        console.log(`Territory Category "${tc.name}": enableForQuotation = ${tc.enableForQuotation} (${typeof tc.enableForQuotation}), included = ${isEnabled}`);
        return isEnabled;
      })
      .map((tc: any) => ({
        id: tc.id,
        name: tc.name,
      }));

    console.log("Filtered territory categories (enableForQuotation=true):", territoryCategories.length);
    console.log("Final territory categories:", JSON.stringify(territoryCategories, null, 2));
    
    if (territoryCategories.length === 0 && allTerritoryCategories.length > 0) {
      console.warn(`WARNING: ${allTerritoryCategories.length} territory categories found in Recording Device Setting, but none have enableForQuotation = true`);
    }

    return NextResponse.json({
      hasSetting: true,
      territoryCategories,
    });
  } catch (error) {
    console.error("Error checking Recording Device Setting:", error);
    return NextResponse.json(
      { error: "Failed to check Recording Device Setting" },
      { status: 500 }
    );
  }
}

