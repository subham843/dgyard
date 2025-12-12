import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Get product suggestions based on quotation calculation
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get("brandId");
    const categoryId = searchParams.get("categoryId");
    const territoryCategoryId = searchParams.get("territoryCategoryId");
    const indoorCount = parseInt(searchParams.get("indoorCount") || "0");
    const outdoorCount = parseInt(searchParams.get("outdoorCount") || "0");
    const totalCameras = indoorCount + outdoorCount;
    const hddTerritoryCategoryId = searchParams.get("hddTerritoryCategoryId");
    const recordingDays = parseInt(searchParams.get("recordingDays") || "0");
    const wiringMeters = parseFloat(searchParams.get("wiringMeters") || "0");

    if (!brandId || !categoryId || !territoryCategoryId) {
      return NextResponse.json(
        { error: "Brand, Category, and Territory Category are required" },
        { status: 400 }
      );
    }

    const suggestions: any = {
      indoorCameras: [],
      outdoorCameras: [],
      recordingDevices: [],
      hddStorage: [],
      powerSupply: [],
      accessories: [],
    };

    // 1. Indoor Camera Products
    if (indoorCount > 0) {
      const indoorSubCategory = await prisma.subCategory.findFirst({
        where: {
          categoryId: categoryId,
          OR: [
            { name: { contains: "Indoor", mode: "insensitive" } },
            { slug: { contains: "indoor", mode: "insensitive" } },
          ],
          active: true,
          enableForQuotation: true,
        },
      });

      if (indoorSubCategory) {
        const indoorProducts = await prisma.product.findMany({
          where: {
            brandId: brandId,
            categoryId: categoryId,
            subCategoryId: indoorSubCategory.id,
            territoryCategoryId: territoryCategoryId,
            active: true,
            enableForQuotation: true,
          },
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            price: true,
            comparePrice: true,
            sku: true,
            images: true,
            brand: {
              select: {
                id: true,
                name: true,
                logo: true,
              },
            },
            categoryRelation: {
              select: {
                id: true,
                name: true,
              },
            },
            subCategory: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            price: "asc",
          },
        });
        suggestions.indoorCameras = indoorProducts;
      } else {
        // Fallback: get all products from category
        const allProducts = await prisma.product.findMany({
          where: {
            brandId: brandId,
            categoryId: categoryId,
            territoryCategoryId: territoryCategoryId,
            active: true,
            enableForQuotation: true,
          },
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            price: true,
            comparePrice: true,
            sku: true,
            images: true,
            brand: {
              select: {
                id: true,
                name: true,
                logo: true,
              },
            },
            categoryRelation: {
              select: {
                id: true,
                name: true,
              },
            },
            subCategory: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            price: "asc",
          },
          take: 20,
        });
        suggestions.indoorCameras = allProducts;
      }
    }

    // 2. Outdoor Camera Products
    if (outdoorCount > 0) {
      const outdoorSubCategory = await prisma.subCategory.findFirst({
        where: {
          categoryId: categoryId,
          OR: [
            { name: { contains: "Outdoor", mode: "insensitive" } },
            { slug: { contains: "outdoor", mode: "insensitive" } },
          ],
          active: true,
          enableForQuotation: true,
        },
      });

      if (outdoorSubCategory) {
        const outdoorProducts = await prisma.product.findMany({
          where: {
            brandId: brandId,
            categoryId: categoryId,
            subCategoryId: outdoorSubCategory.id,
            territoryCategoryId: territoryCategoryId,
            active: true,
            enableForQuotation: true,
          },
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            price: true,
            comparePrice: true,
            sku: true,
            images: true,
            brand: {
              select: {
                id: true,
                name: true,
                logo: true,
              },
            },
            categoryRelation: {
              select: {
                id: true,
                name: true,
              },
            },
            subCategory: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            price: "asc",
          },
        });
        suggestions.outdoorCameras = outdoorProducts;
      }
    }

    // 3. Recording Device Products (DVR/NVR)
    if (totalCameras > 0) {
      try {
        const selectedCategory = await prisma.category.findUnique({
          where: { id: categoryId },
          select: { id: true, name: true, slug: true },
        });

        if (selectedCategory) {
          const isHD = selectedCategory.name.toLowerCase().includes("hd") || 
                       selectedCategory.name.toLowerCase().includes("analog") ||
                       selectedCategory.slug.toLowerCase().includes("hd") ||
                       selectedCategory.slug.toLowerCase().includes("analog");
          
          const deviceSubCategoryName = isHD ? "DVR" : "NVR";
          const deviceCategoryName = "Recording Devices";

          const recordingDeviceCategory = await prisma.category.findFirst({
            where: {
              OR: [
                { name: { contains: deviceCategoryName, mode: "insensitive" } },
                { name: { contains: "Recording", mode: "insensitive" } },
              ],
              active: true,
            },
          });

          if (recordingDeviceCategory) {
            const deviceSubCategory = await prisma.subCategory.findFirst({
              where: {
                categoryId: recordingDeviceCategory.id,
                OR: [
                  { name: { contains: deviceSubCategoryName, mode: "insensitive" } },
                ],
                active: true,
              },
            });

            if (deviceSubCategory) {
              const recordingDeviceProducts = await prisma.product.findMany({
                where: {
                  categoryId: recordingDeviceCategory.id,
                  subCategoryId: deviceSubCategory.id,
                  active: true,
                  enableForQuotation: true,
                  AND: [
                    {
                      OR: [
                        {
                          originalResolutionSupport: {
                            has: territoryCategoryId,
                          },
                        },
                        {
                          compatibleResolutionSupport: {
                            has: territoryCategoryId,
                          },
                        },
                      ],
                    },
                    {
                      OR: [
                        { maxCameraSupport: null },
                        { maxCameraSupport: { gte: totalCameras } },
                      ],
                    },
                  ],
                },
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  description: true,
                  price: true,
                  comparePrice: true,
                  sku: true,
                  images: true,
                  brand: {
                    select: {
                      id: true,
                      name: true,
                      logo: true,
                    },
                  },
                  categoryRelation: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                  subCategory: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
                orderBy: {
                  price: "asc",
                },
              });
              suggestions.recordingDevices = recordingDeviceProducts;
            }
          }
        }
      } catch (error) {
        console.error("Error fetching recording devices:", error);
      }
    }

    // 4. HDD Storage Products
    if (hddTerritoryCategoryId) {
      const hddSettings = await prisma.quotationHddSetting.findFirst({
        where: {
          active: true,
          territoryCategories: {
            some: {
              territoryCategoryId: hddTerritoryCategoryId,
            },
          },
        },
        include: {
          category: true,
          subCategory: true,
        },
      });

      if (hddSettings) {
        const hddProducts = await prisma.product.findMany({
          where: {
            categoryId: hddSettings.categoryId,
            subCategoryId: hddSettings.subCategoryId,
            territoryCategoryId: hddTerritoryCategoryId,
            active: true,
            enableForQuotation: true,
          },
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            price: true,
            comparePrice: true,
            sku: true,
            images: true,
            brand: {
              select: {
                id: true,
                name: true,
                logo: true,
              },
            },
            categoryRelation: {
              select: {
                id: true,
                name: true,
              },
            },
            subCategory: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            price: "asc",
          },
        });
        suggestions.hddStorage = hddProducts;
      }
    }

    // 5. Power Supply Products
    if (totalCameras > 0 && wiringMeters > 0) {
      try {
        const powerSupplySettings = await prisma.quotationPowerSupplySetting.findMany({
          where: {
            cameraTypeId: categoryId,
            active: true,
          },
          include: {
            category: true,
            subCategory: true,
          },
          take: 1,
        });

        if (powerSupplySettings.length > 0) {
          const bestSetting = powerSupplySettings[0];
          const powerSupplyProducts = await prisma.product.findMany({
            where: {
              categoryId: bestSetting.categoryId,
              subCategoryId: bestSetting.subCategoryId || undefined,
              active: true,
              enableForQuotation: true,
              AND: [
                {
                  megapixelSupported: {
                    has: territoryCategoryId,
                  },
                },
                {
                  OR: [
                    { maxCameraSupported: null },
                    { maxCameraSupported: { gte: totalCameras } },
                  ],
                },
                {
                  OR: [
                    { maxWireInMeter: null },
                    { maxWireInMeter: { gte: wiringMeters } },
                  ],
                },
              ],
            },
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
              price: true,
              comparePrice: true,
              sku: true,
              images: true,
              brand: {
                select: {
                  id: true,
                  name: true,
                  logo: true,
                },
              },
              categoryRelation: {
                select: {
                  id: true,
                  name: true,
                },
              },
              subCategory: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            orderBy: {
              price: "asc",
            },
          });
          suggestions.powerSupply = powerSupplyProducts;
        }
      } catch (error) {
        console.error("Error fetching power supply:", error);
      }
    }

    // 6. Accessories (from settings)
    if (totalCameras > 0) {
      try {
        const accessoriesSettings = await prisma.quotationAccessoriesSetting.findMany({
          where: {
            cameraTypeId: categoryId,
            active: true,
          },
          include: {
            items: {
              orderBy: {
                createdAt: "asc",
              },
            },
          },
          take: 1,
        });

        if (accessoriesSettings.length > 0) {
          const bestSetting = accessoriesSettings[0];
          const normalItems = bestSetting.items.filter((item) => !item.isCableLengthBased);
          const cableLengthBasedItems = bestSetting.items.filter((item) => item.isCableLengthBased);

          let applicableCableLengthItems: typeof cableLengthBasedItems = [];
          if (wiringMeters > 0 && cableLengthBasedItems.length > 0) {
            const validItems = cableLengthBasedItems.filter((item) => 
              item.maxCableInMeter && wiringMeters <= item.maxCableInMeter
            );
            if (validItems.length > 0) {
              validItems.sort((a, b) => {
                const aDiff = (a.maxCableInMeter || 0) - wiringMeters;
                const bDiff = (b.maxCableInMeter || 0) - wiringMeters;
                return aDiff - bDiff;
              });
              applicableCableLengthItems = [validItems[0]];
            }
          }

          const applicableItems = [...normalItems, ...applicableCableLengthItems];
          
          // Note: Accessories are items from settings, not products
          // We'll return them as a list for display
          suggestions.accessories = applicableItems.map((item) => ({
            id: item.id,
            name: item.itemName,
            price: item.rate,
            quantity: item.quantity,
            isCableLengthBased: item.isCableLengthBased,
          }));
        }
      } catch (error) {
        console.error("Error fetching accessories:", error);
      }
    }

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("Error fetching suggestions:", error);
    return NextResponse.json(
      { error: "Failed to fetch suggestions" },
      { status: 500 }
    );
  }
}












