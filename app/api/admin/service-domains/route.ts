import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch all service domains
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const serviceSubCategoryId = searchParams.get("serviceSubCategoryId");

    const where: any = {};
    if (serviceSubCategoryId) {
      where.serviceSubCategories = {
        some: {
          serviceSubCategoryId: serviceSubCategoryId,
        },
      };
    }

    const serviceDomains = await prisma.serviceDomain.findMany({
      where,
      include: {
        serviceSubCategories: {
          include: {
            serviceSubCategory: {
              select: { id: true, title: true },
            },
          },
        },
        _count: {
          select: { skills: true },
        },
      },
      orderBy: [
        { order: "asc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({ serviceDomains });
  } catch (error) {
    console.error("Error fetching service domains:", error);
    return NextResponse.json(
      { error: "Failed to fetch service domains" },
      { status: 500 }
    );
  }
}

// POST - Create new service domain
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { title, shortDescription, serviceSubCategoryIds, active, order } = data;

    if (!title || !serviceSubCategoryIds || !Array.isArray(serviceSubCategoryIds) || serviceSubCategoryIds.length === 0) {
      return NextResponse.json(
        { error: "Title and at least one serviceSubCategoryId are required" },
        { status: 400 }
      );
    }

    const serviceDomain = await prisma.serviceDomain.create({
      data: {
        title,
        shortDescription,
        active: active !== undefined ? active : true,
        order: order !== undefined ? order : 0,
        serviceSubCategories: {
          create: serviceSubCategoryIds.map((subCategoryId: string) => ({
            serviceSubCategoryId: subCategoryId,
          })),
        },
      },
      include: {
        serviceSubCategories: {
          include: {
            serviceSubCategory: {
              select: { id: true, title: true },
            },
          },
        },
      },
    });

    return NextResponse.json({ serviceDomain });
  } catch (error: any) {
    console.error("Error creating service domain:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: `A service domain with the title "${title}" already exists. Please use a different title.` },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to create service domain" },
      { status: 500 }
    );
  }
}










