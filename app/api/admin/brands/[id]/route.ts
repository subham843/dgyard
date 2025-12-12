import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch single brand
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const brand = await prisma.brand.findUnique({
      where: { id: params.id },
      include: {
        products: {
          select: { id: true, name: true },
        },
      },
    });

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    return NextResponse.json({ brand });
  } catch (error) {
    console.error("Error fetching brand:", error);
    return NextResponse.json(
      { error: "Failed to fetch brand" },
      { status: 500 }
    );
  }
}

// PATCH - Update brand
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    console.log("PATCH /api/admin/brands/[id] - Session:", session ? "exists" : "null");
    console.log("PATCH /api/admin/brands/[id] - User role:", session?.user?.role);
    console.log("PATCH /api/admin/brands/[id] - Brand ID:", params.id);
    
    if (!session?.user) {
      console.error("PATCH /api/admin/brands/[id] - No session or user");
      return NextResponse.json({ error: "Unauthorized: No session" }, { status: 401 });
    }
    
    if (session.user.role !== "ADMIN") {
      console.error("PATCH /api/admin/brands/[id] - Invalid role:", session.user.role);
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 401 });
    }

    const data = await request.json();
    console.log("PATCH /api/admin/brands/[id] - Update data:", Object.keys(data));
    
    const { name, description, logo, active, enableForQuotation } = data;

    const updateData: any = {};
    if (name !== undefined) {
      updateData.name = name;
      // Regenerate slug if name changes
      updateData.slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    }
    if (description !== undefined) updateData.description = description;
    if (logo !== undefined) updateData.logo = logo;
    if (active !== undefined) updateData.active = active;
    if (enableForQuotation !== undefined) updateData.enableForQuotation = enableForQuotation;

    console.log("PATCH /api/admin/brands/[id] - Updating with:", Object.keys(updateData));

    const brand = await prisma.brand.update({
      where: { id: params.id },
      data: updateData,
    });

    console.log("PATCH /api/admin/brands/[id] - Brand updated successfully:", brand.id);
    return NextResponse.json({ brand });
  } catch (error: any) {
    console.error("Error updating brand:", error);
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
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: `Failed to update brand: ${error.message || "Unknown error"}` },
      { status: 500 }
    );
  }
}

// DELETE - Delete brand
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if brand has products
    const brand = await prisma.brand.findUnique({
      where: { id: params.id },
      include: { products: { take: 1 } },
    });

    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    if (brand.products.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete brand with associated products" },
        { status: 400 }
      );
    }

    await prisma.brand.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting brand:", error);
    if (error.code === "P2025") {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to delete brand" },
      { status: 500 }
    );
  }
}

