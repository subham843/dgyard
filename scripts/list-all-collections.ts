/**
 * Script to list all MongoDB collections and identify unused ones
 * This helps identify collections that are not in Prisma schema
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

async function listCollections() {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL environment variable is not set");
    }

    const url = new URL(databaseUrl);
    const dbName = url.pathname.substring(1);

    console.log("🔍 Connecting to MongoDB...");
    const client = new MongoClient(databaseUrl);
    await client.connect();
    const db = client.db(dbName);

    console.log(`📊 Database: ${dbName}\n`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // Get all collections
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map((c) => c.name);

    console.log("\n📋 All Collections in Database:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    const usedCollections: string[] = [];
    const unusedCollections: { name: string; count: number }[] = [];

    for (const collectionName of collectionNames) {
      const count = await db.collection(collectionName).countDocuments();
      const isUsed = PRISMA_COLLECTIONS.includes(collectionName);

      if (isUsed) {
        usedCollections.push(collectionName);
        console.log(`✅ ${collectionName.padEnd(50)} ${count.toString().padStart(6)} documents (USED)`);
      } else {
        unusedCollections.push({ name: collectionName, count });
        console.log(`⚠️  ${collectionName.padEnd(50)} ${count.toString().padStart(6)} documents (UNUSED)`);
      }
    }

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n📊 Summary:");
    console.log(`   ✅ Used Collections: ${usedCollections.length}`);
    console.log(`   ⚠️  Unused Collections: ${unusedCollections.length}`);
    console.log(`   📦 Total Collections: ${collectionNames.length}`);

    if (unusedCollections.length > 0) {
      console.log("\n⚠️  Unused Collections (can be deleted):");
      for (const collection of unusedCollections) {
        console.log(`   - ${collection.name} (${collection.count} documents)`);
      }
      console.log("\n💡 To delete unused collections, run:");
      console.log("   npm run delete-unused-collections");
    } else {
      console.log("\n✨ No unused collections found! Database is clean.");
    }

    await client.close();
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

listCollections();












