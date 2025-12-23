import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch all service categories
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const serviceCategories = await prisma.serviceCategory.findMany({
      include: {
        _count: {
          select: { serviceSubCategories: true },
        },
      },
      orderBy: [
        { order: "asc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({ serviceCategories });
  } catch (error) {
    console.error("Error fetching service categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch service categories" },
      { status: 500 }
    );
  }
}

// POST - Create new service category
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { title, shortDescription, warrantyDays, active, order } = data;

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const serviceCategory = await prisma.serviceCategory.create({
      data: {
        title,
        shortDescription,
        warrantyDays: warrantyDays !== undefined && warrantyDays !== null ? parseInt(warrantyDays) : null,
        active: active !== undefined ? active : true,
        order: order !== undefined ? order : 0,
      },
    });

    return NextResponse.json({ serviceCategory });
  } catch (error: any) {
    console.error("Error creating service category:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: `A service category with the title "${data.title}" already exists. Please use a different title.` },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to create service category" },
      { status: 500 }
    );
  }
}

