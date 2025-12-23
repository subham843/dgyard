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
      select: { id: true },
    });

    if (!technician) {
      return NextResponse.json(
        { error: "Technician profile not found" },
        { status: 404 }
      );
    }

    // Get job payments for calculations
    const jobPayments = await prisma.jobPayment.findMany({
      where: { technicianId: technician.id },
    });

    const totalCredits = jobPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalDebits = jobPayments.reduce((sum, p) => sum + (p.penaltyAmount || 0), 0);
    const lockedBalance = jobPayments.reduce((sum, p) => sum + (p.holdAmount || 0), 0);
    
    // Get withdrawals
    const withdrawals = await prisma.withdrawal.findMany({
      where: {
        technicianId: technician.id,
        status: "PAID",
      },
    });
    const withdrawnAmount = withdrawals.reduce((sum, w) => sum + (w.amount || 0), 0);
    
    const availableBalance = totalCredits - lockedBalance - withdrawnAmount;

    // Create ledger entries from payments
    const ledgerEntries = jobPayments.flatMap((payment) => {
      const entries = [];
      
      // Credit entry for payment
      if (payment.amount) {
        entries.push({
          id: `${payment.id}_credit`,
          type: "CREDIT" as const,
          amount: payment.amount,
          description: `Payment for job ${payment.jobId}`,
          reference: payment.id,
          createdAt: payment.createdAt.toISOString(),
          status: payment.status,
          remarks: "Job payment",
        });
      }

      // Debit entry for penalty
      if (payment.penaltyAmount) {
        entries.push({
          id: `${payment.id}_penalty`,
          type: "DEBIT" as const,
          amount: payment.penaltyAmount,
          description: `Penalty for job ${payment.jobId}`,
          reference: payment.id,
          createdAt: payment.createdAt.toISOString(),
          status: payment.status,
          remarks: "Penalty deduction",
        });
      }

      return entries;
    });

    // Add withdrawal entries
    withdrawals.forEach((withdrawal) => {
      ledgerEntries.push({
        id: `${withdrawal.id}_withdrawal`,
        type: "DEBIT" as const,
        amount: withdrawal.amount || 0,
        description: "Withdrawal",
        reference: withdrawal.id,
        createdAt: withdrawal.createdAt.toISOString(),
        status: withdrawal.status,
        remarks: `Withdrawal to ${withdrawal.bankAccountNumber?.slice(-4) || "bank"}`,
      });
    });

    // Sort by date (newest first)
    ledgerEntries.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({
      availableBalance: Math.max(0, availableBalance),
      lockedBalance,
      totalCredits,
      totalDebits,
      ledgerEntries: ledgerEntries.slice(0, 100), // Limit to 100 entries
    });
  } catch (error) {
    console.error("Error fetching wallet:", error);
    return NextResponse.json(
      { error: "Failed to fetch wallet data" },
      { status: 500 }
    );
  }
}





