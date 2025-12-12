import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const data = await request.json();

    const updateData: any = {
      name: data.name,
      slug: data.slug,
      description: data.description,
      price: data.price,
      comparePrice: data.comparePrice,
      sku: data.sku,
      stock: data.stock,
      tags: data.tags || [],
      featured: data.featured,
      active: data.active,
      images: data.images || [],
      specifications: data.specifications || {},
    };

    // Handle optional fields
    if (data.category !== undefined) updateData.category = data.category;
    if (data.enableForQuotation !== undefined) updateData.enableForQuotation = data.enableForQuotation;
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
    });

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
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
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await prisma.product.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}

