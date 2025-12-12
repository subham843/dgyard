import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Function to generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function addPopularBrands() {
  // Using Map to handle duplicates - last description wins
  const brandMap = new Map<string, string>();

  // CCTV Brands
  brandMap.set("Hikvision", "Leading provider of CCTV cameras and video surveillance solutions");
  brandMap.set("Dahua", "Professional security and surveillance equipment manufacturer");
  brandMap.set("Axis", "Network camera and video surveillance solutions");
  brandMap.set("Bosch", "Security systems and CCTV cameras");
  brandMap.set("Honeywell", "Security and surveillance solutions");
  brandMap.set("CP Plus", "Complete security and surveillance solutions");
  brandMap.set("Samsung", "Consumer electronics including CCTV cameras, TVs, monitors, and storage devices");
  brandMap.set("TP-Link", "Network cameras and surveillance systems");
  brandMap.set("Reolink", "Smart home security cameras");
  brandMap.set("Ezviz", "Smart home security and surveillance");
  brandMap.set("ZKTeco", "Biometric and security solutions");
  brandMap.set("Panasonic", "Consumer electronics including security cameras, TVs, and displays");

  // TV Brands
  brandMap.set("LG", "Consumer electronics including OLED/LED smart TVs and monitors");
  brandMap.set("Sony", "Premium smart TVs and displays");
  brandMap.set("TCL", "Affordable smart TVs");
  brandMap.set("Xiaomi", "Smart TVs with Android TV");
  brandMap.set("OnePlus", "Premium Android smart TVs");
  brandMap.set("Realme", "Smart TVs with Android TV");
  brandMap.set("VU", "Smart LED and OLED TVs");
  brandMap.set("Haier", "Smart TVs and home entertainment");

  // Hard Disk Brands
  brandMap.set("Seagate", "Hard drives and storage solutions");
  brandMap.set("Western Digital", "HDDs, SSDs, and storage devices");
  brandMap.set("Toshiba", "Hard drives and storage solutions");
  brandMap.set("Crucial", "SSDs and memory solutions");
  brandMap.set("Kingston", "SSDs and storage solutions");
  brandMap.set("SanDisk", "SSDs and flash storage");
  brandMap.set("HP", "Computers, hard drives, monitors, and business solutions");
  brandMap.set("Lenovo", "Computers, storage solutions, and monitors");

  // Monitor Brands
  brandMap.set("Dell", "Professional and gaming monitors");
  brandMap.set("Acer", "Gaming and office monitors");
  brandMap.set("ASUS", "Gaming and professional monitors");
  brandMap.set("BenQ", "Gaming and professional displays");
  brandMap.set("ViewSonic", "Professional and gaming monitors");
  brandMap.set("MSI", "Gaming monitors");
  brandMap.set("AOC", "Gaming and office monitors");

  // Convert Map to array
  const brands = Array.from(brandMap.entries()).map(([name, description]) => ({
    name,
    description,
  }));

  console.log("🚀 Starting to add popular brands...\n");

  let added = 0;
  let skipped = 0;
  let errors = 0;

  for (const brandData of brands) {
    try {
      const slug = generateSlug(brandData.name);

      // Check if brand already exists
      const existingBrand = await prisma.brand.findFirst({
        where: {
          OR: [
            { name: brandData.name },
            { slug: slug },
          ],
        },
      });

      if (existingBrand) {
        console.log(`⏭️  Skipped: ${brandData.name} (already exists)`);
        skipped++;
        continue;
      }

      // Create brand
      const brand = await prisma.brand.create({
        data: {
          name: brandData.name,
          slug: slug,
          description: brandData.description,
          active: true,
        },
      });

      console.log(`✅ Added: ${brandData.name}`);
      added++;
    } catch (error: any) {
      console.error(`❌ Error adding ${brandData.name}:`, error.message);
      errors++;
    }
  }

  console.log("\n📊 Summary:");
  console.log(`   ✅ Added: ${added} brands`);
  console.log(`   ⏭️  Skipped: ${skipped} brands (already exist)`);
  console.log(`   ❌ Errors: ${errors} brands`);
  console.log("\n✨ Done!");
}

async function main() {
  try {
    await addPopularBrands();
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

