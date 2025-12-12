import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Public API - Calculate quotation with minimum price products
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

    const result: any = {
      indoorCamera: null,
      outdoorCamera: null,
      recordingDevice: null,
      powerSupply: null,
      accessories: [],
      hddStorage: null,
      wiring: null,
      installation: null,
      totalPrice: 0,
    };

    // Find minimum price indoor camera product
    if (indoorCount > 0) {
      // Try to find "Indoor" subcategory first
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
            price: true,
          },
          orderBy: {
            price: "asc",
          },
          take: 1,
        });

        if (indoorProducts.length > 0) {
          const minProduct = indoorProducts[0];
          result.indoorCamera = {
            productId: minProduct.id,
            productName: minProduct.name,
            price: minProduct.price,
            quantity: indoorCount,
            total: minProduct.price * indoorCount,
          };
          result.totalPrice += result.indoorCamera.total;
        }
      }
    }

    // Find minimum price outdoor camera product
    if (outdoorCount > 0) {
      // Try to find "Outdoor" subcategory first
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
            price: true,
          },
          orderBy: {
            price: "asc",
          },
          take: 1,
        });

        if (outdoorProducts.length > 0) {
          const minProduct = outdoorProducts[0];
          result.outdoorCamera = {
            productId: minProduct.id,
            productName: minProduct.name,
            price: minProduct.price,
            quantity: outdoorCount,
            total: minProduct.price * outdoorCount,
          };
          result.totalPrice += result.outdoorCamera.total;
        }
      }
    }

    // If subcategories not found, use general category products
    if ((indoorCount > 0 && !result.indoorCamera) || (outdoorCount > 0 && !result.outdoorCamera)) {
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
          price: true,
        },
        orderBy: {
          price: "asc",
        },
        take: 1,
      });

      if (allProducts.length > 0) {
        const minProduct = allProducts[0];
        const minPrice = minProduct.price;

        if (indoorCount > 0 && !result.indoorCamera) {
          result.indoorCamera = {
            productId: minProduct.id,
            productName: minProduct.name,
            price: minPrice,
            quantity: indoorCount,
            total: minPrice * indoorCount,
          };
          result.totalPrice += result.indoorCamera.total;
        }

        if (outdoorCount > 0 && !result.outdoorCamera) {
          result.outdoorCamera = {
            productId: minProduct.id,
            productName: minProduct.name,
            price: minPrice,
            quantity: outdoorCount,
            total: minPrice * outdoorCount,
          };
          result.totalPrice += result.outdoorCamera.total;
        }
      }
    }

    // Recording Device Auto-calculation
    if (totalCameras > 0) {
      try {
        // Get category to determine camera type (HD or IP)
        const selectedCategory = await prisma.category.findUnique({
          where: { id: categoryId },
          select: { id: true, name: true, slug: true },
        });

        console.log("Recording Device Calculation - Selected Category:", selectedCategory?.name);

        if (selectedCategory) {
          // Determine if HD (DVR) or IP (NVR) based on category name/slug
          const isHD = selectedCategory.name.toLowerCase().includes("hd") || 
                       selectedCategory.name.toLowerCase().includes("analog") ||
                       selectedCategory.slug.toLowerCase().includes("hd") ||
                       selectedCategory.slug.toLowerCase().includes("analog");
          
          const deviceSubCategoryName = isHD ? "DVR" : "NVR";
          const deviceCategoryName = "Recording Devices"; // or similar

          console.log("Recording Device - Camera Type:", isHD ? "HD (DVR)" : "IP (NVR)");
          console.log("Recording Device - Looking for:", deviceCategoryName, "->", deviceSubCategoryName);

          // Find Recording Device category
          const recordingDeviceCategory = await prisma.category.findFirst({
            where: {
              OR: [
                { name: { contains: deviceCategoryName, mode: "insensitive" } },
                { name: { contains: "Recording", mode: "insensitive" } },
              ],
              active: true,
            },
          });

          console.log("Recording Device Category found:", recordingDeviceCategory?.name);

          if (recordingDeviceCategory) {
            // Find DVR or NVR subcategory
            const deviceSubCategory = await prisma.subCategory.findFirst({
              where: {
                categoryId: recordingDeviceCategory.id,
                OR: [
                  { name: { contains: deviceSubCategoryName, mode: "insensitive" } },
                  { name: { contains: deviceSubCategoryName.toLowerCase(), mode: "insensitive" } },
                ],
                active: true,
              },
            });

            if (deviceSubCategory) {
              console.log("Recording Device SubCategory found:", deviceSubCategory.name);
              console.log("Looking for settings with:", {
                cameraTypeId: categoryId,
                categoryId: recordingDeviceCategory.id,
                subCategoryId: deviceSubCategory.id,
                totalCameras: totalCameras,
                territoryCategoryId: territoryCategoryId
              });

              // First, check if any settings exist at all for this category/subcategory
              const allSettingsForCategory = await prisma.quotationRecordingDeviceSetting.findMany({
                where: {
                  categoryId: recordingDeviceCategory.id,
                  subCategoryId: deviceSubCategory.id,
                  active: true,
                },
                include: {
                  cameraType: true,
                  territoryCategories: {
                    include: {
                      territoryCategory: true,
                    },
                  },
                },
                take: 5,
              });

              console.log(`Total settings for ${deviceSubCategoryName} category/subcategory:`, allSettingsForCategory.length);
              if (allSettingsForCategory.length > 0) {
                console.log("Sample settings found:", JSON.stringify(allSettingsForCategory.map(s => ({
                  id: s.id,
                  cameraTypeId: s.cameraTypeId,
                  cameraTypeName: s.cameraType?.name,
                  territoryCategoryIds: s.territoryCategories.map(tc => tc.territoryCategoryId),
                  territoryCategoryNames: s.territoryCategories.map(tc => tc.territoryCategory?.name),
                })), null, 2));
                
                // Check if any setting has matching cameraTypeId or territoryCategoryId
                const matchingCameraType = allSettingsForCategory.filter(s => s.cameraTypeId === categoryId);
                const matchingTerritory = allSettingsForCategory.filter(s => 
                  s.territoryCategories.some(tc => tc.territoryCategoryId === territoryCategoryId)
                );
                console.log(`Settings with matching cameraTypeId (${categoryId}):`, matchingCameraType.length);
                console.log(`Settings with matching territoryCategoryId (${territoryCategoryId}):`, matchingTerritory.length);
              } else {
                console.log("⚠️ WARNING: No Recording Device Settings exist for this DVR category/subcategory!");
                console.log("Please create settings in Admin Panel: Quotation Settings → Recording Device Configure");
              }

              // Find Recording Device Settings matching:
              // 1. cameraTypeId matches selected category (camera type) OR is null (applies to all)
              // 2. category is Recording Devices
              // 3. subCategory is DVR/NVR
              const recordingDeviceSettings = await prisma.quotationRecordingDeviceSetting.findMany({
                where: {
                  AND: [
                    {
                      OR: [
                        { cameraTypeId: categoryId }, // Match camera type
                        { cameraTypeId: null }, // Or null (applies to all camera types)
                      ],
                    },
                    {
                      categoryId: recordingDeviceCategory.id,
                      subCategoryId: deviceSubCategory.id,
                      active: true,
                    },
                  ],
                },
                include: {
                  cameraType: true,
                  category: true,
                  subCategory: true,
                  territoryCategories: {
                    include: {
                      territoryCategory: true,
                    },
                  },
                },
              });

              console.log("Recording Device Settings found matching criteria:", recordingDeviceSettings.length);

              // If no match with cameraTypeId, try without cameraTypeId requirement
              let bestSettings = recordingDeviceSettings;
              if (recordingDeviceSettings.length === 0) {
                console.log("No match found with cameraTypeId, trying without cameraTypeId requirement...");
                const flexibleSettings = await prisma.quotationRecordingDeviceSetting.findMany({
                  where: {
                    categoryId: recordingDeviceCategory.id,
                    subCategoryId: deviceSubCategory.id,
                    active: true,
                  },
                  include: {
                    cameraType: true,
                    category: true,
                    subCategory: true,
                    territoryCategories: {
                      include: {
                        territoryCategory: true,
                      },
                    },
                  },
                });

                console.log("Flexible search (without cameraTypeId) found:", flexibleSettings.length, "settings");
                if (flexibleSettings.length > 0) {
                  bestSettings = flexibleSettings;
                  console.log("Using settings that match category/subcategory");
                }
              }

              if (bestSettings.length > 0) {
                const bestSetting = bestSettings[0];

                console.log("✅ Best Recording Device Setting Selected:");
                console.log("   - Setting ID:", bestSetting.id);
                console.log("   - Category:", bestSetting.category?.name);
                console.log("   - SubCategory:", bestSetting.subCategory?.name);
                console.log("   - Territory Categories:", bestSetting.territoryCategories?.map(tc => tc.territoryCategory?.name).join(", ") || "None");
                console.log("   - Camera Type:", bestSetting.cameraType?.name || "All camera types");

                // Search products using originalResolutionSupport or compatibleResolutionSupport
                // The selected territoryCategoryId (camera resolution) should be in one of these arrays
                console.log("Searching for Recording Device products with:");
                console.log("  - categoryId:", bestSetting.categoryId);
                console.log("  - subCategoryId:", bestSetting.subCategoryId);
                console.log("  - resolution (territoryCategoryId):", territoryCategoryId);
                console.log("  - Check in: originalResolutionSupport OR compatibleResolutionSupport arrays");

                // Find products where the selected resolution is in originalResolutionSupport or compatibleResolutionSupport
                // AND maxCameraSupport >= totalCameras (if maxCameraSupport is set)
                // Fetch multiple products to sort properly
                const recordingDeviceProducts = await prisma.product.findMany({
                  where: {
                    categoryId: bestSetting.categoryId,
                    subCategoryId: bestSetting.subCategoryId,
                    active: true,
                    enableForQuotation: true,
                    AND: [
                      {
                        OR: [
                          {
                            originalResolutionSupport: {
                              has: territoryCategoryId, // Check if array contains the resolution
                            },
                          },
                          {
                            compatibleResolutionSupport: {
                              has: territoryCategoryId, // Check if array contains the resolution
                            },
                          },
                        ],
                      },
                      {
                        OR: [
                          { maxCameraSupport: null }, // No limit (supports any number)
                          { maxCameraSupport: { gte: totalCameras } }, // Max Camera Support >= total cameras
                        ],
                      },
                    ],
                  },
                  select: {
                    id: true,
                    name: true,
                    price: true,
                    images: true,
                    originalResolutionSupport: true,
                    compatibleResolutionSupport: true,
                    maxCameraSupport: true,
                  },
                });

                console.log("Recording Device Products found:", recordingDeviceProducts.length);
                console.log("Filter criteria:");
                console.log("  - Total cameras:", totalCameras);
                console.log("  - maxCameraSupport filter: null OR >= ", totalCameras);
                
                if (recordingDeviceProducts.length > 0) {
                  // Sort products: prefer products with maxCameraSupport (ascending), then by price
                  // Products with null maxCameraSupport (unlimited) should be considered last
                  const sortedProducts = [...recordingDeviceProducts].sort((a, b) => {
                    // If both have maxCameraSupport, sort by it (ascending) - smallest suitable device first
                    if (a.maxCameraSupport !== null && b.maxCameraSupport !== null) {
                      if (a.maxCameraSupport !== b.maxCameraSupport) {
                        return a.maxCameraSupport - b.maxCameraSupport;
                      }
                      // If maxCameraSupport is same, sort by price (ascending)
                      return a.price - b.price;
                    }
                    // If one is null and one is not, prefer the one with maxCameraSupport (specific limit)
                    if (a.maxCameraSupport !== null && b.maxCameraSupport === null) {
                      return -1;
                    }
                    if (a.maxCameraSupport === null && b.maxCameraSupport !== null) {
                      return 1;
                    }
                    // Both are null (unlimited), sort by price (ascending)
                    return a.price - b.price;
                  });
                  
                  const minDevice = sortedProducts[0];
                  console.log("✅ Best Recording Device Product Selected:");
                  console.log("   - Product:", minDevice.name);
                  console.log("   - Price:", minDevice.price);
                  console.log("   - Max Camera Support:", minDevice.maxCameraSupport || "unlimited");
                  console.log("   - User's total cameras:", totalCameras);
                  console.log("   - Original Resolution Support:", minDevice.originalResolutionSupport);
                  console.log("   - Compatible Resolution Support:", minDevice.compatibleResolutionSupport);
                  
                  result.recordingDevice = {
                    productId: minDevice.id,
                    productName: minDevice.name,
                    price: minDevice.price,
                    quantity: 1,
                    total: minDevice.price,
                    deviceType: deviceSubCategoryName,
                    maxCameraSupport: minDevice.maxCameraSupport,
                  };
                  result.totalPrice += result.recordingDevice.total;
                  console.log("✅ Recording Device added to result:", result.recordingDevice);
                  console.log("Updated totalPrice:", result.totalPrice);
                } else {
                  console.log("❌ No recording device products found matching criteria");
                  console.log("   Searched for products where:");
                  console.log("   - categoryId:", bestSetting.categoryId);
                  console.log("   - subCategoryId:", bestSetting.subCategoryId);
                  console.log("   - originalResolutionSupport OR compatibleResolutionSupport contains:", territoryCategoryId);
                  console.log("   - maxCameraSupport: null OR >= ", totalCameras, "(total cameras)");
                  console.log("   💡 TIP: Add DVR/NVR products with:");
                  console.log("      - Selected resolution in 'Original / True Resolution Support' or 'Compatible / Supported Resolution' fields");
                  console.log("      - maxCameraSupport >= ", totalCameras, "in 'Max Number of Camera Support' field");
                }
              } else {
                console.log("❌ No recording device settings found matching criteria");
                console.log("📋 SUMMARY: Recording Device not added because:");
                console.log("   - Looking for cameraTypeId:", categoryId);
                console.log("   - Looking for categoryId:", recordingDeviceCategory.id);
                console.log("   - Looking for subCategoryId:", deviceSubCategory.id);
                console.log("   - Looking for territoryCategoryId:", territoryCategoryId);
                console.log("   - Total cameras:", totalCameras);
                console.log("   - Settings exist in database:", allSettingsForCategory.length > 0 ? "YES" : "NO");
                if (allSettingsForCategory.length > 0) {
                  console.log("   - But none match the required criteria");
                  console.log("   💡 TIP: Check if settings have matching cameraTypeId and territoryCategoryId");
                } else {
                  console.log("   💡 ACTION REQUIRED: Create Recording Device Settings in Admin Panel");
                  console.log("      Path: Admin Panel → Quotation Settings → Recording Device Configure");
                }
              }
            } else {
              console.log("Recording Device SubCategory not found:", deviceSubCategoryName);
              console.log("Please ensure 'DVR (Digital Video Recorder)' subcategory exists under 'Recording Devices' category");
            }
          } else {
            console.log("Recording Device Category not found:", deviceCategoryName);
            console.log("Please ensure 'Recording Devices' category exists in the database");
          }
        } else {
          console.log("Selected Category not found or no cameras selected");
        }
      } catch (error) {
        console.error("Error calculating recording device:", error);
        console.error("Error details:", error instanceof Error ? error.message : String(error));
        // Continue without recording device if error occurs
      }
    }

    // Power Supply Auto-calculation
    if (totalCameras > 0 && wiringMeters > 0) {
      try {
        console.log("Power Supply Calculation - Starting");
        console.log("  - Camera Type (categoryId):", categoryId);
        console.log("  - Resolution (territoryCategoryId):", territoryCategoryId);
        console.log("  - Total Cameras:", totalCameras);
        console.log("  - Wire Length (meters):", wiringMeters);

        // Find Power Supply Settings matching cameraTypeId
        const powerSupplySettings = await prisma.quotationPowerSupplySetting.findMany({
          where: {
            cameraTypeId: categoryId,
            active: true,
          },
          include: {
            cameraType: true,
            category: true,
            subCategory: true,
            territoryCategories: {
              include: {
                territoryCategory: true,
              },
            },
          },
        });

        console.log("Power Supply Settings found:", powerSupplySettings.length);

        if (powerSupplySettings.length > 0) {
          // Use the first matching setting
          const bestSetting = powerSupplySettings[0];

          console.log("✅ Best Power Supply Setting Selected:");
          console.log("   - Setting ID:", bestSetting.id);
          console.log("   - Category:", bestSetting.category?.name);
          console.log("   - SubCategory:", bestSetting.subCategory?.name || "None");
          console.log("   - Camera Type:", bestSetting.cameraType?.name || "All camera types");

          // Find products matching:
          // 1. categoryId and subCategoryId from settings
          // 2. megapixelSupported contains territoryCategoryId (resolution)
          // 3. maxCameraSupported >= totalCameras (if set)
          // 4. maxWireInMeter >= wiringMeters (if set)
          console.log("Searching for Power Supply products with:");
          console.log("  - categoryId:", bestSetting.categoryId);
          console.log("  - subCategoryId:", bestSetting.subCategoryId || "null");
          console.log("  - megapixelSupported contains:", territoryCategoryId);
          console.log("  - maxCameraSupported: null OR >= ", totalCameras);
          console.log("  - maxWireInMeter: null OR >= ", wiringMeters);

          const powerSupplyProducts = await prisma.product.findMany({
            where: {
              categoryId: bestSetting.categoryId,
              subCategoryId: bestSetting.subCategoryId || undefined,
              active: true,
              enableForQuotation: true,
              AND: [
                {
                  megapixelSupported: {
                    has: territoryCategoryId, // Check if array contains the resolution
                  },
                },
                {
                  OR: [
                    { maxCameraSupported: null }, // No limit (supports any number)
                    { maxCameraSupported: { gte: totalCameras } }, // Max Camera Supported >= total cameras
                  ],
                },
                {
                  OR: [
                    { maxWireInMeter: null }, // No limit (supports any wire length)
                    { maxWireInMeter: { gte: wiringMeters } }, // Max Wire in Meter >= wire length
                  ],
                },
              ],
            },
            select: {
              id: true,
              name: true,
              price: true,
              images: true,
              megapixelSupported: true,
              maxCameraSupported: true,
              maxWireInMeter: true,
            },
          });

          console.log("Power Supply Products found:", powerSupplyProducts.length);

          if (powerSupplyProducts.length > 0) {
            // Sort products: prefer products with specific limits (maxCameraSupported and maxWireInMeter), then by price
            // Products with null limits (unlimited) should be considered last
            const sortedProducts = [...powerSupplyProducts].sort((a, b) => {
              // If both have maxCameraSupported, sort by it (ascending) - smallest suitable device first
              if (a.maxCameraSupported !== null && b.maxCameraSupported !== null) {
                if (a.maxCameraSupported !== b.maxCameraSupported) {
                  return a.maxCameraSupported - b.maxCameraSupported;
                }
              }
              // If one is null and one is not, prefer the one with maxCameraSupported (specific limit)
              if (a.maxCameraSupported !== null && b.maxCameraSupported === null) {
                return -1;
              }
              if (a.maxCameraSupported === null && b.maxCameraSupported !== null) {
                return 1;
              }
              // If both have maxWireInMeter, sort by it (ascending)
              if (a.maxWireInMeter !== null && b.maxWireInMeter !== null) {
                if (a.maxWireInMeter !== b.maxWireInMeter) {
                  return a.maxWireInMeter - b.maxWireInMeter;
                }
              }
              // If one is null and one is not, prefer the one with maxWireInMeter (specific limit)
              if (a.maxWireInMeter !== null && b.maxWireInMeter === null) {
                return -1;
              }
              if (a.maxWireInMeter === null && b.maxWireInMeter !== null) {
                return 1;
              }
              // Both are null (unlimited) or same limits, sort by price (ascending)
              return a.price - b.price;
            });

            const bestProduct = sortedProducts[0];
            console.log("✅ Best Power Supply Product Selected:");
            console.log("   - Product:", bestProduct.name);
            console.log("   - Price:", bestProduct.price);
            console.log("   - Max Camera Supported:", bestProduct.maxCameraSupported || "unlimited");
            console.log("   - Max Wire in Meter:", bestProduct.maxWireInMeter || "unlimited");
            console.log("   - User's total cameras:", totalCameras);
            console.log("   - User's wire length:", wiringMeters);
            console.log("   - Megapixel Supported:", bestProduct.megapixelSupported);

            result.powerSupply = {
              productId: bestProduct.id,
              productName: bestProduct.name,
              price: bestProduct.price,
              quantity: 1,
              total: bestProduct.price,
              maxCameraSupported: bestProduct.maxCameraSupported,
              maxWireInMeter: bestProduct.maxWireInMeter,
            };
            result.totalPrice += result.powerSupply.total;
            console.log("✅ Power Supply added to result:", result.powerSupply);
            console.log("Updated totalPrice:", result.totalPrice);
          } else {
            console.log("❌ No power supply products found matching criteria");
            console.log("   Searched for products where:");
            console.log("   - categoryId:", bestSetting.categoryId);
            console.log("   - subCategoryId:", bestSetting.subCategoryId || "null");
            console.log("   - megapixelSupported contains:", territoryCategoryId);
            console.log("   - maxCameraSupported: null OR >= ", totalCameras);
            console.log("   - maxWireInMeter: null OR >= ", wiringMeters);
            console.log("   💡 TIP: Add Power Supply products with:");
            console.log("      - Selected resolution in 'Megapixel Supported' field");
            console.log("      - maxCameraSupported >= ", totalCameras, "in 'Maximum Number of Camera Supported' field");
            console.log("      - maxWireInMeter >= ", wiringMeters, "in 'Max Wire in Meter' field");
          }
        } else {
          console.log("❌ No power supply settings found matching criteria");
          console.log("   - Looking for cameraTypeId:", categoryId);
          console.log("   💡 ACTION REQUIRED: Create Power Supply Settings in Admin Panel");
          console.log("      Path: Admin Panel → Quotation Settings → Configure Power Supply");
        }
      } catch (error) {
        console.error("Error calculating power supply:", error);
        console.error("Error details:", error instanceof Error ? error.message : String(error));
        // Continue without power supply if error occurs
      }
    }

    // Accessories Auto-calculation
    if (totalCameras > 0) {
      try {
        console.log("Accessories Calculation - Starting");
        console.log("  - Camera Type (categoryId):", categoryId);
        console.log("  - Wire Length (meters):", wiringMeters);

        // Find Accessories Settings matching cameraTypeId
        const accessoriesSettings = await prisma.quotationAccessoriesSetting.findMany({
          where: {
            cameraTypeId: categoryId,
            active: true,
          },
          include: {
            cameraType: {
              select: {
                id: true,
                name: true,
              },
            },
            items: {
              orderBy: {
                createdAt: "asc",
              },
            },
          },
        });

        console.log("Accessories Settings found:", accessoriesSettings.length);

        if (accessoriesSettings.length > 0) {
          // Use the first matching setting
          const bestSetting = accessoriesSettings[0];

          console.log("✅ Best Accessories Setting Selected:");
          console.log("   - Setting ID:", bestSetting.id);
          console.log("   - Camera Type:", bestSetting.cameraType?.name);

          // Filter items based on cable length
          // 1. Normal items (isCableLengthBased = false) - always include
          // 2. Cable length based items (isCableLengthBased = true) - include only if wiringMeters matches exactly or is within range
          const normalItems = bestSetting.items.filter((item) => !item.isCableLengthBased);
          const cableLengthBasedItems = bestSetting.items.filter((item) => item.isCableLengthBased);

          let applicableCableLengthItems: typeof cableLengthBasedItems = [];

          if (wiringMeters > 0 && cableLengthBasedItems.length > 0) {
            // Find the best matching cable length based item
            // Priority: exact match > closest match (where wiringMeters <= maxCableInMeter)
            const validItems = cableLengthBasedItems.filter((item) => 
              item.maxCableInMeter && wiringMeters <= item.maxCableInMeter
            );

            if (validItems.length > 0) {
              // Sort by maxCableInMeter (ascending) to get the closest match
              validItems.sort((a, b) => {
                const aDiff = (a.maxCableInMeter || 0) - wiringMeters;
                const bDiff = (b.maxCableInMeter || 0) - wiringMeters;
                // Prefer items where maxCableInMeter is closest to wiringMeters (but >= wiringMeters)
                return aDiff - bDiff;
              });

              // Take only the best matching item (closest to user's cable length)
              applicableCableLengthItems = [validItems[0]];
            }
          }

          // Combine normal items and applicable cable length based items
          const applicableItems = [...normalItems, ...applicableCableLengthItems];

          console.log("Accessories Items found:", applicableItems.length);
          console.log("  - Total items in setting:", bestSetting.items.length);
          console.log("  - Normal items:", normalItems.length);
          console.log("  - Cable length based items:", cableLengthBasedItems.length);
          console.log("  - User cable length:", wiringMeters, "meters");
          console.log("  - Applicable cable length based items:", applicableCableLengthItems.length);
          console.log("  - Total applicable items after filtering:", applicableItems.length);

          if (applicableItems.length > 0) {
            const accessoriesList = applicableItems.map((item) => {
              // For normal items (not cable length based), multiply quantity by total cameras
              // For cable length based items, use quantity as is
              let finalQuantity = item.quantity;
              if (!item.isCableLengthBased && totalCameras > 0) {
                finalQuantity = item.quantity * totalCameras;
                console.log(`  - Normal Item: ${item.itemName}, Original Qty: ${item.quantity}, Multiplied by ${totalCameras} cameras = ${finalQuantity}`);
              } else {
                console.log(`  - Cable Length Based Item: ${item.itemName}, Qty: ${item.quantity} (not multiplied)`);
              }
              
              const itemTotal = finalQuantity * item.rate;
              console.log(`  - Item: ${item.itemName}, Final Qty: ${finalQuantity}, Rate: ${item.rate}, Total: ${itemTotal}`);
              return {
                itemId: item.id,
                itemName: item.itemName,
                quantity: finalQuantity,
                rate: item.rate,
                total: itemTotal,
                isCableLengthBased: item.isCableLengthBased,
                maxCableInMeter: item.maxCableInMeter,
              };
            });

            result.accessories = accessoriesList;
            const accessoriesTotal = accessoriesList.reduce((sum, item) => sum + item.total, 0);
            result.totalPrice += accessoriesTotal;
            console.log("✅ Accessories added to result:", accessoriesList.length, "items");
            console.log("   - Accessories Total:", accessoriesTotal);
            console.log("Updated totalPrice:", result.totalPrice);
          } else {
            console.log("❌ No applicable accessories items found");
            console.log("   - Cable length:", wiringMeters, "meters");
            console.log("   - Items filtered based on cable length requirements");
          }
        } else {
          console.log("❌ No accessories settings found matching criteria");
          console.log("   - Looking for cameraTypeId:", categoryId);
          console.log("   💡 ACTION REQUIRED: Create Accessories Settings in Admin Panel");
          console.log("      Path: Admin Panel → Quotation Settings → Accessories Configuration");
        }
      } catch (error) {
        console.error("Error calculating accessories:", error);
        console.error("Error details:", error instanceof Error ? error.message : String(error));
        // Continue without accessories if error occurs
      }
    }

    // HDD Storage calculation
    // Helper function to calculate data per day per camera based on bitrate
    const calculateDataPerDayPerCamera = (bitrateKbps: number): number => {
      // Bitrate in kbps to GB per day per camera
      // Formula: (bitrate kbps * 60 sec * 60 min * 24 hours) / 8 / 1024 / 1024
      return (bitrateKbps * 60 * 60 * 24) / 8 / 1024 / 1024;
    };

    // Helper function to get bitrate from Bitrate Configuration
    const getBitrate = async (cameraTypeId: string, territoryCategoryId: string): Promise<number | null> => {
      try {
        const bitrateSetting = await prisma.quotationBitrateSetting.findFirst({
          where: {
            cameraTypeId: cameraTypeId,
            active: true,
            territoryCategories: {
              some: {
                territoryCategoryId: territoryCategoryId,
              },
            },
          },
          include: {
            territoryCategories: {
              where: {
                territoryCategoryId: territoryCategoryId,
              },
            },
          },
        });

        if (bitrateSetting && bitrateSetting.territoryCategories.length > 0) {
          return bitrateSetting.territoryCategories[0].bitrate;
        }
      } catch (error) {
        console.error("Error fetching bitrate:", error);
      }
      return null;
    };

    // Helper function to get HDD capacity from HDD Settings
    const getHDDCapacity = async (hddTerritoryCategoryId: string): Promise<number | null> => {
      try {
        const hddSetting = await prisma.quotationHddSetting.findFirst({
          where: {
            active: true,
            territoryCategories: {
              some: {
                territoryCategoryId: hddTerritoryCategoryId,
              },
            },
          },
          include: {
            territoryCategories: {
              where: {
                territoryCategoryId: hddTerritoryCategoryId,
              },
            },
          },
        });

        if (hddSetting && hddSetting.territoryCategories.length > 0) {
          const tc = hddSetting.territoryCategories[0];
          // Convert TB to GB if needed, prioritize GB
          if (tc.capacityGB) {
            return tc.capacityGB;
          } else if (tc.capacityTB) {
            return tc.capacityTB * 1024; // Convert TB to GB
          }
        }
      } catch (error) {
        console.error("Error fetching HDD capacity:", error);
      }
      return null;
    };

    if (hddTerritoryCategoryId) {
      // Get HDD products based on territory category from HDD Settings
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
          territoryCategories: {
            where: {
              territoryCategoryId: hddTerritoryCategoryId,
            },
          },
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
            price: true,
          },
          orderBy: {
            price: "asc",
          },
          take: 1,
        });

        if (hddProducts.length > 0) {
          const minHDD = hddProducts[0];
          
          // Calculate recording days based on bitrate and HDD capacity
          let recordingDaysCalculated = null;
          if (totalCameras > 0) {
            const bitrate = await getBitrate(categoryId, territoryCategoryId);
            const hddCapacityGB = hddSettings.territoryCategories[0]?.capacityGB 
              || (hddSettings.territoryCategories[0]?.capacityTB ? hddSettings.territoryCategories[0].capacityTB * 1024 : null);
            
            if (bitrate && hddCapacityGB) {
              const dataPerDayPerCamera = calculateDataPerDayPerCamera(bitrate);
              const totalDataPerDay = dataPerDayPerCamera * totalCameras;
              if (totalDataPerDay > 0) {
                recordingDaysCalculated = Math.floor(hddCapacityGB / totalDataPerDay);
              }
            }
          }

          result.hddStorage = {
            productId: minHDD.id,
            productName: minHDD.name,
            price: minHDD.price,
            quantity: 1,
            total: minHDD.price,
            recordingDays: recordingDaysCalculated,
            calculationType: "hdd_selected",
          };
          result.totalPrice += result.hddStorage.total;
        }
      }
    } else if (recordingDays > 0) {
      // Calculate HDD suggestion based on recording days
      if (totalCameras > 0) {
        const bitrate = await getBitrate(categoryId, territoryCategoryId);
        
        if (bitrate) {
          const dataPerDayPerCamera = calculateDataPerDayPerCamera(bitrate);
          const totalDataPerDay = dataPerDayPerCamera * totalCameras;
          const requiredHDDGB = totalDataPerDay * recordingDays;

          // Find matching HDD from HDD Settings based on capacity
          const hddSettings = await prisma.quotationHddSetting.findMany({
            where: {
              active: true,
            },
            include: {
              category: true,
              subCategory: true,
              territoryCategories: true,
            },
          });

          // Find best matching HDD capacity
          let bestHDDSetting = null;
          let bestCapacity = null;
          let bestTerritoryCategoryId = null;

          for (const setting of hddSettings) {
            for (const tc of setting.territoryCategories) {
              const capacityGB = tc.capacityGB || (tc.capacityTB ? tc.capacityTB * 1024 : 0);
              if (capacityGB >= requiredHDDGB) {
                if (!bestCapacity || capacityGB < bestCapacity) {
                  bestCapacity = capacityGB;
                  bestHDDSetting = setting;
                  bestTerritoryCategoryId = tc.territoryCategoryId;
                }
              }
            }
          }

          if (bestHDDSetting && bestTerritoryCategoryId) {
            // Get HDD product
            const hddProducts = await prisma.product.findMany({
              where: {
                categoryId: bestHDDSetting.categoryId,
                subCategoryId: bestHDDSetting.subCategoryId,
                territoryCategoryId: bestTerritoryCategoryId,
                active: true,
                enableForQuotation: true,
              },
              select: {
                id: true,
                name: true,
                price: true,
              },
              orderBy: {
                price: "asc",
              },
              take: 1,
            });

            if (hddProducts.length > 0) {
              const minHDD = hddProducts[0];
              result.hddStorage = {
                productId: minHDD.id,
                productName: minHDD.name,
                price: minHDD.price,
                quantity: 1,
                total: minHDD.price,
                recordingDays: recordingDays,
                calculationType: "days_entered",
                requiredHDDGB: requiredHDDGB,
                suggestedHDDGB: bestCapacity,
              };
            } else {
              // Fallback if no product found
              const estimatedHDDPrice = Math.ceil(requiredHDDGB / 1000) * 2000;
              result.hddStorage = {
                productName: `Recording Storage (${recordingDays} days)`,
                price: estimatedHDDPrice,
                quantity: 1,
                total: estimatedHDDPrice,
                recordingDays: recordingDays,
                calculationType: "days_entered",
                requiredHDDGB: requiredHDDGB,
              };
            }
          } else {
            // Fallback if no matching HDD found
            const estimatedHDDPrice = Math.ceil(requiredHDDGB / 1000) * 2000;
            result.hddStorage = {
              productName: `Recording Storage (${recordingDays} days)`,
              price: estimatedHDDPrice,
              quantity: 1,
              total: estimatedHDDPrice,
              recordingDays: recordingDays,
              calculationType: "days_entered",
              requiredHDDGB: requiredHDDGB,
            };
          }
        } else {
          // Fallback if bitrate not found
          const estimatedHDDPrice = Math.ceil(recordingDays / 7) * 2000;
          result.hddStorage = {
            productName: `Recording Storage (${recordingDays} days)`,
            price: estimatedHDDPrice,
            quantity: 1,
            total: estimatedHDDPrice,
            recordingDays: recordingDays,
            calculationType: "days_entered",
          };
        }
      } else {
        // Fallback if no cameras
        const estimatedHDDPrice = Math.ceil(recordingDays / 7) * 2000;
        result.hddStorage = {
          productName: `Recording Storage (${recordingDays} days)`,
          price: estimatedHDDPrice,
          quantity: 1,
          total: estimatedHDDPrice,
          recordingDays: recordingDays,
          calculationType: "days_entered",
        };
      }
      result.totalPrice += result.hddStorage.total;
    }

    // Wiring and Installation calculation (combined based on cable length)
    
    if (wiringMeters > 0) {
      // Step 1: Check camera type (categoryId) - already have it
      
      // Step 2: Get wiring settings (Current Wiring Configurations) based on camera type
      const wiringSettings = await prisma.quotationWiring.findFirst({
        where: {
          categoryId: categoryId,
          active: true,
        },
        orderBy: {
          pricePerMeter: "asc",
        },
      });

      // Step 3: Get installation settings (Add Installation Rate) based on camera type
      const installationSettings = await prisma.quotationInstallation.findMany({
        where: {
          categoryId: categoryId,
          active: true,
        },
        orderBy: {
          maxCableLength: "asc", // Sort by maxCableLength ascending to find minimum matching
        },
      });

      // Get wire price per meter (use wirePricePerMeter if available, otherwise use pricePerMeter)
      const wirePricePerMeter = wiringSettings?.wirePricePerMeter || wiringSettings?.pricePerMeter || 50;
      const totalPricePerMeter = wiringSettings?.pricePerMeter || 50;
      const wiringChargePerMeter = wiringSettings?.wiringChargePerMeter || (totalPricePerMeter - wirePricePerMeter);
      
      let wiringTotal = 0;
      let installationTotal = 0;
      let cableExceedsMaxLength = false;
      let maxCableLength = 0;

      if (installationSettings.length > 0 && totalCameras > 0) {
        // Get maximum cable length from installation settings
        maxCableLength = Math.max(...installationSettings.map(s => s.maxCableLength));
        
        // Get minimum installation rate (first one with smallest maxCableLength)
        const minimumInstallation = installationSettings[0];
        const minimumLength = minimumInstallation.maxCableLength;

        // Step 4: Check if cable length is LESS than minimum length
        if (wiringMeters < minimumLength) {
          // Case 1: Cable length is LESS than minimum length
          // Calculate: Wire Price/Meter × cable length + Installation rate per camera
          wiringTotal = wirePricePerMeter * wiringMeters;
          installationTotal = minimumInstallation.ratePerCamera * totalCameras;
        } else {
          // Case 2: Cable length is EQUAL TO or GREATER than minimum length
          // Find the installation rate where cable length <= maxCableLength (minimum equal or greater length)
          const matchingInstallation = installationSettings.find(
            (setting) => wiringMeters <= setting.maxCableLength
          );

          if (matchingInstallation) {
            // Cable length matches an installation rate
            // Calculate: Installation rate per camera + Wiring price per meter × cable length
            installationTotal = matchingInstallation.ratePerCamera * totalCameras;
            wiringTotal = totalPricePerMeter * wiringMeters;
          } else {
            // Case 3: Cable length is GREATER than all maxCableLength values
            // Cable exceeds max length - separate cable price and wiring charge
            cableExceedsMaxLength = true;
            wiringTotal = totalPricePerMeter * wiringMeters;
            // No installation rate per camera when cable length exceeds max
          }
        }
      } else {
        // No installation settings found, use only wiring cost from Current Wiring Configurations
        wiringTotal = totalPricePerMeter * wiringMeters;
      }

      // Add wiring to result
      if (wiringTotal > 0) {
        if (cableExceedsMaxLength) {
          // When cable exceeds max length, return separate cable price and wiring charge
          const cablePrice = wirePricePerMeter * wiringMeters;
          const wiringCharge = wiringChargePerMeter * wiringMeters;
          
          result.wiring = {
            meters: wiringMeters,
            pricePerMeter: totalPricePerMeter,
            total: wiringTotal,
            exceedsMaxLength: true,
            cablePrice: cablePrice,
            wiringCharge: wiringCharge,
            wirePricePerMeter: wirePricePerMeter,
            wiringChargePerMeter: wiringChargePerMeter,
          };
        } else {
          // Determine which price per meter was used
          let usedPricePerMeter = totalPricePerMeter;
          if (installationSettings.length > 0 && totalCameras > 0) {
            const minimumInstallation = installationSettings[0];
            const minimumLength = minimumInstallation.maxCableLength;
            if (wiringMeters < minimumLength) {
              usedPricePerMeter = wirePricePerMeter;
            }
          }

          result.wiring = {
            meters: wiringMeters,
            pricePerMeter: usedPricePerMeter,
            total: wiringTotal,
            exceedsMaxLength: false,
          };
        }
        result.totalPrice += result.wiring.total;
      }

      // Add installation to result (only if cable length <= maxCableLength)
      if (installationTotal > 0) {
        const matchingInstallation = installationSettings.find(
          (setting) => wiringMeters <= setting.maxCableLength
        );
        result.installation = {
          ratePerCamera: matchingInstallation?.ratePerCamera || 0,
          quantity: totalCameras,
          total: installationTotal,
        };
        result.totalPrice += result.installation.total;
      }
    }

    // If no wiring but cameras exist, calculate installation separately
    if (wiringMeters === 0 && totalCameras > 0 && !result.installation) {
      const installationSettings = await prisma.quotationInstallation.findMany({
        where: {
          categoryId: categoryId,
          active: true,
        },
        orderBy: {
          maxCableLength: "asc",
        },
      });

      let ratePerCamera = 0;
      if (installationSettings.length > 0) {
        // Use the first (minimum) installation rate when no cable length specified
        ratePerCamera = installationSettings[0].ratePerCamera;
      }

      if (ratePerCamera === 0) {
        // Fallback: 10% of total or minimum 2000
        ratePerCamera = Math.max(result.totalPrice * 0.1, 2000) / totalCameras;
      }

      result.installation = {
        ratePerCamera: ratePerCamera,
        quantity: totalCameras,
        total: ratePerCamera * totalCameras,
      };
      result.totalPrice += result.installation.total;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error calculating quotation:", error);
    return NextResponse.json(
      { error: "Failed to calculate quotation" },
      { status: 500 }
    );
  }
}

