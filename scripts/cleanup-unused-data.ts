/**
 * Cleanup script to delete unused/old database collections and data
 * This script removes:
 * - Old expired sessions
 * - Old expired verification tokens
 * - Old price calculations (if not needed)
 * - Old AI conversation data
 * - Old audit requests and results
 * - Old leads
 * - Expired connected accounts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanup() {
  console.log("🧹 Starting database cleanup...\n");

  try {
    // 1. Delete expired sessions
    console.log("1. Cleaning expired sessions...");
    const expiredSessions = await prisma.session.deleteMany({
      where: {
        expires: {
          lt: new Date(),
        },
      },
    });
    console.log(`   ✅ Deleted ${expiredSessions.count} expired sessions`);

    // 2. Delete expired verification tokens
    console.log("2. Cleaning expired verification tokens...");
    const expiredTokens = await prisma.verificationToken.deleteMany({
      where: {
        expires: {
          lt: new Date(),
        },
      },
    });
    console.log(`   ✅ Deleted ${expiredTokens.count} expired verification tokens`);

    // 3. Delete old price calculations (older than 30 days)
    console.log("3. Cleaning old price calculations...");
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const oldPriceCalculations = await prisma.priceCalculation.deleteMany({
      where: {
        createdAt: {
          lt: thirtyDaysAgo,
        },
      },
    });
    console.log(`   ✅ Deleted ${oldPriceCalculations.count} old price calculations`);

    // 4. Delete old AI conversation data (older than 90 days, low quality)
    console.log("4. Cleaning old AI conversation data...");
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    // Delete old low-quality AI conversations
    const oldAIConversations = await prisma.aIConversation.deleteMany({
      where: {
        createdAt: {
          lt: ninetyDaysAgo,
        },
        OR: [
          { qualityScore: { lt: 0.3 } },
          { qualityScore: null },
        ],
      },
    });
    console.log(`   ✅ Deleted ${oldAIConversations.count} old low-quality AI conversations`);

    // Delete old AI learning patterns with low confidence
    const oldAIPatterns = await prisma.aILearningPattern.deleteMany({
      where: {
        createdAt: {
          lt: ninetyDaysAgo,
        },
        confidence: {
          lt: 0.3,
        },
        usageCount: {
          lt: 3,
        },
      },
    });
    console.log(`   ✅ Deleted ${oldAIPatterns.count} old low-confidence AI patterns`);

    // 5. Delete old audit requests and results (older than 180 days)
    console.log("5. Cleaning old audit data...");
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    // Delete old audit results first (due to foreign key)
    const oldAuditResults = await prisma.auditResult.deleteMany({
      where: {
        auditRequest: {
          createdAt: {
            lt: sixMonthsAgo,
          },
        },
      },
    });
    console.log(`   ✅ Deleted ${oldAuditResults.count} old audit results`);

    // Delete old audit requests
    const oldAuditRequests = await prisma.auditRequest.deleteMany({
      where: {
        createdAt: {
          lt: sixMonthsAgo,
        },
      },
    });
    console.log(`   ✅ Deleted ${oldAuditRequests.count} old audit requests`);

    // 6. Delete old leads (older than 90 days, not converted)
    console.log("6. Cleaning old unconverted leads...");
    const oldLeads = await prisma.lead.deleteMany({
      where: {
        createdAt: {
          lt: ninetyDaysAgo,
        },
        status: {
          not: "CONVERTED",
        },
      },
    });
    console.log(`   ✅ Deleted ${oldLeads.count} old unconverted leads`);

    // 7. Delete expired connected accounts
    console.log("7. Cleaning expired connected accounts...");
    const expiredAccounts = await prisma.connectedAccount.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
    console.log(`   ✅ Deleted ${expiredAccounts.count} expired connected accounts`);

    // 8. Delete old quotations (DRAFT status, older than 30 days)
    console.log("8. Cleaning old draft quotations...");
    const oldDraftQuotations = await prisma.quotation.deleteMany({
      where: {
        status: "DRAFT",
        createdAt: {
          lt: thirtyDaysAgo,
        },
      },
    });
    console.log(`   ✅ Deleted ${oldDraftQuotations.count} old draft quotations`);

    // 9. Delete old cancelled bookings (older than 90 days)
    console.log("9. Cleaning old cancelled bookings...");
    const oldCancelledBookings = await prisma.booking.deleteMany({
      where: {
        status: "CANCELLED",
        createdAt: {
          lt: ninetyDaysAgo,
        },
      },
    });
    console.log(`   ✅ Deleted ${oldCancelledBookings.count} old cancelled bookings`);

    // 10. Delete old cancelled orders (older than 90 days)
    console.log("10. Cleaning old cancelled orders...");
    const oldCancelledOrders = await prisma.order.deleteMany({
      where: {
        status: "CANCELLED",
        createdAt: {
          lt: ninetyDaysAgo,
        },
      },
    });
    console.log(`   ✅ Deleted ${oldCancelledOrders.count} old cancelled orders`);

    console.log("\n✨ Database cleanup completed successfully!");
    
    // Summary
    const totalDeleted = 
      expiredSessions.count +
      expiredTokens.count +
      oldPriceCalculations.count +
      oldAIConversations.count +
      oldAIPatterns.count +
      oldAuditResults.count +
      oldAuditRequests.count +
      oldLeads.count +
      expiredAccounts.count +
      oldDraftQuotations.count +
      oldCancelledBookings.count +
      oldCancelledOrders.count;
    
    console.log(`\n📊 Total records deleted: ${totalDeleted}`);
    
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run cleanup
cleanup()
  .then(() => {
    console.log("\n✅ Cleanup script finished");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Cleanup script failed:", error);
    process.exit(1);
  });












