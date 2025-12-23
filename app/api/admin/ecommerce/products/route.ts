import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email || "" },
      select: { role: true },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch products with seller info
    const products = await prisma.product.findMany({
      take: 100,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { name: true, id: true },
        },
      },
    });

    const [totalProducts, pendingProducts] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { status: "PENDING" } }),
    ]);

    return NextResponse.json({
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        sellerId: p.userId,
        sellerName: p.user?.name || "Unknown",
        category: p.categoryId || "Uncategorized",
        price: Number(p.price || 0),
        stock: Number(p.stock || 0),
        status: p.status || "PENDING",
        createdAt: p.createdAt,
        images: p.images || [],
      })),
      stats: {
        totalProducts,
        pendingProducts,
        pendingOrders: 0,
        totalOrders: 0,
        totalSellers: 0,
        activeSellers: 0,
        codRiskOrders: 0,
      },
    });
  } catch (error: any) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products", details: error.message },
      { status: 500 }
    );
  }
}


