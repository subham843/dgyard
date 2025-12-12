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

    if (!categoryId) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 }
      );
    }

    console.log("Checking Power Supply Setting for:", { categoryId });

    // Check if Power Supply Setting exists for this category
    const setting = await prisma.quotationPowerSupplySetting.findFirst({
      where: {
        categoryId,
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

    console.log("Power Supply Setting found:", setting ? "Yes" : "No");

    if (!setting) {
      return NextResponse.json({
        hasSetting: false,
        territoryCategories: [],
      });
    }

    // Get all territory categories with enableForQuotation = true (not just from setting)
    const allTerritoryCategories = await prisma.territoryCategory.findMany({
      where: {
        enableForQuotation: true,
        active: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    console.log("All territory categories with enableForQuotation=true:", allTerritoryCategories.length);

    const territoryCategories = allTerritoryCategories.map((tc) => ({
      id: tc.id,
      name: tc.name,
    }));

    return NextResponse.json({
      hasSetting: true,
      territoryCategories,
    });
  } catch (error) {
    console.error("Error checking Power Supply Setting:", error);
    return NextResponse.json(
      { error: "Failed to check Power Supply Setting" },
      { status: 500 }
    );
  }
}


















