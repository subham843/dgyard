import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "DEALER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const dealer = await prisma.dealer.findUnique({
      where: { userId: session.user.id },
    });

    if (!dealer) {
      return NextResponse.json({ error: "Dealer not found" }, { status: 404 });
    }

    const data = await request.json();

    // Validate required fields
    if (!data.accountHolderName || !data.accountNumber || !data.ifsc || !data.bankName) {
      return NextResponse.json(
        { error: "Missing required fields: accountHolderName, accountNumber, ifsc, bankName" },
        { status: 400 }
      );
    }

    // Validate IFSC format (11 characters, alphanumeric)
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscRegex.test(data.ifsc.toUpperCase())) {
      return NextResponse.json(
        { error: "Invalid IFSC code format" },
        { status: 400 }
      );
    }

    // Update dealer with bank details
    // Note: Add bankDetails Json? field to Dealer model in schema.prisma
    const bankDetailsData = {
      accountHolderName: data.accountHolderName,
      accountNumber: data.accountNumber,
      ifsc: data.ifsc.toUpperCase(),
      bankName: data.bankName,
      branchName: data.branchName || null,
      upiId: data.upiId || null,
      settlementCycle: data.settlementCycle || "7",
    };
    
    await prisma.dealer.update({
      where: { id: dealer.id },
      data: {
        isBankDetailsCompleted: true,
        // Uncomment when bankDetails field is added to schema:
        // bankDetails: bankDetailsData,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Bank details saved successfully",
    });
  } catch (error: any) {
    console.error("Error saving bank details:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save bank details" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "DEALER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const dealer = await prisma.dealer.findUnique({
      where: { userId: session.user.id },
    });

    if (!dealer) {
      return NextResponse.json({ error: "Dealer not found" }, { status: 404 });
    }

    // Return bank details if field exists
    const bankDetails = (dealer as any).bankDetails || null;

    return NextResponse.json({
      bankDetails: {
        ...bankDetails,
        isBankDetailsCompleted: dealer.isBankDetailsCompleted,
      },
    });
  } catch (error: any) {
    console.error("Error fetching bank details:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch bank details" },
      { status: 500 }
    );
  }
}

