import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Get product recommendations based on cart items (Upselling & Cross-selling)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ recommendations: [] });
    }

    // Get user's cart items
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: session.user.id },
      include: {
        product: {
          include: {
            brand: true,
            categoryRelation: true,
          },
        },
      },
    });

    if (cartItems.length === 0) {
      return NextResponse.json({ recommendations: [] });
    }

    // Analyze cart to find related products
    const recommendations: any[] = [];
    const addedProductIds = new Set(cartItems.map(item => item.productId));

    // Strategy 1: Find products from same brand
    const brands = [...new Set(cartItems.map(item => item.product.brand?.id).filter(Boolean))];
    if (brands.length > 0) {
      const brandProducts = await prisma.product.findMany({
        where: {
          brandId: { in: brands },
          id: { notIn: Array.from(addedProductIds) },
          active: true,
        },
        take: 3,
        orderBy: { price: "asc" },
        include: {
          brand: true,
          categoryRelation: true,
        },
      });
      recommendations.push(...brandProducts.map(p => ({ ...p, reason: "Same Brand" })));
    }

    // Strategy 2: Find products from same category
    const categories = [...new Set(cartItems.map(item => item.product.categoryRelation?.id).filter(Boolean))];
    if (categories.length > 0) {
      const categoryProducts = await prisma.product.findMany({
        where: {
          categoryRelation: { id: { in: categories } },
          id: { notIn: Array.from(addedProductIds) },
          active: true,
        },
        take: 3,
        orderBy: { price: "asc" },
        include: {
          brand: true,
          categoryRelation: true,
        },
      });
      recommendations.push(...categoryProducts.map(p => ({ ...p, reason: "Similar Category" })));
    }

    // Strategy 3: Find complementary products (e.g., if camera, suggest DVR/NVR)
    const hasCamera = cartItems.some(item => 
      item.product.name.toLowerCase().includes("camera") ||
      item.product.categoryRelation?.name.toLowerCase().includes("camera")
    );
    
    if (hasCamera) {
      const complementaryProducts = await prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: "DVR", mode: "insensitive" } },
            { name: { contains: "NVR", mode: "insensitive" } },
            { name: { contains: "HDD", mode: "insensitive" } },
            { name: { contains: "Storage", mode: "insensitive" } },
            { tags: { has: "recording" } },
            { tags: { has: "storage" } },
          ],
          id: { notIn: Array.from(addedProductIds) },
          active: true,
        },
        take: 3,
        orderBy: { price: "asc" },
        include: {
          brand: true,
          categoryRelation: true,
        },
      });
      recommendations.push(...complementaryProducts.map(p => ({ ...p, reason: "Complements Your Selection" })));
    }

    // Strategy 4: Find popular products (based on orders)
    const popularProducts = await prisma.product.findMany({
      where: {
        id: { notIn: Array.from(addedProductIds) },
        active: true,
        featured: true,
      },
      take: 2,
      orderBy: { price: "asc" },
      include: {
        brand: true,
        categoryRelation: true,
      },
    });
    recommendations.push(...popularProducts.map(p => ({ ...p, reason: "Popular Choice" })));

    // Remove duplicates and limit to 6 recommendations
    const uniqueRecommendations = Array.from(
      new Map(recommendations.map(item => [item.id, item])).values()
    ).slice(0, 6);

    return NextResponse.json({ recommendations: uniqueRecommendations });
  } catch (error) {
    console.error("Error fetching cart recommendations:", error);
    return NextResponse.json(
      { error: "Failed to fetch recommendations" },
      { status: 500 }
    );
  }
}












