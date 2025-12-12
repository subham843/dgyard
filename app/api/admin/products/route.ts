import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const products = await prisma.product.findMany({
      include: {
        categoryRelation: {
          select: { id: true, name: true },
        },
        subCategory: {
          select: { id: true, name: true },
        },
        territoryCategory: {
          select: { id: true, name: true },
        },
        brand: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const data = await request.json();

    console.log("Creating product with data:", JSON.stringify(data, null, 2));

    const product = await prisma.product.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        price: parseFloat(data.price),
        comparePrice: data.comparePrice ? parseFloat(data.comparePrice) : null,
        sku: data.sku || null,
        stock: parseInt(data.stock) || 0,
        category: data.category || "",
        tags: data.tags || [],
        featured: data.featured || false,
        active: data.active !== undefined ? data.active : true,
        enableForQuotation: data.enableForQuotation !== undefined ? data.enableForQuotation : true,
        images: data.images || [],
        specifications: data.specifications || {},
        brandId: data.brandId || null,
        categoryId: data.categoryId || null,
        subCategoryId: data.subCategoryId || null,
        territoryCategoryId: data.territoryCategoryId || null,
        originalResolutionSupport: data.originalResolutionSupport || [],
        compatibleResolutionSupport: data.compatibleResolutionSupport || [],
        maxCameraSupport: data.maxCameraSupport ? (typeof data.maxCameraSupport === 'string' ? parseInt(data.maxCameraSupport, 10) : data.maxCameraSupport) : null,
        megapixelSupported: data.megapixelSupported || [],
        maxCameraSupported: data.maxCameraSupported ? (typeof data.maxCameraSupported === 'string' ? parseInt(data.maxCameraSupported, 10) : data.maxCameraSupported) : null,
        maxWireInMeter: data.maxWireInMeter ? (typeof data.maxWireInMeter === 'string' ? parseFloat(data.maxWireInMeter) : data.maxWireInMeter) : null,
      },
    });

    return NextResponse.json({ product });
  } catch (error: any) {
    console.error("Error creating product:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      meta: error.meta,
    });
    return NextResponse.json(
      { 
        error: error.message || "Failed to create product",
        details: error.meta || null,
      },
      { status: 500 }
    );
  }
}

