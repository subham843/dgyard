import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateServiceCommission, calculatePlatformFee } from "@/lib/services/payment-flow";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { totalAmount, jobType, city, region } = body;

    if (!totalAmount || totalAmount <= 0) {
      return NextResponse.json(
        { error: "Invalid total amount" },
        { status: 400 }
      );
    }

    // Get job to find dealer
    const job = await prisma.jobPost.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        dealerId: true,
        serviceType: true,
        dealer: {
          select: {
            city: true,
            state: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Calculate commission
    const commissionCalculation = await calculateServiceCommission({
      jobId: job.id,
      totalAmount,
      jobType: (jobType || job.serviceType) as any,
      city: city || job.dealer?.city || undefined,
      region: region || job.dealer?.state || undefined,
      dealerId: job.dealerId,
    });

    // Calculate platform fee
    const { platformFee, netServiceAmount } = await calculatePlatformFee({
      totalAmount,
      commissionType: commissionCalculation.commissionType,
      commissionValue: commissionCalculation.commissionValue,
    });

    return NextResponse.json({
      platformFee,
      netServiceAmount,
      commissionType: commissionCalculation.commissionType,
      commissionValue: commissionCalculation.commissionValue,
      totalAmount,
    });
  } catch (error: any) {
    console.error("Error calculating payment preview:", error);
    return NextResponse.json(
      { error: "Failed to calculate payment breakdown", details: error.message },
      { status: 500 }
    );
  }
}

