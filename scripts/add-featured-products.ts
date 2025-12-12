import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Function to generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function addFeaturedProducts() {
  console.log("🚀 Starting to add Featured Products...\n");

  try {
    // Step 1: Find or get first available Brand
    const brand = await prisma.brand.findFirst({
      where: { active: true },
    });

    if (!brand) {
      console.error("❌ Error: No active brand found in database.");
      console.log("💡 Please add a brand first.");
      return;
    }
    console.log(`✅ Using Brand: ${brand.name} (ID: ${brand.id})\n`);

    // Step 2: Find or get first available Category
    const category = await prisma.category.findFirst({
      where: { active: true },
    });

    if (!category) {
      console.error("❌ Error: No active category found in database.");
      console.log("💡 Please add a category first.");
      return;
    }
    console.log(`✅ Using Category: ${category.name} (ID: ${category.id})\n`);

    // Step 3: Find or get first available SubCategory
    const subCategory = await prisma.subCategory.findFirst({
      where: { 
        active: true,
        categoryId: category.id,
      },
    });

    let subCategoryId = null;
    if (subCategory) {
      subCategoryId = subCategory.id;
      console.log(`✅ Using SubCategory: ${subCategory.name} (ID: ${subCategory.id})\n`);
    } else {
      console.log("⚠️  No subcategory found, continuing without it...\n");
    }

    // Step 4: Find or get first available TerritoryCategory
    const territoryCategory = await prisma.territoryCategory.findFirst({
      where: { active: true },
    });

    let territoryCategoryId = null;
    if (territoryCategory) {
      territoryCategoryId = territoryCategory.id;
      console.log(`✅ Using TerritoryCategory: ${territoryCategory.name} (ID: ${territoryCategory.id})\n`);
    } else {
      console.log("⚠️  No territory category found, continuing without it...\n");
    }

    // Featured Products with sample images
    const featuredProducts = [
      {
        name: "4K Ultra HD Dome Camera",
        description: "Premium 4K Ultra HD Dome Camera with advanced night vision and AI-powered motion detection. Perfect for high-security applications requiring crystal clear video quality.",
        price: 15999,
        comparePrice: 19999,
        stock: 25,
        sku: "FEAT-4K-DOME-001",
        tags: ["4K", "Ultra HD", "Dome", "Featured", "Premium"],
        category: "Dome Cameras",
        images: [
          "/uploads/products/featured-4k-dome.jpg",
        ],
        specifications: {
          resolution: "4K Ultra HD (3840x2160)",
          sensor: "1/2.8\" CMOS",
          lens: "4mm Fixed Lens",
          nightVision: "Up to 50 meters",
          powerSupply: "12V DC / PoE+",
          operatingTemperature: "-20°C to 60°C",
          features: ["AI Motion Detection", "Digital WDR", "Smart IR", "Privacy Masking"]
        },
      },
      {
        name: "Wireless IP Camera System",
        description: "Advanced Wireless IP Camera System with 2.4GHz/5GHz dual-band connectivity. Features mobile app control, cloud storage, and real-time alerts for complete security management.",
        price: 24999,
        comparePrice: 29999,
        stock: 18,
        sku: "FEAT-WIRELESS-IP-002",
        tags: ["Wireless", "IP Camera", "WiFi", "Featured", "Smart"],
        category: "IP Cameras",
        images: [
          "/uploads/products/featured-wireless-ip.jpg",
        ],
        specifications: {
          resolution: "1080p Full HD",
          connectivity: "WiFi 802.11ac (2.4/5GHz)",
          nightVision: "Up to 30 meters",
          powerSupply: "Power Adapter / Battery",
          operatingTemperature: "-10°C to 50°C",
          features: ["Mobile App", "Cloud Storage", "Two-Way Audio", "Motion Alerts"]
        },
      },
      {
        name: "PTZ Security Camera",
        description: "Professional PTZ (Pan-Tilt-Zoom) Security Camera with 360° coverage and 10x optical zoom. Ideal for large area surveillance with remote control capabilities.",
        price: 34999,
        comparePrice: 39999,
        stock: 12,
        sku: "FEAT-PTZ-003",
        tags: ["PTZ", "Pan-Tilt-Zoom", "Professional", "Featured"],
        category: "PTZ Cameras",
        images: [
          "/uploads/products/featured-ptz.jpg",
        ],
        specifications: {
          resolution: "5MP (2560x1920)",
          pan: "360° Continuous",
          tilt: "90°",
          zoom: "10x Optical + 4x Digital",
          nightVision: "Up to 80 meters",
          powerSupply: "PoE+ / 24V AC",
          features: ["Auto Tracking", "Preset Positions", "Privacy Zones", "E-PTZ"]
        },
      },
      {
        name: "Night Vision Bullet Camera",
        description: "Ultra-sensitive Night Vision Bullet Camera with advanced infrared technology. Provides exceptional image quality in complete darkness up to 60 meters.",
        price: 12999,
        comparePrice: 16999,
        stock: 30,
        sku: "FEAT-BULLET-NV-004",
        tags: ["Bullet", "Night Vision", "IR", "Featured", "Outdoor"],
        category: "Bullet Cameras",
        images: [
          "/uploads/products/featured-bullet-night.jpg",
        ],
        specifications: {
          resolution: "2MP (1920x1080)",
          nightVision: "Up to 60 meters (IR LEDs)",
          lens: "6mm Fixed Lens",
          powerSupply: "12V DC / PoE",
          operatingTemperature: "-30°C to 60°C",
          weatherRating: "IP67",
          features: ["True Day/Night", "Smart IR", "Waterproof", "Vandal Resistant"]
        },
      },
      {
        name: "AI-Powered Smart Camera",
        description: "Next-generation AI-Powered Smart Camera with facial recognition, object detection, and intelligent analytics. Features deep learning algorithms for advanced security monitoring.",
        price: 28999,
        comparePrice: 34999,
        stock: 15,
        sku: "FEAT-AI-SMART-005",
        tags: ["AI", "Smart", "Facial Recognition", "Featured", "Premium"],
        category: "IP Cameras",
        images: [
          "/uploads/products/featured-ai-smart.jpg",
        ],
        specifications: {
          resolution: "4MP (2688x1520)",
          aiFeatures: ["Facial Recognition", "Object Detection", "Intrusion Detection"],
          nightVision: "Up to 40 meters",
          powerSupply: "PoE+",
          operatingTemperature: "-10°C to 50°C",
          features: ["Deep Learning", "Behavioral Analysis", "Cloud AI", "Edge Computing"]
        },
      },
      {
        name: "Dual-Lens Panoramic Camera",
        description: "Revolutionary Dual-Lens Panoramic Camera providing 180° field of view with zero blind spots. Perfect for corridor monitoring and wide area coverage.",
        price: 21999,
        comparePrice: 26999,
        stock: 20,
        sku: "FEAT-PANORAMIC-006",
        tags: ["Panoramic", "Dual-Lens", "180°", "Featured"],
        category: "Dome Cameras",
        images: [
          "/uploads/products/featured-panoramic.jpg",
        ],
        specifications: {
          resolution: "4MP (2688x1520) per lens",
          fieldOfView: "180° Panoramic",
          lenses: "Dual 2.8mm Fixed Lens",
          nightVision: "Up to 30 meters",
          powerSupply: "PoE+ / 12V DC",
          features: ["Zero Blind Spots", "Panoramic View", "Image Stitching", "Dual Streams"]
        },
      },
    ];

    console.log("📦 Adding featured products...\n");
    let added = 0;
    let skipped = 0;
    let errors = 0;

    for (const productData of featuredProducts) {
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
          // Update existing product to be featured
          await prisma.product.update({
            where: { id: existingProduct.id },
            data: {
              featured: true,
              images: productData.images,
            },
          });
          console.log(`🔄 Updated: ${productData.name} (marked as featured)`);
          skipped++;
          continue;
        }

        // Create new featured product
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
            category: productData.category,
            images: productData.images,
            specifications: productData.specifications,
            brandId: brand.id,
            categoryId: category.id,
            subCategoryId: subCategoryId,
            territoryCategoryId: territoryCategoryId,
            featured: true,
            active: true,
            enableForQuotation: true,
          },
        });

        console.log(`✅ Added: ${productData.name}`);
        console.log(`   SKU: ${productData.sku} | Price: ₹${productData.price} | Featured: Yes\n`);
        added++;
      } catch (error: any) {
        console.error(`❌ Error adding ${productData.name}:`, error.message);
        errors++;
      }
    }

    console.log("\n📊 Summary:");
    console.log(`   ✅ Added: ${added} featured products`);
    console.log(`   🔄 Updated: ${skipped} products (marked as featured)`);
    console.log(`   ❌ Errors: ${errors} products`);
    console.log("\n✨ Done!");
  } catch (error: any) {
    console.error("❌ Fatal error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
addFeaturedProducts();

