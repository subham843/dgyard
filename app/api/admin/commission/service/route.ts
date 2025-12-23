import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch all service commission rules
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
    const jobType = searchParams.get("jobType");
    const dealerId = searchParams.get("dealerId");
    const isActive = searchParams.get("isActive");

    const where: any = {};
    if (jobType) where.jobType = jobType;
    if (dealerId) where.dealerId = dealerId;
    if (isActive !== null) where.isActive = isActive === "true";

    const commissions = await prisma.serviceCommission.findMany({
      where,
      include: {
        dealer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        serviceCategory: {
          select: {
            id: true,
            title: true,
          },
        },
        serviceSubCategory: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ commissions });
  } catch (error: any) {
    console.error("Error fetching service commissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch service commissions", details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create or update service commission rule
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
      commissionType,
      commissionValue,
      jobType,
      city,
      region,
      dealerId,
      serviceCategoryId,
      serviceSubCategoryId,
      effectiveFrom,
      effectiveTo,
      isActive = true,
      notes,
    } = body;

    // Validation
    if (!commissionType || commissionValue === undefined || commissionValue < 0) {
      return NextResponse.json(
        { error: "Invalid commission type or value" },
        { status: 400 }
      );
    }

    // Deactivate old rules if this is a new default rule
    if (!dealerId && !jobType && !city && !region && !serviceCategoryId && !serviceSubCategoryId) {
      await prisma.serviceCommission.updateMany({
        where: {
          dealerId: null,
          jobType: null,
          city: null,
          region: null,
          serviceCategoryId: null,
          serviceSubCategoryId: null,
          isActive: true,
        },
        data: { isActive: false },
      });
    }

    const commission = await prisma.serviceCommission.create({
      data: {
        commissionType: commissionType,
        commissionValue: parseFloat(commissionValue),
        jobType: jobType || null,
        city: city || null,
        region: region || null,
        dealerId: dealerId || null,
        serviceCategoryId: serviceCategoryId || null,
        serviceSubCategoryId: serviceSubCategoryId || null,
        effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : new Date(),
        effectiveTo: effectiveTo ? new Date(effectiveTo) : null,
        isActive,
        createdBy: user.id,
        notes: notes || null,
      },
      include: {
        dealer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        serviceCategory: {
          select: {
            id: true,
            title: true,
          },
        },
        serviceSubCategory: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json({ commission }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating service commission:", error);
    return NextResponse.json(
      { error: "Failed to create service commission", details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update service commission rule
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

    // Validate commissionValue if provided
    if (updateData.commissionValue !== undefined && updateData.commissionValue !== null && updateData.commissionValue !== "") {
      const parsedValue = parseFloat(updateData.commissionValue.toString());
      if (isNaN(parsedValue) || parsedValue < 0) {
        return NextResponse.json(
          { error: "Invalid commission value. Must be a valid positive number." },
          { status: 400 }
        );
      }
    }

    // Build update data object, only including fields that are provided
    const data: any = {};
    
    if (updateData.commissionType !== undefined) {
      if (!["PERCENTAGE", "FIXED"].includes(updateData.commissionType)) {
        return NextResponse.json(
          { error: "Invalid commission type. Must be PERCENTAGE or FIXED." },
          { status: 400 }
        );
      }
      data.commissionType = updateData.commissionType;
    }
    
    if (updateData.commissionValue !== undefined && updateData.commissionValue !== null && updateData.commissionValue !== "") {
      data.commissionValue = parseFloat(updateData.commissionValue.toString());
    }
    
    if (updateData.jobType !== undefined) {
      data.jobType = updateData.jobType === "" ? null : updateData.jobType;
    }
    
    if (updateData.city !== undefined) {
      data.city = updateData.city === "" ? null : updateData.city;
    }
    
    if (updateData.region !== undefined) {
      data.region = updateData.region === "" ? null : updateData.region;
    }
    
    if (updateData.dealerId !== undefined) {
      data.dealerId = updateData.dealerId === "" ? null : updateData.dealerId;
    }
    
    if (updateData.serviceCategoryId !== undefined) {
      data.serviceCategoryId = updateData.serviceCategoryId === "" ? null : updateData.serviceCategoryId;
    }
    
    if (updateData.serviceSubCategoryId !== undefined) {
      data.serviceSubCategoryId = updateData.serviceSubCategoryId === "" ? null : updateData.serviceSubCategoryId;
    }
    
    if (updateData.effectiveFrom !== undefined) {
      data.effectiveFrom = updateData.effectiveFrom ? new Date(updateData.effectiveFrom) : new Date();
    }
    
    if (updateData.effectiveTo !== undefined) {
      data.effectiveTo = updateData.effectiveTo ? new Date(updateData.effectiveTo) : null;
    }
    
    if (updateData.isActive !== undefined) {
      data.isActive = updateData.isActive;
    }
    
    if (updateData.notes !== undefined) {
      data.notes = updateData.notes === "" ? null : updateData.notes;
    }

    const commission = await prisma.serviceCommission.update({
      where: { id },
      data,
      include: {
        dealer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        serviceCategory: {
          select: {
            id: true,
            title: true,
          },
        },
        serviceSubCategory: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json({ commission });
  } catch (error: any) {
    console.error("Error updating service commission:", error);
    console.error("Update data received:", JSON.stringify(updateData, null, 2));
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      meta: error.meta,
    });
    
    // Handle specific Prisma errors
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Service commission not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to update service commission", details: error.message },
      { status: 500 }
    );
  }
}

