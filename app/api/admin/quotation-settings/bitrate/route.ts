import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch all bitrate settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await prisma.quotationBitrateSetting.findMany({
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
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Error fetching bitrate settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch bitrate settings" },
      { status: 500 }
    );
  }
}

// POST - Create new bitrate setting with territory categories
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { cameraTypeId, territoryCategories } = body;

    if (!cameraTypeId) {
      return NextResponse.json(
        { error: "Camera Type is required" },
        { status: 400 }
      );
    }

    if (!territoryCategories || !Array.isArray(territoryCategories) || territoryCategories.length === 0) {
      return NextResponse.json(
        { error: "At least one territory category with bitrate is required" },
        { status: 400 }
      );
    }

    // Validate territory categories
    for (const tc of territoryCategories) {
      if (!tc.territoryCategoryId || !tc.territoryCategoryId.trim()) {
        return NextResponse.json(
          { error: "Territory category ID is required for all items" },
          { status: 400 }
        );
      }
      if (!tc.bitrate || parseFloat(tc.bitrate) <= 0) {
        return NextResponse.json(
          { error: "Valid bitrate (kbps) is required for all territory categories" },
          { status: 400 }
        );
      }
    }

    // Check if setting already exists for this camera type
    const existingSetting = await prisma.quotationBitrateSetting.findFirst({
      where: {
        cameraTypeId,
        active: true,
      },
    });

    if (existingSetting) {
      return NextResponse.json(
        { error: "Bitrate setting already exists for this camera type" },
        { status: 400 }
      );
    }

    // Create setting with territory categories
    const setting = await prisma.quotationBitrateSetting.create({
      data: {
        cameraTypeId,
        territoryCategories: {
          create: territoryCategories.map((tc: any) => ({
            territoryCategoryId: tc.territoryCategoryId.trim(),
            bitrate: parseFloat(tc.bitrate),
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

    return NextResponse.json({ setting });
  } catch (error: any) {
    console.error("Error creating bitrate setting:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create bitrate setting" },
      { status: 500 }
    );
  }
}

















