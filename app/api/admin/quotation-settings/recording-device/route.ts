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

    const settings = await prisma.quotationRecordingDeviceSetting.findMany({
      include: {
        cameraType: true,
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
    console.error("Error fetching Recording Device settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch Recording Device settings" },
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
    const { cameraTypeId, categoryId, subCategoryId, territoryCategoryIds } = body;

    if (!categoryId || !subCategoryId) {
      return NextResponse.json(
        { error: "Category and Sub Category are required" },
        { status: 400 }
      );
    }

    console.log("Creating Recording Device setting with:", { cameraTypeId, categoryId, subCategoryId, territoryCategoryIds });

    // Create the Recording Device setting first
    const setting = await prisma.quotationRecordingDeviceSetting.create({
      data: {
        cameraTypeId: cameraTypeId || null,
        categoryId,
        subCategoryId,
      },
      include: {
        cameraType: true,
        category: true,
        subCategory: true,
      },
    });

    // Then create territory category relationships if any are selected
    if (territoryCategoryIds && Array.isArray(territoryCategoryIds) && territoryCategoryIds.length > 0) {
      // Filter out any empty or invalid IDs
      const validIds = territoryCategoryIds.filter((id: any) => id && typeof id === 'string' && id.trim() !== '');
      
      if (validIds.length > 0) {
        // Create junction table entries one by one to avoid issues
        try {
          // Check if the model exists in Prisma client
          if (!prisma.quotationRecordingDeviceSettingTerritoryCategory) {
            console.error("Prisma model 'quotationRecordingDeviceSettingTerritoryCategory' not found. Please regenerate Prisma client.");
            throw new Error("Database model not available. Please restart the server.");
          }
          
          for (const territoryCategoryId of validIds) {
            try {
              await prisma.quotationRecordingDeviceSettingTerritoryCategory.create({
                data: {
                  quotationRecordingDeviceSettingId: setting.id,
                  territoryCategoryId: territoryCategoryId.trim(),
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
    }

    // Fetch the complete setting with all relations
    const completeSetting = await prisma.quotationRecordingDeviceSetting.findUnique({
      where: { id: setting.id },
      include: {
        cameraType: true,
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
    console.error("Error creating Recording Device setting:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create Recording Device setting. Please check your selections." },
      { status: 500 }
    );
  }
}

