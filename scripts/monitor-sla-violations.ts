/**
 * SLA Monitoring Job
 * 
 * Monitors jobs for SLA violations and sends alerts/notifications.
 * 
 * Usage:
 *   npx ts-node scripts/monitor-sla-violations.ts
 * 
 * Or set up as a cron job (every 30 minutes):
 *   */30 * * * * cd /path/to/app && npx ts-node scripts/monitor-sla-violations.ts
 */

import { checkSLAViolations } from "../lib/services/ai-automation";
import { prisma } from "../lib/prisma";
import { sendEmail } from "../lib/email";
import { sendWhatsAppMessage } from "../lib/whatsapp";

async function main() {
  console.log("🔍 Starting SLA monitoring job...");
  console.log(`⏰ Started at: ${new Date().toISOString()}\n`);

  try {
    // Get active jobs
    const activeJobs = await prisma.jobPost.findMany({
      where: {
        status: { in: ["ASSIGNED", "IN_PROGRESS"] },
      },
      include: {
        dealer: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        technician: {
          include: {
            user: {
              select: {
                email: true,
              },
            },
          },
        },
      },
    });

    console.log(`📋 Found ${activeJobs.length} active jobs to monitor\n`);

    const violations: any[] = [];

    for (const job of activeJobs) {
      const result = await checkSLAViolations(job.id);

      if (result.violations.length > 0) {
        violations.push({
          job,
          violations: result.violations,
        });

        console.log(`⚠️  SLA violations for job ${job.jobNumber}:`);
        result.violations.forEach((violation) => {
          console.log(`   - ${violation}`);
        });
        console.log("");

        // Send notifications
        try {
          // Notify technician
          if (job.technician?.user?.email) {
            await sendEmail({
              to: job.technician.user.email,
              subject: `SLA Alert - Job ${job.jobNumber}`,
              html: `
                <h2>SLA Violation Alert</h2>
                <p>Job: ${job.jobNumber} - ${job.title}</p>
                <ul>
                  ${result.violations.map((v) => `<li>${v}</li>`).join("")}
                </ul>
                <p>Please take immediate action to resolve these issues.</p>
              `,
            });
          }

          // Notify dealer
          if (job.dealer?.email) {
            await sendEmail({
              to: job.dealer.email,
              subject: `SLA Alert - Job ${job.jobNumber}`,
              html: `
                <h2>SLA Violation Alert</h2>
                <p>Job: ${job.jobNumber} - ${job.title}</p>
                <ul>
                  ${result.violations.map((v) => `<li>${v}</li>`).join("")}
                </ul>
                <p>The technician has been notified. Please monitor the situation.</p>
              `,
            });
          }
        } catch (error) {
          console.error(`Error sending notifications for job ${job.jobNumber}:`, error);
        }
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   - Jobs monitored: ${activeJobs.length}`);
    console.log(`   - Violations found: ${violations.length}`);
    console.log(`\n✅ Job completed at: ${new Date().toISOString()}`);
  } catch (error: any) {
    console.error("❌ Fatal error in SLA monitoring job:", error);
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





