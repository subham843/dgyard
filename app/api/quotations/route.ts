import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Generate unique quotation number in DGY01, DGY02 format
async function generateQuotationNumber(): Promise<string> {
  try {
    // Find the latest quotation number
    const latestQuotation = await prisma.quotation.findFirst({
      orderBy: { createdAt: "desc" },
      select: { quotationNumber: true },
    });

    if (latestQuotation && latestQuotation.quotationNumber.startsWith("DGY")) {
      // Extract the numeric part
      const numericPart = latestQuotation.quotationNumber.replace("DGY", "");
      const nextNumber = parseInt(numericPart, 10) + 1;
      // Format with leading zeros (DGY01, DGY02, ..., DGY99, DGY100, etc.)
      return `DGY${nextNumber.toString().padStart(2, "0")}`;
    }

    // If no quotation exists or format doesn't match, start from DGY01
    return "DGY01";
  } catch (error) {
    console.error("Error generating quotation number:", error);
    // Fallback: use timestamp-based number
    const timestamp = Date.now().toString().slice(-6);
    return `DGY${timestamp}`;
  }
}

// GET - Get user's quotations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const quotations = await prisma.quotation.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ quotations });
  } catch (error) {
    console.error("Error fetching quotations:", error);
    return NextResponse.json(
      { error: "Failed to fetch quotations" },
      { status: 500 }
    );
  }
}

// POST - Save quotation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      source,
      brandId,
      brandName,
      cameraTypeId,
      cameraTypeName,
      resolutionId,
      resolutionName,
      indoorCameraCount,
      outdoorCameraCount,
      wiringMeters,
      hddId,
      hddName,
      recordingDays,
      totalPrice,
      subtotal,
      tax,
      installationCost,
      wiringCost,
      hddCost,
      accessoriesCost,
      powerSupplyCost,
      recordingDeviceCost,
      calculationDetails,
      selectedProducts,
      notes,
      buttonAction,
    } = body;

    // Get user profile to check if complete
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, phone: true, phoneVerified: true },
    });

    if (!user?.name || !user?.email || !user?.phone) {
      return NextResponse.json(
        { error: "Please complete your profile before saving quotations" },
        { status: 400 }
      );
    }

    if (!user?.phoneVerified) {
      return NextResponse.json(
        { error: "Please verify your phone number with OTP before saving quotations" },
        { status: 400 }
      );
    }

    const quotationNumber = await generateQuotationNumber();

    const quotation = await prisma.quotation.create({
      data: {
        quotationNumber,
        userId: session.user.id,
        source: source || "HOME_CALCULATOR",
        status: "SAVED",
        brandId,
        brandName,
        cameraTypeId,
        cameraTypeName,
        resolutionId,
        resolutionName,
        indoorCameraCount: indoorCameraCount || 0,
        outdoorCameraCount: outdoorCameraCount || 0,
        wiringMeters: wiringMeters || 0,
        hddId,
        hddName,
        recordingDays: recordingDays || 0,
        totalPrice,
        subtotal,
        tax: tax || 0,
        installationCost: installationCost || 0,
        wiringCost: wiringCost || 0,
        hddCost: hddCost || 0,
        accessoriesCost: accessoriesCost || 0,
        powerSupplyCost: powerSupplyCost || 0,
        recordingDeviceCost: recordingDeviceCost || 0,
        calculationDetails: calculationDetails || {},
        selectedProducts: selectedProducts || {},
        userName: user.name,
        userEmail: user.email,
        userPhone: user.phone,
        notes,
        buttonAction: buttonAction || null, // Track which button was pressed
      },
    });

    return NextResponse.json({ quotation }, { status: 201 });
  } catch (error) {
    console.error("Error saving quotation:", error);
    return NextResponse.json(
      { error: "Failed to save quotation" },
      { status: 500 }
    );
  }
}

