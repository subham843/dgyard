import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    try {
      // Check if user exists with this email
      let userRecord;
      try {
        userRecord = await adminAuth.getUserByEmail(email);
      } catch (error: any) {
        // User doesn't exist yet, that's fine - we'll create during registration
        // For now, just return success so verification link can be sent
        return NextResponse.json({
          success: true,
          message: "Email verification will be sent during registration",
        });
      }

      // If user exists, send verification email
      if (userRecord && !userRecord.emailVerified) {
        const link = await adminAuth.generateEmailVerificationLink(email);
        
        // In production, send this link via email service
        // For now, return it (client should send via email service)
        return NextResponse.json({
          success: true,
          message: "Email verification link generated",
          verificationLink: link,
        });
      } else if (userRecord && userRecord.emailVerified) {
        return NextResponse.json({
          success: true,
          message: "Email already verified",
          emailVerified: true,
        });
      }

      return NextResponse.json({
        success: true,
        message: "Email verification link will be sent",
      });
    } catch (error: any) {
      console.error("Firebase email verification error:", error);
      return NextResponse.json(
        { error: "Failed to process email verification. Please try again." },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error sending email verification:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send email verification" },
      { status: 500 }
    );
  }
}












