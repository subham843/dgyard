#!/usr/bin/env tsx

/**
 * BullMQ Workers Startup Script
 * 
 * This script starts all background workers for processing jobs.
 * Run this in a separate process from your Next.js server.
 * 
 * Usage:
 *   npm run workers
 *   or
 *   tsx scripts/start-workers.ts
 */

import { emailWorker, notificationWorker, orderWorker } from "../lib/queue";

console.log("🚀 Starting BullMQ Workers...");

// Handle worker events
emailWorker.on("completed", (job) => {
  console.log(`✅ Email job ${job.id} completed`);
});

emailWorker.on("failed", (job, err) => {
  console.error(`❌ Email job ${job?.id} failed:`, err.message);
});

notificationWorker.on("completed", (job) => {
  console.log(`✅ Notification job ${job.id} completed`);
});

notificationWorker.on("failed", (job, err) => {
  console.error(`❌ Notification job ${job?.id} failed:`, err.message);
});

orderWorker.on("completed", (job) => {
  console.log(`✅ Order job ${job.id} completed`);
});

orderWorker.on("failed", (job, err) => {
  console.error(`❌ Order job ${job?.id} failed:`, err.message);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("🛑 Shutting down workers...");
  await emailWorker.close();
  await notificationWorker.close();
  await orderWorker.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("🛑 Shutting down workers...");
  await emailWorker.close();
  await notificationWorker.close();
  await orderWorker.close();
  process.exit(0);
});

console.log("✅ All workers started successfully!");
console.log("📧 Email Worker: Running");
console.log("🔔 Notification Worker: Running");
console.log("📦 Order Worker: Running");
console.log("\nPress Ctrl+C to stop workers");




















