import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch all service sub categories
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const serviceCategoryId = searchParams.get("serviceCategoryId");

    const where: any = {};
    if (serviceCategoryId) {
      where.serviceCategoryId = serviceCategoryId;
    }

    const serviceSubCategories = await prisma.serviceSubCategory.findMany({
      where,
      include: {
        serviceCategory: {
          select: { id: true, title: true },
        },
        _count: {
          select: { serviceDomainSubCategories: true },
        },
      },
      orderBy: [
        { order: "asc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({ serviceSubCategories });
  } catch (error) {
    console.error("Error fetching service sub categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch service sub categories" },
      { status: 500 }
    );
  }
}

// POST - Create new service sub category
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { title, shortDescription, serviceCategoryId, warrantyDays, active, order } = data;

    if (!title || !serviceCategoryId) {
      return NextResponse.json(
        { error: "Title and serviceCategoryId are required" },
        { status: 400 }
      );
    }

    const serviceSubCategory = await prisma.serviceSubCategory.create({
      data: {
        title,
        shortDescription,
        serviceCategoryId,
        warrantyDays: warrantyDays !== undefined && warrantyDays !== null ? parseInt(warrantyDays) : null,
        active: active !== undefined ? active : true,
        order: order !== undefined ? order : 0,
      },
      include: {
        serviceCategory: {
          select: { id: true, title: true },
        },
      },
    });

    return NextResponse.json({ serviceSubCategory });
  } catch (error: any) {
    console.error("Error creating service sub category:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: `A service sub category with this title already exists in this category. Please use a different title.` },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to create service sub category" },
      { status: 500 }
    );
  }
}
