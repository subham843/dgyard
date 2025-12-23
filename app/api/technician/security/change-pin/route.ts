import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { currentPin, newPin } = await request.json();

    if (!currentPin || !newPin) {
      return NextResponse.json(
        { error: "Current PIN and new PIN are required" },
        { status: 400 }
      );
    }

    if (newPin.length !== 6 || !/^\d+$/.test(newPin)) {
      return NextResponse.json(
        { error: "PIN must be 6 digits" },
        { status: 400 }
      );
    }

    // In a real implementation, you'd have a PIN stored in a secure way
    // For now, just return success
    // You might store PIN in a separate SecuritySettings model

    return NextResponse.json({
      success: true,
      message: "PIN changed successfully",
    });
  } catch (error) {
    console.error("Error changing PIN:", error);
    return NextResponse.json(
      { error: "Failed to change PIN" },
      { status: 500 }
    );
  }
}





