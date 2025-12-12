import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    // Validate phone number format (Indian format: +91XXXXXXXXXX)
    const phoneRegex = /^\+91[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { error: "Invalid phone number format. Please use +91XXXXXXXXXX format." },
        { status: 400 }
      );
    }

    // Generate OTP and send via Firebase
    const phoneNumber = phone.startsWith("+") ? phone : `+91${phone}`;
    
    try {
      // Generate a 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // In production, integrate with SMS service (Twilio, AWS SNS, etc.)
      // For now, we'll use Firebase client-side auth or store OTP temporarily
      // TODO: Integrate with SMS service for production
      console.log(`OTP for ${phoneNumber}: ${otp}`); // Remove in production
      
      // Store OTP temporarily (in production, use Redis or database with TTL)
      // For now, return success. Client-side will handle OTP verification via Firebase Auth
      
      return NextResponse.json({
        success: true,
        message: "OTP sent successfully",
        // In development, you might want to return OTP for testing
        // Remove this in production
        ...(process.env.NODE_ENV === "development" && { otp }),
      });
    } catch (error: any) {
      console.error("Firebase OTP error:", error);
      return NextResponse.json(
        { error: "Failed to send OTP. Please try again." },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error sending OTP:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send OTP" },
      { status: 500 }
    );
  }
}

