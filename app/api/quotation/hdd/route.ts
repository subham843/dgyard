import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public API - Get HDD products based on QuotationHddSetting configuration
// Cache for 1 hour (3600 seconds)
export const revalidate = 3600;

export async function GET() {
  try {
    // Get active HDD settings from QuotationHddSetting
    const hddSettings = await prisma.quotationHddSetting.findMany({
      where: {
        active: true,
      },
      include: {
        category: true,
        subCategory: true,
        territoryCategories: {
          include: {
            territoryCategory: true,
          },
        },
      },
    });

    console.log(`Found ${hddSettings.length} active HDD settings`);
    
    // Log each setting for debugging
    hddSettings.forEach((setting, index) => {
      console.log(`Setting ${index + 1}:`, {
        id: setting.id,
        category: setting.category?.name,
        subCategory: setting.subCategory?.name,
        territoryCategoriesCount: setting.territoryCategories?.length || 0,
      });
    });

    if (hddSettings.length === 0) {
      // Fallback to default: Hard Disk -> Surveillance
      const hardDiskCategory = await prisma.category.findFirst({
        where: {
          OR: [
            { name: { contains: "Hard Disk", mode: "insensitive" } },
            { slug: { contains: "hard-disk", mode: "insensitive" } },
          ],
          active: true,
          enableForQuotation: true,
        },
      });

      if (!hardDiskCategory) {
        return NextResponse.json({ hddProducts: [] });
      }

      const surveillanceSubCategory = await prisma.subCategory.findFirst({
        where: {
          categoryId: hardDiskCategory.id,
          OR: [
            { name: { contains: "Surveillance", mode: "insensitive" } },
          ],
          active: true,
          enableForQuotation: true,
        },
      });

      if (!surveillanceSubCategory) {
        return NextResponse.json({ hddProducts: [] });
      }

      const hddProducts = await prisma.product.findMany({
        where: {
          subCategoryId: surveillanceSubCategory.id,
          active: true,
          enableForQuotation: true,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          description: true,
          specifications: true,
          images: true,
        },
        orderBy: {
          price: "asc",
        },
      });

      return NextResponse.json(
        { hddProducts },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
          },
        }
      );
    }

    // Get products based on all configured HDD settings
    const allHddProducts = await Promise.all(
      hddSettings.map(async (setting) => {
        // Get all products for this category and subcategory
        // Show all active products from the configured category/subcategory
        const where: any = {
          categoryId: setting.categoryId,
          subCategoryId: setting.subCategoryId,
          active: true,
        };

        // First try to get products with enableForQuotation = true
        let products = await prisma.product.findMany({
          where: {
            ...where,
            enableForQuotation: true,
          },
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            description: true,
            specifications: true,
            images: true,
            active: true,
            enableForQuotation: true,
          },
          orderBy: {
            price: "asc",
          },
        });

        // If no products found, get all active products (without enableForQuotation filter)
        if (products.length === 0) {
          products = await prisma.product.findMany({
            where,
            select: {
              id: true,
              name: true,
              slug: true,
              price: true,
              description: true,
              specifications: true,
              images: true,
              active: true,
              enableForQuotation: true,
            },
            orderBy: {
              price: "asc",
            },
          });
          console.log(`Found ${products.length} active products (without enableForQuotation filter)`);
        }

        if (products.length === 0) {
          console.warn(`⚠️ No products found for HDD Setting ${setting.id} (Category: ${setting.category?.name}, SubCategory: ${setting.subCategory?.name})`);
          
          // Try to find any products in this subcategory at all (including inactive)
          const allProducts = await prisma.product.findMany({
            where: {
              categoryId: setting.categoryId,
              subCategoryId: setting.subCategoryId,
            },
            select: {
              id: true,
              name: true,
              active: true,
              enableForQuotation: true,
            },
            take: 5,
          });
          
          if (allProducts.length > 0) {
            console.log(`Found ${allProducts.length} products (including inactive) in this subcategory:`, 
              allProducts.map(p => ({ name: p.name, active: p.active, enableForQuotation: p.enableForQuotation }))
            );
          } else {
            console.log(`❌ No products exist at all in this category/subcategory combination`);
          }
        }

        return products;
      })
    );

    // Flatten and deduplicate products
    const uniqueProducts = Array.from(
      new Map(
        allHddProducts.flat().map((product) => [product.id, product])
      ).values()
    );

    console.log(`Returning ${uniqueProducts.length} unique HDD products`);

    return NextResponse.json(
      { hddProducts: uniqueProducts },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );
  } catch (error) {
    console.error("Error fetching HDD products for quotation:", error);
    return NextResponse.json(
      { error: "Failed to fetch HDD products" },
      { status: 500 }
    );
  }
}

