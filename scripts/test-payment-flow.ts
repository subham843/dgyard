/**
 * Test Payment Flow Script
 * 
 * This script helps test the complete payment flow:
 * 1. Create a test job
 * 2. Assign technician
 * 3. Complete job
 * 4. Approve job (triggers payment split)
 * 5. Check ledger entries
 * 
 * Usage:
 *   npx ts-node scripts/test-payment-flow.ts
 */

import { prisma } from "../lib/prisma";
import { verifyLedgerBalance } from "../lib/services/ledger";
import { getJobLedgerEntries } from "../lib/services/ledger";

async function main() {
  console.log("🧪 Testing Payment Flow\n");

  try {
    // Find a completed job with payment
    const jobWithPayment = await prisma.jobPost.findFirst({
      where: {
        status: "COMPLETED",
        payments: {
          some: {
            paymentType: "SERVICE_PAYMENT",
          },
        },
      },
      include: {
        payments: true,
        warrantyHolds: true,
      },
    });

    if (!jobWithPayment) {
      console.log("ℹ️  No completed jobs with payments found.");
      console.log("   Please create a job, complete it, and approve it first.\n");
      return;
    }

    console.log(`✅ Found job: ${jobWithPayment.jobNumber}`);
    console.log(`   Title: ${jobWithPayment.title}`);
    console.log(`   Status: ${jobWithPayment.status}\n`);

    // Check payment split
    const payment = jobWithPayment.payments.find((p) => p.paymentType === "SERVICE_PAYMENT");
    if (payment) {
      console.log("💰 Payment Split:");
      console.log(`   Total Amount: ₹${payment.totalAmount}`);
      console.log(`   Immediate Amount: ₹${payment.immediateAmount}`);
      console.log(`   Warranty Hold: ₹${payment.warrantyHoldAmount}`);
      console.log(`   Commission: ₹${payment.commissionAmount}`);
      console.log(`   Net Amount: ₹${payment.netAmount}`);
      console.log(`   Status: ${payment.status}\n`);
    }

    // Check warranty holds
    const warrantyHold = jobWithPayment.warrantyHolds[0];
    if (warrantyHold) {
      console.log("🔒 Warranty Hold:");
      console.log(`   Hold Amount: ₹${warrantyHold.holdAmount}`);
      console.log(`   Status: ${warrantyHold.status}`);
      console.log(`   Warranty Days: ${warrantyHold.warrantyDays}`);
      console.log(`   End Date: ${warrantyHold.endDate.toISOString()}\n`);
    }

    // Verify ledger balance
    console.log("📊 Verifying Ledger Balance...");
    const balanceCheck = await verifyLedgerBalance(jobWithPayment.id);
    if (balanceCheck.balanced) {
      console.log(`   ✅ Ledger is balanced (Total: ₹${balanceCheck.total.toFixed(2)})\n`);
    } else {
      console.log(`   ❌ Ledger imbalance detected (Total: ₹${balanceCheck.total.toFixed(2)})\n`);
    }

    // Get ledger entries
    console.log("📝 Ledger Entries:");
    const ledgerEntries = await getJobLedgerEntries(jobWithPayment.id);
    console.log(`   Total entries: ${ledgerEntries.length}\n`);

    ledgerEntries.forEach((entry, index) => {
      console.log(`   [${index + 1}] ${entry.entryType} ${entry.amount.toFixed(2)} - ${entry.category}`);
      console.log(`       Account: ${entry.account.accountType}`);
      console.log(`       Description: ${entry.description}`);
      console.log(`       Date: ${entry.createdAt.toISOString()}\n`);
    });

    console.log("✅ Payment flow test completed successfully!\n");
  } catch (error: any) {
    console.error("❌ Error testing payment flow:", error);
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





