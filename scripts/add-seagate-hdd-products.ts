import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Function to generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function addSeagateHDDProducts() {
  console.log("🚀 Starting to add Seagate HDD products...\n");

  try {
    // Step 1: Find or verify Brand exists
    const brand = await prisma.brand.findFirst({
      where: {
        OR: [
          { name: "Seagate" },
          { name: { contains: "Seagate", mode: "insensitive" } },
        ],
      },
    });

    if (!brand) {
      console.error("❌ Error: Brand 'Seagate' not found in database.");
      console.log("💡 Please add the brand first using: npm run add-brands");
      return;
    }
    console.log(`✅ Found Brand: ${brand.name} (ID: ${brand.id})\n`);

    // Step 2: Find or create Category "Hard Disk"
    const categorySlug = generateSlug("Hard Disk");
    let category = await prisma.category.findFirst({
      where: {
        OR: [
          { name: "Hard Disk" },
          { name: { contains: "Hard Disk", mode: "insensitive" } },
          { slug: categorySlug },
        ],
      },
    });

    if (!category) {
      console.log("📝 Creating Category: Hard Disk...");
      try {
        category = await prisma.category.create({
          data: {
            name: "Hard Disk",
            slug: categorySlug,
            description: "Hard disk drives and storage solutions for surveillance and data storage",
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

    // Step 3: Find or create SubCategory "Surveillance"
    const subCategorySlug = generateSlug("Surveillance");
    let subCategory = await prisma.subCategory.findFirst({
      where: {
        OR: [
          {
            name: {
              contains: "Surveillance",
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
      console.log("📝 Creating SubCategory: Surveillance...");
      try {
        subCategory = await prisma.subCategory.create({
          data: {
            name: "Surveillance",
            slug: subCategorySlug,
            categoryId: category.id,
            description: "Surveillance-grade hard disk drives optimized for 24/7 recording",
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

    // Step 4: Define HDD products (500GB to 8TB)
    const hddProducts = [
      {
        capacity: "500GB",
        name: "Seagate Surveillance HDD 500GB - ST5000VX015",
        description: "Seagate Surveillance HDD 500GB - Optimized for 24/7 surveillance recording with high reliability and excellent performance. Perfect for small-scale CCTV installations.",
        price: 2500,
        comparePrice: 3000,
        stock: 100,
        sku: "SEAGATE-500GB-SURV-001",
        tags: ["HDD", "Surveillance", "500GB", "Seagate", "Storage"],
        specifications: {
          capacity: "500GB",
          interface: "SATA 6Gb/s",
          rpm: "7200 RPM",
          cache: "64MB",
          formFactor: "3.5 inch",
          workload: "Surveillance - 24/7 Operation",
          warranty: "3 Years",
        },
      },
      {
        capacity: "1TB",
        name: "Seagate Surveillance HDD 1TB - ST1000VX015",
        description: "Seagate Surveillance HDD 1TB - High-capacity storage solution designed for continuous recording. Features advanced error recovery controls and surveillance-optimized firmware.",
        price: 3500,
        comparePrice: 4200,
        stock: 100,
        sku: "SEAGATE-1TB-SURV-002",
        tags: ["HDD", "Surveillance", "1TB", "Seagate", "Storage"],
        specifications: {
          capacity: "1TB",
          interface: "SATA 6Gb/s",
          rpm: "7200 RPM",
          cache: "64MB",
          formFactor: "3.5 inch",
          workload: "Surveillance - 24/7 Operation",
          warranty: "3 Years",
        },
      },
      {
        capacity: "2TB",
        name: "Seagate Surveillance HDD 2TB - ST2000VX015",
        description: "Seagate Surveillance HDD 2TB - Reliable storage for medium-scale surveillance systems. Optimized for multiple camera feeds and extended recording periods.",
        price: 5000,
        comparePrice: 6000,
        stock: 100,
        sku: "SEAGATE-2TB-SURV-003",
        tags: ["HDD", "Surveillance", "2TB", "Seagate", "Storage"],
        specifications: {
          capacity: "2TB",
          interface: "SATA 6Gb/s",
          rpm: "7200 RPM",
          cache: "64MB",
          formFactor: "3.5 inch",
          workload: "Surveillance - 24/7 Operation",
          warranty: "3 Years",
        },
      },
      {
        capacity: "3TB",
        name: "Seagate Surveillance HDD 3TB - ST3000VX015",
        description: "Seagate Surveillance HDD 3TB - Enhanced storage capacity for large-scale CCTV deployments. Designed to handle high-resolution video recording with superior reliability.",
        price: 6500,
        comparePrice: 7800,
        stock: 80,
        sku: "SEAGATE-3TB-SURV-004",
        tags: ["HDD", "Surveillance", "3TB", "Seagate", "Storage"],
        specifications: {
          capacity: "3TB",
          interface: "SATA 6Gb/s",
          rpm: "7200 RPM",
          cache: "64MB",
          formFactor: "3.5 inch",
          workload: "Surveillance - 24/7 Operation",
          warranty: "3 Years",
        },
      },
      {
        capacity: "4TB",
        name: "Seagate Surveillance HDD 4TB - ST4000VX015",
        description: "Seagate Surveillance HDD 4TB - High-capacity storage solution for enterprise surveillance systems. Features advanced power management and optimized for DVR/NVR applications.",
        price: 8000,
        comparePrice: 9500,
        stock: 80,
        sku: "SEAGATE-4TB-SURV-005",
        tags: ["HDD", "Surveillance", "4TB", "Seagate", "Storage"],
        specifications: {
          capacity: "4TB",
          interface: "SATA 6Gb/s",
          rpm: "7200 RPM",
          cache: "64MB",
          formFactor: "3.5 inch",
          workload: "Surveillance - 24/7 Operation",
          warranty: "3 Years",
        },
      },
      {
        capacity: "6TB",
        name: "Seagate Surveillance HDD 6TB - ST6000VX015",
        description: "Seagate Surveillance HDD 6TB - Premium storage solution for extensive surveillance networks. Supports multiple high-resolution camera streams with extended recording capabilities.",
        price: 12000,
        comparePrice: 14500,
        stock: 60,
        sku: "SEAGATE-6TB-SURV-006",
        tags: ["HDD", "Surveillance", "6TB", "Seagate", "Storage"],
        specifications: {
          capacity: "6TB",
          interface: "SATA 6Gb/s",
          rpm: "7200 RPM",
          cache: "256MB",
          formFactor: "3.5 inch",
          workload: "Surveillance - 24/7 Operation",
          warranty: "3 Years",
        },
      },
      {
        capacity: "8TB",
        name: "Seagate Surveillance HDD 8TB - ST8000VX015",
        description: "Seagate Surveillance HDD 8TB - Maximum capacity storage for large-scale professional surveillance systems. Ideal for enterprise deployments with extensive recording requirements.",
        price: 15000,
        comparePrice: 18000,
        stock: 60,
        sku: "SEAGATE-8TB-SURV-007",
        tags: ["HDD", "Surveillance", "8TB", "Seagate", "Storage"],
        specifications: {
          capacity: "8TB",
          interface: "SATA 6Gb/s",
          rpm: "7200 RPM",
          cache: "256MB",
          formFactor: "3.5 inch",
          workload: "Surveillance - 24/7 Operation",
          warranty: "3 Years",
        },
      },
    ];

    console.log(`📦 Adding ${hddProducts.length} Seagate HDD products...\n`);

    let added = 0;
    let skipped = 0;
    let errors = 0;

    // Step 5: Add products
    for (const productData of hddProducts) {
      try {
        const productSlug = generateSlug(productData.name);

        // Check if product already exists
        const existingProduct = await prisma.product.findFirst({
          where: {
            OR: [
              { name: productData.name },
              { slug: productSlug },
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
            slug: productSlug,
            description: productData.description,
            price: productData.price,
            comparePrice: productData.comparePrice,
            sku: productData.sku,
            stock: productData.stock,
            tags: productData.tags,
            specifications: productData.specifications,
            active: true,
            enableForQuotation: true,
            featured: false,
            images: [],
            category: category.name, // Backward compatibility
            brandId: brand.id,
            categoryId: category.id,
            subCategoryId: subCategory.id,
          },
        });

        console.log(`✅ Added: ${productData.name} - ₹${productData.price}`);
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
    console.log("\n✨ Done! Seagate HDD products have been added successfully.");
  } catch (error) {
    console.error("❌ Fatal error:", error);
    throw error;
  }
}

async function main() {
  try {
    await addSeagateHDDProducts();
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();



















