/**
 * Script to delete unused MongoDB collections that are not in Prisma schema
 * This removes collections that are not part of the current webapp
 */

import { PrismaClient } from "@prisma/client";
import { MongoClient } from "mongodb";

const prisma = new PrismaClient();

// Prisma models (collections) - these are the ones we use
const PRISMA_COLLECTIONS = [
  "User",
  "Account",
  "Session",
  "VerificationToken",
  "Brand",
  "Category",
  "SubCategory",
  "TerritoryCategory",
  "TerritoryCategoryCategory",
  "TerritoryCategorySubCategory",
  "Product",
  "CartItem",
  "Address",
  "Order",
  "OrderItem",
  "Booking",
  "PriceCalculation",
  "Settings",
  "PageContent",
  "QuotationHddSetting",
  "QuotationHddSettingTerritoryCategory",
  "QuotationWiring",
  "QuotationInstallation",
  "QuotationRecordingDeviceSetting",
  "QuotationRecordingDeviceSettingTerritoryCategory",
  "QuotationPowerSupplySetting",
  "QuotationPowerSupplySettingTerritoryCategory",
  "QuotationAccessoriesSetting",
  "QuotationAccessoriesItem",
  "QuotationBitrateSetting",
  "QuotationBitrateSettingTerritoryCategory",
  "AIConversation",
  "AIConversationFeedback",
  "AIKnowledgeBase",
  "AILearningPattern",
  "Offer",
  "Quotation",
  "Review",
  "AuditRequest",
  "AuditResult",
  "ConnectedAccount",
  "Lead",
];

async function deleteUnusedCollections() {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL environment variable is not set");
    }

    // Extract database name from connection string
    const url = new URL(databaseUrl);
    const dbName = url.pathname.substring(1); // Remove leading '/'

    console.log("🔍 Connecting to MongoDB...");
    const client = new MongoClient(databaseUrl);
    await client.connect();
    const db = client.db(dbName);

    console.log(`📊 Database: ${dbName}\n`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // Get all collections
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map((c) => c.name);

    console.log("\n📋 Analyzing Collections:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    const usedCollections: string[] = [];
    const unusedCollections: { name: string; count: number }[] = [];

    for (const collectionName of collectionNames) {
      const count = await db.collection(collectionName).countDocuments();
      const isUsed = PRISMA_COLLECTIONS.includes(collectionName);

      if (isUsed) {
        usedCollections.push(collectionName);
        console.log(`✅ ${collectionName.padEnd(50)} ${count.toString().padStart(6)} documents (USED - Keeping)`);
      } else {
        unusedCollections.push({ name: collectionName, count });
        console.log(`⚠️  ${collectionName.padEnd(50)} ${count.toString().padStart(6)} documents (UNUSED - Will Delete)`);
      }
    }

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n📊 Summary:");
    console.log(`   ✅ Used Collections: ${usedCollections.length}`);
    console.log(`   ⚠️  Unused Collections: ${unusedCollections.length}`);

    if (unusedCollections.length === 0) {
      console.log("\n✨ No unused collections found! Database is clean.");
      await client.close();
      return;
    }

    console.log("\n🗑️  Unused Collections to Delete:");
    for (const collection of unusedCollections) {
      console.log(`   - ${collection.name} (${collection.count} documents)`);
    }

    // Ask for confirmation (in production, you might want to add a prompt)
    console.log("\n⚠️  WARNING: This will delete the following collections:");
    unusedCollections.forEach((c) => {
      console.log(`   - ${c.name} (${c.count} documents)`);
    });

    console.log("\n🗑️  Deleting unused collections...\n");

    let deletedCount = 0;
    let totalDocumentsDeleted = 0;

    for (const collection of unusedCollections) {
      try {
        const result = await db.collection(collection.name).drop();
        console.log(`   ✅ Deleted collection: ${collection.name} (${collection.count} documents)`);
        deletedCount++;
        totalDocumentsDeleted += collection.count;
      } catch (error: any) {
        console.log(`   ❌ Failed to delete ${collection.name}: ${error.message}`);
      }
    }

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n✨ Cleanup Complete!");
    console.log(`   ✅ Deleted ${deletedCount} unused collections`);
    console.log(`   📦 Removed ${totalDocumentsDeleted} documents from unused collections`);

    await client.close();
  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run cleanup
deleteUnusedCollections()
  .then(() => {
    console.log("\n✅ Script finished successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });












