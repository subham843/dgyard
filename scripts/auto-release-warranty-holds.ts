/**
 * Auto-Release Expired Warranty Holds
 * 
 * This script should be run as a cron job (every hour or as needed)
 * to automatically release warranty holds that have expired.
 * 
 * Usage:
 *   npx ts-node scripts/auto-release-warranty-holds.ts
 * 
 * Or set up as a cron job:
 *   0 * * * * cd /path/to/app && npx ts-node scripts/auto-release-warranty-holds.ts
 */

import { autoReleaseExpiredWarrantyHolds } from "../lib/services/warranty-hold";
import { prisma } from "../lib/prisma";

async function main() {
  console.log("🔍 Starting auto-release expired warranty holds job...");
  console.log(`⏰ Started at: ${new Date().toISOString()}\n`);

  try {
    const results = await autoReleaseExpiredWarrantyHolds();

    console.log(`✅ Processed ${results.length} warranty holds\n`);

    if (results.length === 0) {
      console.log("ℹ️  No expired warranty holds found.");
      return;
    }

    // Log results
    results.forEach((result, index) => {
      if (result.status === "released") {
        console.log(`✅ [${index + 1}] Warranty hold ${result.holdId}: RELEASED`);
      } else {
        console.error(`❌ [${index + 1}] Warranty hold ${result.holdId}: ERROR - ${result.error}`);
      }
    });

    const successCount = results.filter((r) => r.status === "released").length;
    const errorCount = results.filter((r) => r.status === "error").length;

    console.log(`\n📊 Summary:`);
    console.log(`   - Released: ${successCount}`);
    console.log(`   - Errors: ${errorCount}`);
    console.log(`\n✅ Job completed at: ${new Date().toISOString()}`);
  } catch (error: any) {
    console.error("❌ Fatal error in auto-release job:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  main()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error("Unhandled error:", error);
      process.exit(1);
    });
}

export default main;





