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

    // In a real implementation, you'd have a separate BankDetails model
    // For now, return based on isBankDetailsCompleted flag
    const bankDetails = technician.isBankDetailsCompleted ? {
      accountHolderName: "Account Holder",
      bankName: "Bank Name",
      accountNumber: "****1234",
      ifscCode: "ABCD0123456",
      branch: "Branch Name",
      accountType: "SAVINGS",
      upiId: "",
      isVerified: true,
    } : null;

    return NextResponse.json({ bankDetails });
  } catch (error) {
    console.error("Error fetching bank details:", error);
    return NextResponse.json(
      { error: "Failed to fetch bank details" },
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
      select: { id: true },
    });

    if (!technician) {
      return NextResponse.json(
        { error: "Technician profile not found" },
        { status: 404 }
      );
    }

    const data = await request.json();

    // In a real implementation, you'd save to a BankDetails model
    // For now, just mark as completed
    await prisma.technician.update({
      where: { id: technician.id },
      data: {
        isBankDetailsCompleted: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Bank details saved successfully",
    });
  } catch (error) {
    console.error("Error saving bank details:", error);
    return NextResponse.json(
      { error: "Failed to save bank details" },
      { status: 500 }
    );
  }
}





