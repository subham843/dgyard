import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch all brands
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const brands = await prisma.brand.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ brands });
  } catch (error) {
    console.error("Error fetching brands:", error);
    return NextResponse.json(
      { error: "Failed to fetch brands" },
      { status: 500 }
    );
  }
}

// POST - Create new brand
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    console.log("POST /api/admin/brands - Session:", session ? "exists" : "null");
    console.log("POST /api/admin/brands - User role:", session?.user?.role);
    
    if (!session?.user) {
      console.error("POST /api/admin/brands - No session or user");
      return NextResponse.json({ error: "Unauthorized: No session" }, { status: 401 });
    }
    
    if (session.user.role !== "ADMIN") {
      console.error("POST /api/admin/brands - Invalid role:", session.user.role);
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 401 });
    }

    const data = await request.json();
    console.log("POST /api/admin/brands - Data received:", { name: data.name, hasLogo: !!data.logo });
    
    const { name, description, logo, active, enableForQuotation } = data;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    console.log("POST /api/admin/brands - Creating brand with slug:", slug);
    
    const brand = await prisma.brand.create({
      data: {
        name,
        slug,
        description,
        logo,
        active: active !== undefined ? active : true,
        enableForQuotation: enableForQuotation !== undefined ? enableForQuotation : true,
      },
    });

    console.log("POST /api/admin/brands - Brand created successfully:", brand.id);
    return NextResponse.json({ brand });
  } catch (error: any) {
    console.error("Error creating brand:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Brand with this name or slug already exists" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: `Failed to create brand: ${error.message || "Unknown error"}` },
      { status: 500 }
    );
  }
}

