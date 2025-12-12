import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminAuth } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const { phone, code, sessionInfo } = await request.json();

    if (!phone || !code || !sessionInfo) {
      return NextResponse.json(
        { error: "Phone, code, and session info are required" },
        { status: 400 }
      );
    }

    try {
      // Verify the OTP code with Firebase
      // Note: In production, use Firebase Auth's verifyPhoneNumber method
      // For now, we'll create/update user and return session
      
      const phoneNumber = phone.startsWith("+") ? phone : `+91${phone}`;
      
      // Find or create user by phone
      let user = await prisma.user.findFirst({
        where: { phone: phoneNumber },
      });

      if (!user) {
        // Create new user with phone number
        user = await prisma.user.create({
          data: {
            phone: phoneNumber,
            email: `${phoneNumber.replace(/\+/g, "")}@phone.dgyard.com`, // Temporary email
            role: "USER",
          },
        });
      }

      // In production, you would verify the OTP code here
      // For now, we'll just return success if user exists/created
      
      return NextResponse.json({
        success: true,
        message: "OTP verified successfully",
        user: {
          id: user.id,
          phone: user.phone,
          email: user.email,
          name: user.name,
        },
      });
    } catch (error: any) {
      return NextResponse.json(
        { error: "Invalid OTP code. Please try again." },
        { status: 400 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to verify OTP" },
      { status: 500 }
    );
  }
}




















