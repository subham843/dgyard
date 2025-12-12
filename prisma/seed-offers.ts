import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding sample offers...");

  // Check if offers already exist
  const existingOffers = await prisma.offer.findMany({
    where: {
      title: {
        in: [
          "Premium CCTV Installation Package",
          "Digital Marketing Starter Package",
        ],
      },
    },
  });

  if (existingOffers.length > 0) {
    console.log("Sample offers already exist. Skipping...");
    return;
  }

  // Sample CCTV Offer
  const cctvOffer = await prisma.offer.create({
    data: {
      title: "Premium CCTV Installation Package",
      description: "Get a complete 4-camera CCTV system with professional installation. Includes night vision cameras, DVR, and 1TB storage. Perfect for home and small business security.",
      category: "CCTV",
      image: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=600&fit=crop",
      discount: 25,
      originalPrice: 49999,
      offerPrice: 37499,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      active: true,
      featured: true,
      order: 1,
      ctaText: "Get This Offer",
      ctaLink: "/quotation",
    },
  });

  console.log("Created CCTV offer:", cctvOffer.title);

  // Sample Digital Marketing Offer
  const dmOffer = await prisma.offer.create({
    data: {
      title: "Digital Marketing Starter Package",
      description: "Boost your online presence with our comprehensive digital marketing package. Includes SEO optimization, social media management, and Google Ads setup. Perfect for small businesses looking to grow online.",
      category: "DIGITAL_MARKETING",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop",
      discount: 30,
      originalPrice: 29999,
      offerPrice: 20999,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
      active: true,
      featured: true,
      order: 1,
      ctaText: "Start Marketing",
      ctaLink: "/services",
    },
  });

  console.log("Created Digital Marketing offer:", dmOffer.title);

  // Another CCTV Offer
  const cctvOffer2 = await prisma.offer.create({
    data: {
      title: "8-Camera Business Security System",
      description: "Enterprise-grade security solution with 8 high-resolution cameras, advanced motion detection, and cloud storage backup. Ideal for offices, shops, and warehouses.",
      category: "CCTV",
      image: "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=800&h=600&fit=crop",
      discount: 20,
      originalPrice: 89999,
      offerPrice: 71999,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
      active: true,
      featured: false,
      order: 2,
      ctaText: "Get Quote",
      ctaLink: "/quotation",
    },
  });

  console.log("Created CCTV offer 2:", cctvOffer2.title);

  // Another Digital Marketing Offer
  const dmOffer2 = await prisma.offer.create({
    data: {
      title: "Social Media Growth Package",
      description: "Grow your social media presence with professional content creation, posting schedule, and engagement strategies. Includes Facebook, Instagram, and LinkedIn management.",
      category: "DIGITAL_MARKETING",
      image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&h=600&fit=crop",
      discount: 15,
      originalPrice: 19999,
      offerPrice: 16999,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
      active: true,
      featured: false,
      order: 2,
      ctaText: "Boost Now",
      ctaLink: "/services",
    },
  });

  console.log("Created Digital Marketing offer 2:", dmOffer2.title);

  console.log("✅ Sample offers seeded successfully!");
}

main()
  .catch((e) => {
    console.error("Error seeding offers:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

