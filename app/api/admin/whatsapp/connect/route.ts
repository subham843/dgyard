import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getWhatsAppService } from "@/lib/whatsapp-web";

export async function POST() {
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
    await service.initialize();

    return NextResponse.json({
      success: true,
      message: "WhatsApp Web connection initiated",
    });
  } catch (error: any) {
    console.error("Error connecting WhatsApp:", error);
    return NextResponse.json(
      { error: error.message || "Failed to connect WhatsApp" },
      { status: 500 }
    );
  }
}











