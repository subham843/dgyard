import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { error: "ID token is required" },
        { status: 400 }
      );
    }

    try {
      // Verify the Firebase ID token
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      
      // Check if email is verified
      if (!decodedToken.email) {
        return NextResponse.json(
          { error: "Email not found in token" },
          { status: 400 }
        );
      }

      if (!decodedToken.email_verified) {
        return NextResponse.json(
          { 
            error: "Email not verified",
            emailVerified: false,
            email: decodedToken.email,
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        email: decodedToken.email,
        emailVerified: true,
        uid: decodedToken.uid,
      });
    } catch (error: any) {
      console.error("Firebase token verification error:", error);
      return NextResponse.json(
        { error: "Invalid or expired token. Please verify your email first." },
        { status: 401 }
      );
    }
  } catch (error: any) {
    console.error("Error verifying email:", error);
    return NextResponse.json(
      { error: error.message || "Failed to verify email" },
      { status: 500 }
    );
  }
}












