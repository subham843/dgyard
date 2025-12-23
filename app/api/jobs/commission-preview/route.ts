/**
 * Commission Preview API
 * 
 * Calculate commission for job posting preview (before posting)
 * This helps dealers see commission breakdown before submitting the job
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { calculateServiceCommission } from "@/lib/services/commission-calculator";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { jobAmount, serviceCategoryId, serviceSubCategoryId, city, state } = data;

    if (!jobAmount || jobAmount <= 0) {
      return NextResponse.json(
        { error: "Job amount must be greater than 0" },
        { status: 400 }
      );
    }

    // Get dealer info for dealer-specific commission rules
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { dealer: true },
    });

    if (!user || user.role !== "DEALER") {
      return NextResponse.json(
        { error: "Only dealers can preview commission" },
        { status: 403 }
      );
    }

    // Get service category info to determine job type
    let jobType: any = undefined;
    if (serviceCategoryId) {
      const category = await prisma.serviceCategory.findUnique({
        where: { id: serviceCategoryId },
        select: { title: true },
      });
      // Map category title to JobType enum if needed
      // For now, we'll pass it as-is and let the calculator handle it
    }

    // Calculate commission
    const commissionResult = await calculateServiceCommission({
      jobId: "PREVIEW", // Dummy ID for preview
      totalAmount: parseFloat(jobAmount),
      serviceCategoryId: serviceCategoryId || undefined,
      serviceSubCategoryId: serviceSubCategoryId || undefined,
      city: city || user.dealer?.city || undefined,
      region: state || user.dealer?.state || undefined,
      dealerId: session.user.id,
    });

    // Calculate net technician payout
    const netTechnicianPayout = commissionResult.netAmount;

    return NextResponse.json({
      success: true,
      commission: {
        type: commissionResult.commissionType,
        value: commissionResult.commissionValue,
        amount: commissionResult.commissionAmount,
        netAmount: commissionResult.netAmount,
      },
      jobAmount: parseFloat(jobAmount),
      netTechnicianPayout,
      breakdown: {
        jobAmount: parseFloat(jobAmount),
        platformCommission: commissionResult.commissionAmount,
        netTechnicianPayout: netTechnicianPayout,
      },
    });
  } catch (error: any) {
    console.error("Error calculating commission preview:", error);
    return NextResponse.json(
      { error: error.message || "Failed to calculate commission preview" },
      { status: 500 }
    );
  }
}

