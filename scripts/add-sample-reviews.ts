import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const sampleReviews = [
  {
    name: "Rajesh Kumar",
    role: "Business Owner",
    content: "D.G.Yard installed a complete CCTV system for my warehouse. The quality is exceptional and the support team is always available. Highly recommended!",
    rating: 5,
    image: null,
    source: "Google My Business",
    googleReviewId: null,
    verified: true,
    featured: true,
    active: true,
    order: 1,
  },
  {
    name: "Priya Sharma",
    role: "Homeowner",
    content: "Professional installation and excellent customer service. The mobile app makes it so easy to monitor my home from anywhere. Worth every rupee!",
    rating: 5,
    image: null,
    source: "Google My Business",
    googleReviewId: null,
    verified: true,
    featured: true,
    active: true,
    order: 2,
  },
  {
    name: "Amit Patel",
    role: "Store Manager",
    content: "We've been using their services for 3 years now. The maintenance support is top-notch and the system has never let us down. Great value for money.",
    rating: 5,
    image: null,
    source: "Website",
    googleReviewId: null,
    verified: true,
    featured: false,
    active: true,
    order: 3,
  },
  {
    name: "Sneha Reddy",
    role: "Office Manager",
    content: "Excellent networking solutions! They set up our entire office network and it's been running flawlessly. Very professional team.",
    rating: 5,
    image: null,
    source: "Google My Business",
    googleReviewId: null,
    verified: true,
    featured: true,
    active: true,
    order: 4,
  },
  {
    name: "Vikram Singh",
    role: "Restaurant Owner",
    content: "The CCTV system they installed has helped us tremendously with security. Clear video quality and excellent after-sales service.",
    rating: 4,
    image: null,
    source: "Google My Business",
    googleReviewId: null,
    verified: false,
    featured: false,
    active: true,
    order: 5,
  },
];

async function main() {
  console.log("Adding sample reviews...");

  for (const reviewData of sampleReviews) {
    try {
      const review = await prisma.review.create({
        data: reviewData,
      });
      console.log(`✅ Created review: ${review.name}`);
    } catch (error: any) {
      if (error.code === "P2002") {
        console.log(`⚠️  Review for ${reviewData.name} already exists, skipping...`);
      } else {
        console.error(`❌ Error creating review for ${reviewData.name}:`, error.message);
      }
    }
  }

  console.log("\n✅ Sample reviews added successfully!");
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

