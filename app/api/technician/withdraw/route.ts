import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const technician = await prisma.technician.findUnique({
      where: { userId: session.user.id },
      select: { id: true, isBankDetailsCompleted: true },
    });

    if (!technician) {
      return NextResponse.json(
        { error: "Technician profile not found" },
        { status: 404 }
      );
    }

    // Get available balance
    const jobPayments = await prisma.jobPayment.findMany({
      where: { technicianId: technician.id },
    });
    const totalCredits = jobPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const lockedBalance = jobPayments.reduce((sum, p) => sum + (p.holdAmount || 0), 0);
    const withdrawals = await prisma.withdrawal.findMany({
      where: { technicianId: technician.id, status: "PAID" },
    });
    const withdrawnAmount = withdrawals.reduce((sum, w) => sum + (w.amount || 0), 0);
    const availableBalance = totalCredits - lockedBalance - withdrawnAmount;

    // Get bank details (simplified - you may need a separate BankDetails model)
    const bankDetails = technician.isBankDetailsCompleted ? {
      accountHolderName: "Account Holder",
      bankName: "Bank Name",
      accountNumber: "****1234",
      ifscCode: "ABCD0123456",
    } : null;

    // Get withdrawal history
    const withdrawalHistory = await prisma.withdrawal.findMany({
      where: { technicianId: technician.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      availableBalance: Math.max(0, availableBalance),
      minimumWithdrawLimit: 500,
      payoutTimeline: "3-5 business days",
      bankDetails,
      withdrawalHistory: withdrawalHistory.map((w) => ({
        id: w.id,
        amount: w.amount || 0,
        status: w.status,
        requestedAt: w.createdAt.toISOString(),
        processedAt: w.processedAt?.toISOString(),
        bankReference: w.bankReference,
        upiReference: w.upiReference,
      })),
    });
  } catch (error) {
    console.error("Error fetching withdrawal data:", error);
    return NextResponse.json(
      { error: "Failed to fetch withdrawal data" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const technician = await prisma.technician.findUnique({
      where: { userId: session.user.id },
      select: { id: true, isBankDetailsCompleted: true },
    });

    if (!technician) {
      return NextResponse.json(
        { error: "Technician profile not found" },
        { status: 404 }
      );
    }

    if (!technician.isBankDetailsCompleted) {
      return NextResponse.json(
        { error: "Bank details not completed" },
        { status: 400 }
      );
    }

    const { amount } = await request.json();

    if (!amount || amount < 500) {
      return NextResponse.json(
        { error: "Minimum withdrawal amount is ₹500" },
        { status: 400 }
      );
    }

    // Calculate available balance
    const jobPayments = await prisma.jobPayment.findMany({
      where: { technicianId: technician.id },
    });
    const totalCredits = jobPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const lockedBalance = jobPayments.reduce((sum, p) => sum + (p.holdAmount || 0), 0);
    const withdrawals = await prisma.withdrawal.findMany({
      where: { technicianId: technician.id, status: "PAID" },
    });
    const withdrawnAmount = withdrawals.reduce((sum, w) => sum + (w.amount || 0), 0);
    const availableBalance = totalCredits - lockedBalance - withdrawnAmount;

    if (amount > availableBalance) {
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 400 }
      );
    }

    // Create withdrawal request
    const withdrawal = await prisma.withdrawal.create({
      data: {
        technicianId: technician.id,
        amount: parseFloat(amount),
        status: "PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      withdrawal: {
        id: withdrawal.id,
        amount: withdrawal.amount,
        status: withdrawal.status,
      },
    });
  } catch (error) {
    console.error("Error creating withdrawal:", error);
    return NextResponse.json(
      { error: "Failed to create withdrawal request" },
      { status: 500 }
    );
  }
}





