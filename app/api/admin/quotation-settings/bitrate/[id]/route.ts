import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PUT - Update bitrate setting
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { cameraTypeId, territoryCategories, active } = body;

    const setting = await prisma.quotationBitrateSetting.findUnique({
      where: { id: params.id },
    });

    if (!setting) {
      return NextResponse.json(
        { error: "Bitrate setting not found" },
        { status: 404 }
      );
    }

    // Update the setting
    const updateData: any = {};
    if (cameraTypeId !== undefined) updateData.cameraTypeId = cameraTypeId;
    if (active !== undefined) updateData.active = active;

    // If territory categories are provided, update them
    if (territoryCategories && Array.isArray(territoryCategories)) {
      // Delete existing territory categories
      await prisma.quotationBitrateSettingTerritoryCategory.deleteMany({
        where: { quotationBitrateSettingId: params.id },
      });

      // Create new territory categories
      if (territoryCategories.length > 0) {
        await prisma.quotationBitrateSettingTerritoryCategory.createMany({
          data: territoryCategories.map((tc: any) => ({
            quotationBitrateSettingId: params.id,
            territoryCategoryId: tc.territoryCategoryId.trim(),
            bitrate: parseFloat(tc.bitrate),
          })),
        });
      }
    }

    const updatedSetting = await prisma.quotationBitrateSetting.update({
      where: { id: params.id },
      data: updateData,
      include: {
        cameraType: {
          select: {
            id: true,
            name: true,
          },
        },
        territoryCategories: {
          include: {
            territoryCategory: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    return NextResponse.json({ setting: updatedSetting });
  } catch (error: any) {
    console.error("Error updating bitrate setting:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update bitrate setting" },
      { status: 500 }
    );
  }
}

// DELETE - Delete bitrate setting
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const setting = await prisma.quotationBitrateSetting.findUnique({
      where: { id: params.id },
    });

    if (!setting) {
      return NextResponse.json(
        { error: "Bitrate setting not found" },
        { status: 404 }
      );
    }

    await prisma.quotationBitrateSetting.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Bitrate setting deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting bitrate setting:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete bitrate setting" },
      { status: 500 }
    );
  }
}

















