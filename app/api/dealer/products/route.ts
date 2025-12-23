import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "DEALER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get dealer info
    const dealer = await prisma.dealer.findUnique({
      where: { userId: session.user.id },
    });

    if (!dealer) {
      return NextResponse.json({ error: "Dealer not found" }, { status: 404 });
    }

    // Note: Products currently don't have dealerId field
    // For now, return all products. Later, add dealerId to Product model
    const products = await prisma.product.findMany({
      include: {
        categoryRelation: { select: { id: true, name: true } },
        subCategory: { select: { id: true, name: true } },
        territoryCategory: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true } },
        _count: {
          select: {
            orderItems: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ products });
  } catch (error: any) {
    console.error("Error fetching dealer products:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "DEALER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const dealer = await prisma.dealer.findUnique({
      where: { userId: session.user.id },
    });

    if (!dealer) {
      return NextResponse.json({ error: "Dealer not found" }, { status: 404 });
    }

    const data = await request.json();

    // Generate slug if not provided
    let slug = data.slug || data.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    
    // Ensure slug is unique
    let existingProduct = await prisma.product.findUnique({ where: { slug } });
    let counter = 1;
    while (existingProduct) {
      slug = `${slug}-${counter}`;
      existingProduct = await prisma.product.findUnique({ where: { slug } });
      counter++;
    }

    const product = await prisma.product.create({
      data: {
        name: data.name,
        slug,
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
      include: {
        categoryRelation: { select: { id: true, name: true } },
        subCategory: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ product });
  } catch (error: any) {
    console.error("Error creating dealer product:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create product" },
      { status: 500 }
    );
  }
}





