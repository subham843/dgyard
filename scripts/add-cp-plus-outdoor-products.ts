import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Function to generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function addCPPlusOutdoorProducts() {
  console.log("🚀 Starting to add CP Plus Outdoor Bullet Camera products...\n");

  try {
    // Step 1: Find or verify Brand exists
    const brand = await prisma.brand.findFirst({
      where: {
        OR: [
          { name: "CP Plus" },
          { name: { contains: "CP Plus", mode: "insensitive" } },
        ],
      },
    });

    if (!brand) {
      console.error("❌ Error: Brand 'CP Plus' not found in database.");
      console.log("💡 Please add the brand first using: npm run add-brands");
      return;
    }
    console.log(`✅ Found Brand: ${brand.name} (ID: ${brand.id})\n`);

    // Step 2: Find or create Category
    const categorySlug = generateSlug("HD - Analog Camera");
    let category = await prisma.category.findFirst({
      where: {
        OR: [
          { name: "HD - Analog Camera" },
          { name: { contains: "HD - Analog Camera", mode: "insensitive" } },
          { slug: categorySlug },
        ],
      },
    });

    if (!category) {
      console.log("📝 Creating Category: HD - Analog Camera...");
      try {
        category = await prisma.category.create({
          data: {
            name: "HD - Analog Camera",
            slug: categorySlug,
            description: "HD Analog Camera products for professional surveillance",
            active: true,
            enableForQuotation: true,
          },
        });
        console.log(`✅ Created Category: ${category.name} (ID: ${category.id})\n`);
      } catch (error: any) {
        if (error.code === 'P2002') {
          category = await prisma.category.findFirst({
            where: { slug: categorySlug },
          });
          if (category) {
            console.log(`✅ Found Category by slug: ${category.name} (ID: ${category.id})\n`);
          } else {
            throw error;
          }
        } else {
          throw error;
        }
      }
    } else {
      console.log(`✅ Found Category: ${category.name} (ID: ${category.id})\n`);
    }

    // Step 3: Find or create SubCategory (Outdoor - Bullet Camera)
    const subCategorySlug = generateSlug("Outdoor - Bullet Camera");
    let subCategory = await prisma.subCategory.findFirst({
      where: {
        OR: [
          {
            name: {
              contains: "Outdoor - Bullet Camera",
              mode: "insensitive",
            },
            categoryId: category.id,
          },
          {
            slug: subCategorySlug,
            categoryId: category.id,
          },
        ],
      },
    });

    if (!subCategory) {
      console.log("📝 Creating SubCategory: Outdoor - Bullet Camera...");
      try {
        subCategory = await prisma.subCategory.create({
          data: {
            name: "Outdoor - Bullet Camera",
            slug: subCategorySlug,
            description: "Outdoor bullet cameras for HD analog surveillance",
            categoryId: category.id,
            active: true,
            enableForQuotation: true,
          },
        });
        console.log(`✅ Created SubCategory: ${subCategory.name} (ID: ${subCategory.id})\n`);
      } catch (error: any) {
        if (error.code === 'P2002') {
          subCategory = await prisma.subCategory.findFirst({
            where: {
              slug: subCategorySlug,
              categoryId: category.id,
            },
          });
          if (subCategory) {
            console.log(`✅ Found SubCategory by slug: ${subCategory.name} (ID: ${subCategory.id})\n`);
          } else {
            throw error;
          }
        } else {
          throw error;
        }
      }
    } else {
      console.log(`✅ Found SubCategory: ${subCategory.name} (ID: ${subCategory.id})\n`);
    }

    // Step 4: Find or create TerritoryCategory
    const territoryCategorySlug = generateSlug("2.4MP");
    let territoryCategory = await prisma.territoryCategory.findFirst({
      where: {
        OR: [
          { name: "2.4MP" },
          { name: { contains: "2.4MP", mode: "insensitive" } },
          { slug: territoryCategorySlug },
        ],
      },
    });

    if (!territoryCategory) {
      console.log("📝 Creating TerritoryCategory: 2.4MP...");
      try {
        territoryCategory = await prisma.territoryCategory.create({
          data: {
            name: "2.4MP",
            slug: territoryCategorySlug,
            description: "2.4 Megapixel resolution products",
            active: true,
            enableForQuotation: true,
          },
        });
        console.log(`✅ Created TerritoryCategory: ${territoryCategory.name} (ID: ${territoryCategory.id})\n`);
        
        // Link territory category to category
        try {
          await prisma.territoryCategoryCategory.create({
            data: {
              territoryCategoryId: territoryCategory.id,
              categoryId: category.id,
            },
          });
        } catch (error: any) {
          // Ignore if already linked
        }
        
        // Link territory category to subcategory
        try {
          await prisma.territoryCategorySubCategory.create({
            data: {
              territoryCategoryId: territoryCategory.id,
              subCategoryId: subCategory.id,
            },
          });
          console.log(`✅ Linked TerritoryCategory to SubCategory\n`);
        } catch (error: any) {
          console.log(`⚠️  Note: Could not link territory category to subcategory (may already exist)\n`);
        }
      } catch (error: any) {
        if (error.code === 'P2002') {
          territoryCategory = await prisma.territoryCategory.findFirst({
            where: { slug: territoryCategorySlug },
          });
          if (territoryCategory) {
            console.log(`✅ Found TerritoryCategory by slug: ${territoryCategory.name} (ID: ${territoryCategory.id})\n`);
          } else {
            throw error;
          }
        } else {
          throw error;
        }
      }
    } else {
      console.log(`✅ Found TerritoryCategory: ${territoryCategory.name} (ID: ${territoryCategory.id})\n`);
      
      // Ensure links exist even if territory category was already found
      try {
        await prisma.territoryCategoryCategory.upsert({
          where: {
            territoryCategoryId_categoryId: {
              territoryCategoryId: territoryCategory.id,
              categoryId: category.id,
            },
          },
          create: {
            territoryCategoryId: territoryCategory.id,
            categoryId: category.id,
          },
          update: {},
        });
        
        await prisma.territoryCategorySubCategory.upsert({
          where: {
            territoryCategoryId_subCategoryId: {
              territoryCategoryId: territoryCategory.id,
              subCategoryId: subCategory.id,
            },
          },
          create: {
            territoryCategoryId: territoryCategory.id,
            subCategoryId: subCategory.id,
          },
          update: {},
        });
      } catch (error: any) {
        // Ignore errors
      }
    }

    // Step 5: Define products
    const products = [
      {
        name: "CP Plus 2.4MP HD Analog Bullet Camera - CP-HD24B-B",
        description: "2.4MP HD Analog Bullet Camera with excellent weatherproof design and superior night vision. Perfect for outdoor surveillance with wide viewing angle and crystal clear image quality.",
        price: 4800,
        comparePrice: 5800,
        stock: 50,
        sku: "CP-HD24B-B-001",
        tags: ["HD", "Analog", "Bullet", "Outdoor", "2.4MP"],
        specifications: {
          resolution: "2.4MP",
          type: "HD Analog Bullet Camera",
          lens: "3.6mm Fixed Lens",
          nightVision: "Up to 30 meters",
          powerSupply: "12V DC",
          weatherproof: "IP66",
          operatingTemperature: "-20°C to 60°C",
          dimensions: "165mm x 75mm",
        },
      },
      {
        name: "CP Plus 2.4MP HD Analog Bullet Camera - CP-HD24B-W",
        description: "2.4MP HD Analog White Bullet Camera with advanced image processing and motion detection. Ideal for outdoor security applications with professional grade features and weather resistance.",
        price: 5100,
        comparePrice: 6100,
        stock: 45,
        sku: "CP-HD24B-W-002",
        tags: ["HD", "Analog", "Bullet", "Outdoor", "2.4MP", "White"],
        specifications: {
          resolution: "2.4MP",
          type: "HD Analog Bullet Camera",
          lens: "2.8mm Wide Angle Lens",
          nightVision: "Up to 35 meters",
          powerSupply: "12V DC",
          weatherproof: "IP66",
          operatingTemperature: "-20°C to 60°C",
          dimensions: "170mm x 80mm",
        },
      },
      {
        name: "CP Plus 2.4MP HD Analog Bullet Camera - CP-HD24B-P",
        description: "2.4MP HD Analog Professional Bullet Camera with varifocal lens and remote viewing capabilities. Features advanced compression technology for efficient storage and superior outdoor performance.",
        price: 5500,
        comparePrice: 6500,
        stock: 40,
        sku: "CP-HD24B-P-003",
        tags: ["HD", "Analog", "Bullet", "Outdoor", "2.4MP", "Professional"],
        specifications: {
          resolution: "2.4MP",
          type: "HD Analog Bullet Camera",
          lens: "Varifocal 2.8-12mm",
          nightVision: "Up to 40 meters",
          powerSupply: "12V DC / PoE",
          weatherproof: "IP67",
          operatingTemperature: "-20°C to 60°C",
          dimensions: "180mm x 85mm",
        },
      },
      {
        name: "CP Plus 2.4MP HD Analog Bullet Camera - CP-HD24B-A",
        description: "2.4MP HD Analog Advanced Bullet Camera with AI-based detection and smart analytics. Perfect for modern outdoor surveillance requirements with cutting-edge technology and enhanced weather protection.",
        price: 5800,
        comparePrice: 6800,
        stock: 35,
        sku: "CP-HD24B-A-004",
        tags: ["HD", "Analog", "Bullet", "Outdoor", "2.4MP", "AI", "Advanced"],
        specifications: {
          resolution: "2.4MP",
          type: "HD Analog Bullet Camera",
          lens: "2.8mm Wide Angle with IR Cut Filter",
          nightVision: "Up to 45 meters",
          powerSupply: "12V DC / PoE",
          weatherproof: "IP67",
          operatingTemperature: "-20°C to 60°C",
          dimensions: "185mm x 90mm",
          features: ["AI Detection", "Motion Alarm", "Privacy Masking", "Anti-Vandal"],
        },
      },
    ];

    console.log("📦 Adding products...\n");
    let added = 0;
    let skipped = 0;
    let errors = 0;

    for (const productData of products) {
      try {
        const slug = generateSlug(productData.name);

        // Check if product already exists
        const existingProduct = await prisma.product.findFirst({
          where: {
            OR: [
              { name: productData.name },
              { slug: slug },
              { sku: productData.sku },
            ],
          },
        });

        if (existingProduct) {
          console.log(`⏭️  Skipped: ${productData.name} (already exists)`);
          skipped++;
          continue;
        }

        // Create product
        const product = await prisma.product.create({
          data: {
            name: productData.name,
            slug: slug,
            description: productData.description,
            price: productData.price,
            comparePrice: productData.comparePrice,
            stock: productData.stock,
            sku: productData.sku,
            tags: productData.tags,
            specifications: productData.specifications,
            category: category.name, // Backward compatibility
            brandId: brand.id,
            categoryId: category.id,
            subCategoryId: subCategory.id,
            territoryCategoryId: territoryCategory.id,
            active: true,
            enableForQuotation: true,
            featured: false,
            images: [],
          },
        });

        console.log(`✅ Added: ${productData.name}`);
        console.log(`   SKU: ${productData.sku} | Price: ₹${productData.price}\n`);
        added++;
      } catch (error: any) {
        console.error(`❌ Error adding ${productData.name}:`, error.message);
        errors++;
      }
    }

    console.log("\n📊 Summary:");
    console.log(`   ✅ Added: ${added} products`);
    console.log(`   ⏭️  Skipped: ${skipped} products (already exist)`);
    console.log(`   ❌ Errors: ${errors} products`);
    console.log("\n✨ Done!");
  } catch (error) {
    console.error("Fatal error:", error);
    throw error;
  }
}

async function main() {
  try {
    await addCPPlusOutdoorProducts();
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

