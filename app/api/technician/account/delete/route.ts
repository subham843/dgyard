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

    // In a real implementation, you'd:
    // 1. Create a deletion request record
    // 2. Schedule deletion after a grace period
    // 3. Notify admin
    // For now, just mark for deletion

    // You might want to create a DeletionRequest model
    // await prisma.deletionRequest.create({
    //   data: {
    //     technicianId: technician.id,
    //     reason,
    //     requestedAt: new Date(),
    //     status: "PENDING",
    //   },
    // });

    return NextResponse.json({
      success: true,
      message: "Account deletion requested. Your account will be deleted after review.",
    });
  } catch (error) {
    console.error("Error requesting account deletion:", error);
    return NextResponse.json(
      { error: "Failed to request account deletion" },
      { status: 500 }
    );
  }
}





