import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { categoryId, cableName, pricePerMeter, wirePricePerMeter, wiringChargePerMeter, shortDetail } = body;

    // Calculate total price per meter from wire price + wiring charge, or use provided total
    let updateData: any = {
      ...(categoryId && { categoryId }),
      ...(cableName && { cableName }),
      ...(shortDetail !== undefined && { shortDetail: shortDetail || null }),
    };

    // If wirePricePerMeter or wiringChargePerMeter are provided, calculate total
    if (wirePricePerMeter !== undefined || wiringChargePerMeter !== undefined) {
      const wirePrice = wirePricePerMeter ? parseFloat(wirePricePerMeter) : 0;
      const wiringCharge = wiringChargePerMeter ? parseFloat(wiringChargePerMeter) : 0;
      const totalPrice = wirePrice + wiringCharge;
      updateData.pricePerMeter = totalPrice;
      updateData.wirePricePerMeter = wirePrice > 0 ? wirePrice : null;
      updateData.wiringChargePerMeter = wiringCharge > 0 ? wiringCharge : null;
    } else if (pricePerMeter !== undefined) {
      // If only total pricePerMeter is provided, use it directly
      updateData.pricePerMeter = parseFloat(pricePerMeter);
    }

    const wiring = await prisma.quotationWiring.update({
      where: { id: params.id },
      data: updateData,
      include: {
        category: true,
      },
    });

    return NextResponse.json({ wiring });
  } catch (error) {
    console.error("Error updating wiring:", error);
    return NextResponse.json(
      { error: "Failed to update wiring" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.quotationWiring.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting wiring:", error);
    return NextResponse.json(
      { error: "Failed to delete wiring" },
      { status: 500 }
    );
  }
}

