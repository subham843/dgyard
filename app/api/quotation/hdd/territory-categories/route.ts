import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public API - Get Territory Categories from QuotationHddSetting configuration
// Cache for 1 hour (3600 seconds)
export const revalidate = 3600;

export async function GET() {
  try {
    // Get active HDD settings from QuotationHddSetting
    const hddSettings = await prisma.quotationHddSetting.findMany({
      where: {
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

    console.log(`Found ${hddSettings.length} active HDD settings`);

    if (hddSettings.length === 0) {
      return NextResponse.json({ territoryCategories: [] });
    }

    // Collect all unique territory categories from all HDD settings
    const territoryCategoryMap = new Map<string, any>();

    hddSettings.forEach((setting) => {
      if (setting.territoryCategories && setting.territoryCategories.length > 0) {
        setting.territoryCategories.forEach((tcRelation) => {
          if (tcRelation.territoryCategory) {
            const tc = tcRelation.territoryCategory;
            // Only add active territory categories
            if (tc.active) {
              territoryCategoryMap.set(tc.id, {
                id: tc.id,
                name: tc.name,
                slug: tc.slug,
                description: tc.description,
              });
            }
          }
        });
      }
    });

    // Convert map to array
    const territoryCategories = Array.from(territoryCategoryMap.values());

    // Sort by name
    territoryCategories.sort((a, b) => a.name.localeCompare(b.name));

    console.log(`Returning ${territoryCategories.length} unique territory categories from HDD settings`);

    return NextResponse.json(
      { territoryCategories },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );
  } catch (error) {
    console.error("Error fetching HDD territory categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch HDD territory categories" },
      { status: 500 }
    );
  }
}



















