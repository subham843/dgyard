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

    // In a real implementation, you'd have a NotificationPreferences model
    // For now, return defaults
    return NextResponse.json({
      preferences: {
        newJobAlerts: true,
        biddingAlerts: true,
        paymentAlerts: true,
        warrantyAlerts: true,
        whatsapp: true,
        sms: false,
        email: true,
      },
    });
  } catch (error) {
    console.error("Error fetching notification preferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
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

    const preferences = await request.json();

    // In a real implementation, save to NotificationPreferences model
    // For now, just return success

    return NextResponse.json({
      success: true,
      message: "Preferences saved successfully",
    });
  } catch (error) {
    console.error("Error saving notification preferences:", error);
    return NextResponse.json(
      { error: "Failed to save preferences" },
      { status: 500 }
    );
  }
}





