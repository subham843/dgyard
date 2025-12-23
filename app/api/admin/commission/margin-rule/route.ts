import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch minimum margin rules
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
    const isActive = searchParams.get("isActive");

    const where: any = {};
    if (isActive !== null) where.isActive = isActive === "true";

    const rules = await prisma.minimumMarginRule.findMany({
      where,
      include: {
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

    return NextResponse.json({ rules });
  } catch (error: any) {
    console.error("Error fetching margin rules:", error);
    return NextResponse.json(
      { error: "Failed to fetch margin rules", details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create minimum margin rule
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
      minimumMarginAmount,
      minimumMarginPercent,
      applyToService,
      applyToProduct,
      requiresApproval,
      autoReject,
      effectiveFrom,
      effectiveTo,
      isActive = true,
      notes,
    } = body;

    // Validation
    if (
      (minimumMarginAmount === undefined || minimumMarginAmount < 0) &&
      (minimumMarginPercent === undefined || minimumMarginPercent < 0)
    ) {
      return NextResponse.json(
        { error: "Either minimum margin amount or percentage required" },
        { status: 400 }
      );
    }

    // Deactivate old rules
    await prisma.minimumMarginRule.updateMany({
      where: {
        isActive: true,
      },
      data: { isActive: false },
    });

    const rule = await prisma.minimumMarginRule.create({
      data: {
        minimumMarginAmount: minimumMarginAmount
          ? parseFloat(minimumMarginAmount)
          : 0,
        minimumMarginPercent: minimumMarginPercent
          ? parseFloat(minimumMarginPercent)
          : null,
        applyToService: applyToService !== undefined ? applyToService : true,
        applyToProduct: applyToProduct !== undefined ? applyToProduct : true,
        requiresApproval: requiresApproval !== undefined ? requiresApproval : true,
        autoReject: autoReject !== undefined ? autoReject : false,
        effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : new Date(),
        effectiveTo: effectiveTo ? new Date(effectiveTo) : null,
        isActive,
        createdBy: user.id,
        notes: notes || null,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ rule }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating margin rule:", error);
    return NextResponse.json(
      { error: "Failed to create margin rule", details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update minimum margin rule
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
      return NextResponse.json({ error: "Rule ID required" }, { status: 400 });
    }

    const rule = await prisma.minimumMarginRule.update({
      where: { id },
      data: {
        ...updateData,
        minimumMarginAmount: updateData.minimumMarginAmount
          ? parseFloat(updateData.minimumMarginAmount)
          : undefined,
        minimumMarginPercent: updateData.minimumMarginPercent
          ? parseFloat(updateData.minimumMarginPercent)
          : undefined,
        effectiveFrom: updateData.effectiveFrom
          ? new Date(updateData.effectiveFrom)
          : undefined,
        effectiveTo: updateData.effectiveTo
          ? new Date(updateData.effectiveTo)
          : undefined,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ rule });
  } catch (error: any) {
    console.error("Error updating margin rule:", error);
    return NextResponse.json(
      { error: "Failed to update margin rule", details: error.message },
      { status: 500 }
    );
  }
}

