/**
 * Background Tasks API
 * 
 * Endpoint to trigger background tasks for job management
 * Should be called via cron job or scheduled task
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { runAllBackgroundTasks } from "@/lib/services/job-background-tasks";

export async function POST(request: NextRequest) {
  try {
    // Optional: Require admin authentication for security
    // For now, allow unauthenticated (for cron jobs)
    const session = await getServerSession(authOptions);
    
    // If session exists, verify admin
    if (session && session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized - Admin only" },
        { status: 403 }
      );
    }

    // Optional: Add API key check for cron jobs
    const apiKey = request.headers.get("x-api-key");
    const expectedApiKey = process.env.BACKGROUND_TASKS_API_KEY;
    
    if (expectedApiKey && apiKey !== expectedApiKey) {
      return NextResponse.json(
        { error: "Invalid API key" },
        { status: 401 }
      );
    }

    // Run all background tasks
    const results = await runAllBackgroundTasks();

    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error running background tasks:", error);
    return NextResponse.json(
      { error: error.message || "Failed to run background tasks" },
      { status: 500 }
    );
  }
}

// GET endpoint for health check
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Background tasks endpoint is running",
    timestamp: new Date().toISOString(),
  });
}

