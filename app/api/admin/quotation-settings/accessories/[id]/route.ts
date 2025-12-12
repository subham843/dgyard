import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH - Update accessories setting
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { items, active } = body;

    // If updating items
    if (items && Array.isArray(items)) {
      // Validate items
      for (const item of items) {
        if (!item.itemName || !item.itemName.trim()) {
          return NextResponse.json(
            { error: "Item name is required for all items" },
            { status: 400 }
          );
        }
        if (!item.quantity || item.quantity <= 0) {
          return NextResponse.json(
            { error: "Valid quantity is required for all items" },
            { status: 400 }
          );
        }
        if (!item.rate || item.rate <= 0) {
          return NextResponse.json(
            { error: "Valid rate is required for all items" },
            { status: 400 }
          );
        }
        // Validate cable length for cable-length based items
        if (item.isCableLengthBased && (!item.maxCableInMeter || parseFloat(item.maxCableInMeter) <= 0)) {
          return NextResponse.json(
            { error: "Valid maximum cable length (in meters) is required for cable-length based items" },
            { status: 400 }
          );
        }
      }

      // Delete existing items and create new ones
      await prisma.quotationAccessoriesItem.deleteMany({
        where: {
          quotationAccessoriesSettingId: params.id,
        },
      });

      await prisma.quotationAccessoriesItem.createMany({
        data: items.map((item: any) => ({
          quotationAccessoriesSettingId: params.id,
          itemName: item.itemName.trim(),
          quantity: parseInt(item.quantity),
          rate: parseFloat(item.rate),
          isCableLengthBased: item.isCableLengthBased || false,
          maxCableInMeter: item.isCableLengthBased && item.maxCableInMeter ? parseFloat(item.maxCableInMeter) : null,
        })),
      });
    }

    // Update active status if provided
    const updateData: any = {};
    if (active !== undefined) {
      updateData.active = active;
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.quotationAccessoriesSetting.update({
        where: { id: params.id },
        data: updateData,
      });
    }

    const updatedSetting = await prisma.quotationAccessoriesSetting.findUnique({
      where: { id: params.id },
      include: {
        cameraType: {
          select: {
            id: true,
            name: true,
          },
        },
        items: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    return NextResponse.json({ setting: updatedSetting });
  } catch (error: any) {
    console.error("Error updating accessories setting:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update accessories setting" },
      { status: 500 }
    );
  }
}

// DELETE - Delete accessories setting
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.quotationAccessoriesSetting.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting accessories setting:", error);
    return NextResponse.json(
      { error: "Failed to delete accessories setting" },
      { status: 500 }
    );
  }
}

