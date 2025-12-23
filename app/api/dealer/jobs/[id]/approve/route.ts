/**
 * Dealer Job Approval API
 * 
 * This is a convenience endpoint for dealers to approve jobs.
 * It calls the main job approval endpoint.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: jobId } = await params;
    const data = await request.json();

    // Forward to main job approval endpoint
    const baseUrl = process.env.APP_URL || "http://localhost:3000";
    const approvalUrl = `${baseUrl}/api/jobs/${jobId}/approve`;

    const response = await fetch(approvalUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: request.headers.get("Cookie") || "",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(result, { status: response.status });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error approving job:", error);
    return NextResponse.json(
      { error: error.message || "Failed to approve job" },
      { status: 500 }
    );
  }
}





