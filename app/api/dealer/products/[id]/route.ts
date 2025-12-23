import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "DEALER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        categoryRelation: { select: { id: true, name: true } },
        subCategory: { select: { id: true, name: true } },
        territoryCategory: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true } },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error: any) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch product" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "DEALER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();

    const updateData: any = {};
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.price !== undefined) updateData.price = parseFloat(data.price);
    if (data.comparePrice !== undefined) updateData.comparePrice = data.comparePrice ? parseFloat(data.comparePrice) : null;
    if (data.sku !== undefined) updateData.sku = data.sku || null;
    if (data.stock !== undefined) updateData.stock = parseInt(data.stock);
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.featured !== undefined) updateData.featured = data.featured;
    if (data.active !== undefined) updateData.active = data.active;
    if (data.enableForQuotation !== undefined) updateData.enableForQuotation = data.enableForQuotation;
    if (data.images !== undefined) updateData.images = data.images;
    if (data.specifications !== undefined) updateData.specifications = data.specifications;
    if (data.brandId !== undefined) updateData.brandId = data.brandId || null;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId || null;
    if (data.subCategoryId !== undefined) updateData.subCategoryId = data.subCategoryId || null;
    if (data.territoryCategoryId !== undefined) updateData.territoryCategoryId = data.territoryCategoryId || null;
    if (data.originalResolutionSupport !== undefined) updateData.originalResolutionSupport = data.originalResolutionSupport || [];
    if (data.compatibleResolutionSupport !== undefined) updateData.compatibleResolutionSupport = data.compatibleResolutionSupport || [];
    if (data.maxCameraSupport !== undefined) updateData.maxCameraSupport = data.maxCameraSupport ? parseInt(data.maxCameraSupport, 10) : null;
    if (data.megapixelSupported !== undefined) updateData.megapixelSupported = data.megapixelSupported || [];
    if (data.maxCameraSupported !== undefined) updateData.maxCameraSupported = data.maxCameraSupported ? parseInt(data.maxCameraSupported, 10) : null;
    if (data.maxWireInMeter !== undefined) updateData.maxWireInMeter = data.maxWireInMeter ? parseFloat(data.maxWireInMeter) : null;

    const product = await prisma.product.update({
      where: { id: params.id },
      data: updateData,
      include: {
        categoryRelation: { select: { id: true, name: true } },
        subCategory: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ product });
  } catch (error: any) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update product" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "DEALER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.product.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete product" },
      { status: 500 }
    );
  }
}





