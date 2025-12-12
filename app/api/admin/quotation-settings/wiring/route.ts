import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const wirings = await prisma.quotationWiring.findMany({
      where: {
        active: true,
      },
      include: {
        category: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ wirings });
  } catch (error) {
    console.error("Error fetching wirings:", error);
    return NextResponse.json(
      { error: "Failed to fetch wirings" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { categoryId, cableName, pricePerMeter, wirePricePerMeter, wiringChargePerMeter, shortDetail } = body;

    if (!categoryId || !cableName) {
      return NextResponse.json(
        { error: "Category and Cable Name are required" },
        { status: 400 }
      );
    }

    // Validate wire price and wiring charge
    if (wirePricePerMeter === undefined || wirePricePerMeter === null || wirePricePerMeter === "") {
      return NextResponse.json(
        { error: "Wire Price Per Meter is required" },
        { status: 400 }
      );
    }

    if (wiringChargePerMeter === undefined || wiringChargePerMeter === null || wiringChargePerMeter === "") {
      return NextResponse.json(
        { error: "Wiring Charge Per Meter is required" },
        { status: 400 }
      );
    }

    // Calculate total price per meter from wire price + wiring charge, or use provided total
    const wirePrice = parseFloat(wirePricePerMeter.toString());
    const wiringCharge = parseFloat(wiringChargePerMeter.toString());
    const totalPricePerMeter = pricePerMeter ? parseFloat(pricePerMeter.toString()) : (wirePrice + wiringCharge);

    if (isNaN(wirePrice) || isNaN(wiringCharge)) {
      return NextResponse.json(
        { error: "Invalid number format for wire price or wiring charge" },
        { status: 400 }
      );
    }

    if (wirePrice < 0 || wiringCharge < 0) {
      return NextResponse.json(
        { error: "Wire Price and Wiring Charge must be greater than or equal to 0" },
        { status: 400 }
      );
    }

    if (isNaN(totalPricePerMeter) || totalPricePerMeter <= 0) {
      return NextResponse.json(
        { error: "Total Price Per Meter must be greater than 0" },
        { status: 400 }
      );
    }

    // Build data object
    const wiringData: any = {
      categoryId,
      cableName,
      pricePerMeter: totalPricePerMeter,
      shortDetail: shortDetail || null,
      wirePricePerMeter: wirePrice,
      wiringChargePerMeter: wiringCharge,
    };

    const wiring = await prisma.quotationWiring.create({
      data: wiringData,
      include: {
        category: true,
      },
    });

    return NextResponse.json({ wiring }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating wiring:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      meta: error.meta,
    });
    
    // Return more detailed error message
    let errorMessage = "Failed to create wiring";
    if (error.code === "P2002") {
      errorMessage = "A wiring configuration with this name already exists";
    } else if (error.message?.includes("Unknown argument") || error.message?.includes("wirePricePerMeter") || error.message?.includes("wiringChargePerMeter")) {
      errorMessage = "Database schema needs update. Please run: npx prisma db push";
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { error: errorMessage, details: error.message },
      { status: 500 }
    );
  }
}

