import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch all accessories settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await prisma.quotationAccessoriesSetting.findMany({
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
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Error fetching accessories settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch accessories settings" },
      { status: 500 }
    );
  }
}

// POST - Create new accessories setting with items
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { cameraTypeId, items } = body;

    if (!cameraTypeId) {
      return NextResponse.json(
        { error: "Camera Type is required" },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "At least one item is required" },
        { status: 400 }
      );
    }

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

    // Check if setting already exists for this camera type
    const existingSetting = await prisma.quotationAccessoriesSetting.findFirst({
      where: {
        cameraTypeId,
        active: true,
      },
    });

    if (existingSetting) {
      return NextResponse.json(
        { error: "Accessories setting already exists for this camera type" },
        { status: 400 }
      );
    }

    // Create setting with items
    const setting = await prisma.quotationAccessoriesSetting.create({
      data: {
        cameraTypeId,
        items: {
          create: items.map((item: any) => ({
            itemName: item.itemName.trim(),
            quantity: parseInt(item.quantity),
            rate: parseFloat(item.rate),
            isCableLengthBased: item.isCableLengthBased || false,
            maxCableInMeter: item.isCableLengthBased && item.maxCableInMeter ? parseFloat(item.maxCableInMeter) : null,
          })),
        },
      },
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

    return NextResponse.json({ setting });
  } catch (error: any) {
    console.error("Error creating accessories setting:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create accessories setting" },
      { status: 500 }
    );
  }
}

