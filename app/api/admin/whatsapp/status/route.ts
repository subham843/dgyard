import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getWhatsAppService } from "@/lib/whatsapp-web";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const service = getWhatsAppService();
    let status = service.getConnectionStatus();
    
    // If client exists but status shows disconnected, verify actual connection
    if (service.getClient() && !status.isConnected) {
      const isActuallyConnected = await service.verifyConnection();
      if (isActuallyConnected) {
        status = service.getConnectionStatus(); // Get updated status
      }
    }
    
    const qrCode = service.getQRCode();

    return NextResponse.json({
      ...status,
      qrCode,
    });
  } catch (error: any) {
    console.error("Error getting WhatsApp status:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get WhatsApp status" },
      { status: 500 }
    );
  }
}











