import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email || "" },
      select: { role: true },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Return default AI rules (adjust based on your schema)
    const rules = [
      {
        id: "1",
        name: "Trust Score Calculation",
        type: "TRUST_SCORE",
        enabled: true,
        formula: "(completed_jobs * 0.4) + (rating * 0.3) - (complaints * 0.3)",
        conditions: ["Job completion rate > 80%", "Rating > 4.0"],
        action: "Calculate and update trust score",
        triggerCount: 1250,
        lastTriggered: new Date(),
      },
      {
        id: "2",
        name: "Auto Hold Percentage",
        type: "HOLD_PERCENT",
        enabled: true,
        formula: "base_hold + (risk_score * 0.1)",
        conditions: ["New technician", "Trust score < 70"],
        action: "Increase hold percentage automatically",
        triggerCount: 342,
        lastTriggered: new Date(),
      },
      {
        id: "3",
        name: "Auto Freeze on Complaint",
        type: "AUTO_FREEZE",
        enabled: true,
        formula: "Freeze 100% of job amount",
        conditions: ["Complaint received", "Severity = HIGH"],
        action: "Freeze hold amount immediately",
        triggerCount: 89,
        lastTriggered: new Date(),
      },
      {
        id: "4",
        name: "Fraud Detection",
        type: "FRAUD_DETECTION",
        enabled: true,
        formula: "Risk score = (low_bid_flag * 0.5) + (low_trust * 0.3) + (pattern_anomaly * 0.2)",
        conditions: ["Bid amount < 50% of average", "Trust score < 50"],
        action: "Flag as suspicious and alert admin",
        triggerCount: 156,
        lastTriggered: new Date(),
      },
    ];

    return NextResponse.json({ rules });
  } catch (error: any) {
    console.error("Error fetching AI rules:", error);
    return NextResponse.json(
      { error: "Failed to fetch rules", details: error.message },
      { status: 500 }
    );
  }
}

