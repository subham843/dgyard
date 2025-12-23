import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { reason } = await request.json();

    if (!reason) {
      return NextResponse.json(
        { error: "Reason is required" },
        { status: 400 }
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

    // Deactivate account (set status to SUSPENDED or add isActive flag)
    await prisma.technician.update({
      where: { id: technician.id },
      data: {
        accountStatus: "SUSPENDED",
      },
    });

    // In a real implementation, you'd also log the deactivation reason

    return NextResponse.json({
      success: true,
      message: "Account deactivated successfully",
    });
  } catch (error) {
    console.error("Error deactivating account:", error);
    return NextResponse.json(
      { error: "Failed to deactivate account" },
      { status: 500 }
    );
  }
}





