import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch all product commission rules
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email || "" },
      select: { role: true },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const categoryId = searchParams.get("categoryId");
    const subCategoryId = searchParams.get("subCategoryId");
    const isActive = searchParams.get("isActive");

    const where: any = {};
    if (categoryId) where.categoryId = categoryId;
    if (subCategoryId) where.subCategoryId = subCategoryId;
    if (isActive !== null) where.isActive = isActive === "true";

    const commissions = await prisma.productCommission.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ commissions });
  } catch (error: any) {
    console.error("Error fetching product commissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch product commissions", details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create product commission rule
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email || "" },
      select: { id: true, role: true },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      commissionPercentage,
      categoryId,
      subCategoryId,
      codExtraCharge,
      returnPenaltyPercent,
      effectiveFrom,
      effectiveTo,
      isActive = true,
      notes,
    } = body;

    // Validation
    if (
      commissionPercentage === undefined ||
      commissionPercentage < 0 ||
      commissionPercentage > 100
    ) {
      return NextResponse.json(
        { error: "Invalid commission percentage (0-100)" },
        { status: 400 }
      );
    }

    // Deactivate old default rule if this is a new default
    if (!categoryId && !subCategoryId) {
      await prisma.productCommission.updateMany({
        where: {
          categoryId: null,
          subCategoryId: null,
          isActive: true,
        },
        data: { isActive: false },
      });
    }

    const commission = await prisma.productCommission.create({
      data: {
        commissionPercentage: parseFloat(commissionPercentage),
        categoryId: categoryId || null,
        subCategoryId: subCategoryId || null,
        codExtraCharge: codExtraCharge ? parseFloat(codExtraCharge) : null,
        returnPenaltyPercent: returnPenaltyPercent
          ? parseFloat(returnPenaltyPercent)
          : null,
        effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : new Date(),
        effectiveTo: effectiveTo ? new Date(effectiveTo) : null,
        isActive,
        createdBy: user.id,
        notes: notes || null,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        subCategory: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ commission }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating product commission:", error);
    return NextResponse.json(
      { error: "Failed to create product commission", details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update product commission rule
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email || "" },
      select: { id: true, role: true },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "Commission ID required" }, { status: 400 });
    }

    const commission = await prisma.productCommission.update({
      where: { id },
      data: {
        ...updateData,
        commissionPercentage: updateData.commissionPercentage
          ? parseFloat(updateData.commissionPercentage)
          : undefined,
        codExtraCharge: updateData.codExtraCharge
          ? parseFloat(updateData.codExtraCharge)
          : undefined,
        returnPenaltyPercent: updateData.returnPenaltyPercent
          ? parseFloat(updateData.returnPenaltyPercent)
          : undefined,
        effectiveFrom: updateData.effectiveFrom
          ? new Date(updateData.effectiveFrom)
          : undefined,
        effectiveTo: updateData.effectiveTo
          ? new Date(updateData.effectiveTo)
          : undefined,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ commission });
  } catch (error: any) {
    console.error("Error updating product commission:", error);
    return NextResponse.json(
      { error: "Failed to update product commission", details: error.message },
      { status: 500 }
    );
  }
}

