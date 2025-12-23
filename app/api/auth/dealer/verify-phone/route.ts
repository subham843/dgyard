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
      
      // Check if phone number is verified
      if (!decodedToken.phone_number) {
        return NextResponse.json(
          { error: "Phone number not found in token" },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        phone: decodedToken.phone_number,
        uid: decodedToken.uid,
      });
    } catch (error: any) {
      console.error("Firebase token verification error:", error);
      return NextResponse.json(
        { error: "Invalid or expired token. Please try again." },
        { status: 401 }
      );
    }
  } catch (error: any) {
    console.error("Error verifying phone:", error);
    return NextResponse.json(
      { error: error.message || "Failed to verify phone" },
      { status: 500 }
    );
  }
}












