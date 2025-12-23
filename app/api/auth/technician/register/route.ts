import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminAuth } from "@/lib/firebase-admin";
import bcrypt from "bcryptjs";
import { sendEmail } from "@/lib/email";

// Increase timeout for this route (60 seconds)
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    console.log("[Technician Register] Request received");
    
    let requestData;
    try {
      requestData = await request.json();
    } catch (parseError: any) {
      console.error("[Technician Register] JSON parse error:", parseError);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const {
      phoneIdToken, // Firebase ID token from phone verification
      emailIdToken, // Firebase ID token from email verification
      password,
      fullName,
      displayName,
      technicianType,
      yearsOfExperience,
      primarySkills,
      secondarySkills,
      serviceCategories,
      // Operating Area
      latitude,
      longitude,
      placeName,
      serviceRadiusKm,
      // Availability & Work Preferences
      workingDays,
      dailyAvailability,
      // Tools & Transport
      ownToolsAvailable,
      ownVehicle,
      // Experience Proof (Optional)
      previousWorkDescription,
    } = requestData;

    // Validate required fields
    if (!phoneIdToken || !emailIdToken || !password || !fullName || !technicianType) {
      return NextResponse.json(
        { error: "Phone verification, email verification, password, full name, and technician type are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Validate operating area is provided
    if (!latitude || !longitude || !placeName || !serviceRadiusKm) {
      return NextResponse.json(
        { error: "Operating area (location and radius) is required" },
        { status: 400 }
      );
    }

    // Check if Firebase Admin is initialized
    if (!adminAuth) {
      console.error("[Technician Register] Firebase Admin SDK not initialized");
      return NextResponse.json(
        { error: "Firebase Admin SDK not configured. Please contact administrator." },
        { status: 500 }
      );
    }

    // Verify both tokens
    let phoneDecoded, emailDecoded;
    
    try {
      // Verify phone token
      try {
        phoneDecoded = await adminAuth.verifyIdToken(phoneIdToken);
      } catch (error: any) {
        console.error("[Technician Register] Phone token verification failed:", error);
        return NextResponse.json(
          { error: "Invalid phone verification token. Please verify your phone number again." },
          { status: 401 }
        );
      }

      // Verify email token
      try {
        emailDecoded = await adminAuth.verifyIdToken(emailIdToken);
      } catch (error: any) {
        console.error("[Technician Register] Email token verification failed:", error);
        return NextResponse.json(
          { error: "Invalid email verification token. Please verify your email again." },
          { status: 401 }
        );
      }
    } catch (error: any) {
      console.error("[Technician Register] Token verification failed:", error);
      return NextResponse.json(
        { error: "Token verification failed. Please try again." },
        { status: 401 }
      );
    }

    const phone = phoneDecoded.phone_number;
    const email = emailDecoded.email;

    if (!phone) {
      return NextResponse.json(
        { error: "Phone number not found in verification token" },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: "Email not found in verification token" },
        { status: 400 }
      );
    }

    if (!emailDecoded.email_verified) {
      return NextResponse.json(
        { error: "Email must be verified before registration. Please check your inbox and verify your email." },
        { status: 400 }
      );
    }

    // Check if user already exists
    let existingUser;
    try {
      existingUser = await prisma.user.findUnique({
        where: { email },
        select: { 
          id: true, 
          email: true,
          role: true,
          technicianProfile: {
            select: { id: true, accountStatus: true },
          },
        },
      });
    } catch (enumError: any) {
      if (enumError?.message?.includes("not found in enum")) {
        console.error("[Technician Register] Database contains user with invalid role enum value.");
        return NextResponse.json(
          { error: "Database contains invalid user data. Please contact administrator." },
          { status: 500 }
        );
      } else {
        throw enumError;
      }
    }

    if (existingUser) {
      // Check if user already has a technician record
      if (existingUser.technicianProfile) {
        return NextResponse.json(
          { 
            error: "You have already registered as a technician. Please sign in to access your account.",
            existingTechnician: true,
          },
          { status: 400 }
        );
      }
      
      // If user exists but not as technician, they might be trying to register again
      if (existingUser.role !== "TECHNICIAN") {
        return NextResponse.json(
          { error: "An account with this email already exists with a different role. Please contact support if you need to change your account type." },
          { status: 400 }
        );
      }
    }

    // Check if phone is already registered
    let existingPhoneUser;
    try {
      existingPhoneUser = await prisma.user.findFirst({
        where: { phone },
        select: { id: true, phone: true },
      });
    } catch (enumError: any) {
      if (enumError?.message?.includes("not found in enum")) {
        console.error("[Technician Register] Database contains user with invalid role enum value.");
        return NextResponse.json(
          { error: "Database contains invalid user data. Please contact administrator." },
          { status: 500 }
        );
      } else {
        throw enumError;
      }
    }

    if (existingPhoneUser) {
      return NextResponse.json(
        { error: "Phone number is already registered" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ============================================
    // STEP 1: Create/Update User Collection
    // ============================================
    // User collection stores ONLY authentication data:
    // - id (auto-generated)
    // - name (from fullName)
    // - email
    // - role (TECHNICIAN)
    // - phone
    // - createdAt (auto)
    // - updatedAt (auto)
    // - phoneVerified
    // - password (hashed)
    // - emailVerified
    // 
    // ❌ DO NOT store technician profile data here
    // ============================================
    console.log("[Technician Register] Creating/updating user record with email:", email);
    let user;
    try {
      if (existingUser) {
        // User exists but no technician record - update their password and verification status, set role to TECHNICIAN
        // User collection: id, name, email, role, phone, createdAt, updatedAt, phoneVerified, password, emailVerified
        const updateData: any = {
          name: fullName.trim(), // Store name in User collection
          phone: phone.trim(),
          password: hashedPassword,
          phoneVerified: true,
          emailVerified: new Date(),
        };
        
        // Only update role if it's not already TECHNICIAN
        if (existingUser.role !== "TECHNICIAN") {
          updateData.role = "TECHNICIAN";
        }
        
        user = await prisma.user.update({
          where: { id: existingUser.id },
          data: updateData,
        });
        console.log("[Technician Register] User record updated successfully:", user.id);
      } else {
        // Create new user with: id, name, email, role, phone, createdAt, updatedAt, phoneVerified, password, emailVerified
        user = await prisma.user.create({
          data: {
            name: fullName.trim(), // Store name in User collection
            email: email.toLowerCase().trim(),
            role: "TECHNICIAN",
            phone: phone.trim(),
            phoneVerified: true,
            password: hashedPassword,
            emailVerified: new Date(),
          },
        });
        console.log("[Technician Register] User record created successfully:", user.id);
      }
    } catch (userError: any) {
      console.error("[Technician Register] Error creating/updating user record:", userError);
      throw userError;
    }

    // Ensure required fields are not empty
    if (!fullName || !email || !phone) {
      return NextResponse.json(
        { error: "Full name, email, and phone are required" },
        { status: 400 }
      );
    }

    // ============================================
    // STEP 2: Create/Update Technician Collection
    // ============================================
    // Technician collection stores ALL technician-specific profile data:
    // - userId (FK reference to User)
    // - fullName, displayName
    // - email, mobile (synced from User for convenience)
    // - technicianType, accountStatus
    // - yearsOfExperience
    // - primarySkills, secondarySkills, serviceCategories
    // - Operating area: latitude, longitude, placeName, serviceRadiusKm
    // - Availability: workingDays, dailyAvailability
    // - Tools & Transport: ownToolsAvailable, ownVehicle
    // - Experience proof: previousWorkDescription, pastProjectImages
    // - Meta: isKycCompleted, isBankDetailsCompleted, rating, totalJobs, etc.
    // ============================================
    console.log("[Technician Register] Creating/updating technician record for user:", user.id);
    let technician;
    try {
      // Check if technician record already exists
      const existingTechnician = await prisma.technician.findUnique({
        where: { userId: user.id },
      });

      if (existingTechnician) {
        // Update existing technician record
        technician = await prisma.technician.update({
          where: { id: existingTechnician.id },
          data: {
            fullName: fullName.trim(),
            displayName: displayName?.trim() || null,
            email: email.trim(),
            mobile: phone.trim(),
            technicianType: technicianType,
            accountStatus: "PENDING_APPROVAL",
            yearsOfExperience: yearsOfExperience ? parseInt(yearsOfExperience) : null,
            primarySkills: primarySkills && Array.isArray(primarySkills) && primarySkills.length > 0 ? primarySkills : null, // Store as JSON array: [{skill: "Name", level: "BEGINNER"}]
            secondarySkills: secondarySkills || [],
            serviceCategories: serviceCategories || [],
            latitude: latitude ? parseFloat(latitude) : null,
            longitude: longitude ? parseFloat(longitude) : null,
            placeName: placeName || null,
            serviceRadiusKm: serviceRadiusKm ? parseFloat(serviceRadiusKm) : null,
            workingDays: workingDays || null,
            dailyAvailability: dailyAvailability || null,
            ownToolsAvailable: ownToolsAvailable || false,
            ownVehicle: ownVehicle || "NONE",
            previousWorkDescription: previousWorkDescription || null,
            // Don't update isKycCompleted and isBankDetailsCompleted on update
          },
        });
        console.log("[Technician Register] Technician record updated successfully:", technician.id);
      } else {
        // Create new technician record
        technician = await prisma.technician.create({
          data: {
            userId: user.id,
            fullName: fullName.trim(),
            displayName: displayName?.trim() || null,
            email: email.trim(),
            mobile: phone.trim(),
            technicianType: technicianType,
            accountStatus: "PENDING_APPROVAL",
            yearsOfExperience: yearsOfExperience ? parseInt(yearsOfExperience) : null,
            primarySkills: primarySkills && Array.isArray(primarySkills) && primarySkills.length > 0 ? primarySkills : null, // Store as JSON array: [{skill: "Name", level: "BEGINNER"}]
            secondarySkills: secondarySkills || [],
            serviceCategories: serviceCategories || [],
            latitude: latitude ? parseFloat(latitude) : null,
            longitude: longitude ? parseFloat(longitude) : null,
            placeName: placeName || null,
            serviceRadiusKm: serviceRadiusKm ? parseFloat(serviceRadiusKm) : null,
            workingDays: workingDays || null,
            dailyAvailability: dailyAvailability || null,
            ownToolsAvailable: ownToolsAvailable || false,
            ownVehicle: ownVehicle || "NONE",
            previousWorkDescription: previousWorkDescription || null,
            isKycCompleted: false,
            isBankDetailsCompleted: false,
            rating: 0,
            totalJobs: 0,
            completedJobs: 0,
          },
        });
        console.log("[Technician Register] Technician record created successfully:", technician.id);
      }
    } catch (technicianError: any) {
      console.error("[Technician Register] Error creating technician record:", technicianError);
      
      // If technician creation fails, try to delete the user we just created
      try {
        await prisma.user.delete({ where: { id: user.id } });
        console.log("[Technician Register] Cleaned up user record after technician creation failure");
      } catch (cleanupError) {
        console.error("[Technician Register] Failed to cleanup user after technician creation failure:", cleanupError);
      }
      
      throw technicianError;
    }

    // Send registration confirmation email
    try {
      console.log("[Technician Register] Sending registration email to:", user.email);
      await sendEmail({
        to: user.email,
        subject: "Technician Registration Successful - D.G.Yard",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Welcome to D.G.Yard Connect!</h2>
            <p>Dear ${fullName},</p>
            <p>Your technician registration has been successfully submitted.</p>
            <p><strong>Account Status:</strong> Pending Approval</p>
            <p>Our admin team will review your registration and approve your account within 24 hours.</p>
            <p><strong>Important:</strong></p>
            <ul>
              <li>No KYC required at signup</li>
              <li>KYC required before payouts</li>
              <li>You will receive notifications once your account is approved</li>
            </ul>
            <p>Thank you for joining D.G.Yard Connect!</p>
            <p>Best regards,<br>D.G.Yard Team</p>
          </div>
        `,
      });
      console.log("[Technician Register] Email sent successfully");
    } catch (emailError: any) {
      console.error("[Technician Register] Error sending registration email:", emailError);
      // Don't fail the request if email fails
    }

    console.log("[Technician Register] Registration successful for technician:", technician.id);
    return NextResponse.json({
      success: true,
      message: "Technician registration successful. Your account is pending approval.",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      technician: {
        id: technician.id,
        fullName: technician.fullName,
        accountStatus: technician.accountStatus,
      },
    });
  } catch (error: any) {
    console.error("[Technician Register] ========== ERROR START ==========");
    console.error("[Technician Register] Error registering technician:", error);
    console.error("[Technician Register] Error type:", typeof error);
    console.error("[Technician Register] Error name:", error?.name);
    console.error("[Technician Register] Error message:", error?.message);
    console.error("[Technician Register] Error code:", error?.code);
    console.error("[Technician Register] Error stack:", error?.stack);
    console.error("[Technician Register] ========== ERROR END ==========");
    
    try {
      // Handle Prisma errors
      if (error?.code === "P2002") {
        console.error("[Technician Register] Prisma unique constraint violation");
        return NextResponse.json(
          { error: "User with this email or phone already exists" },
          { 
            status: 400,
            headers: { "Content-Type": "application/json" }
          }
        );
      }

      // Handle network/database connection errors
      if (error?.message?.includes("connect") || error?.message?.includes("timeout") || error?.code === "ETIMEDOUT") {
        console.error("[Technician Register] Database connection/timeout error");
        return NextResponse.json(
          { error: "Database connection timeout. Please try again." },
          { 
            status: 500,
            headers: { "Content-Type": "application/json" }
          }
        );
      }

      const errorMessage = error?.message || String(error) || "Failed to register technician";
      console.error("[Technician Register] Returning error response with message:", errorMessage);
      
      return NextResponse.json(
        { 
          error: errorMessage,
          ...(process.env.NODE_ENV === "development" && {
            details: error?.stack,
            errorType: error?.name,
            errorCode: error?.code
          })
        },
        { 
          status: 500,
          headers: { 
            "Content-Type": "application/json",
            "Cache-Control": "no-store"
          }
        }
      );
    } catch (jsonError: any) {
      console.error("[Technician Register] Failed to create JSON response:", jsonError);
      return new Response(
        JSON.stringify({ error: "Internal server error" }),
        {
          status: 500,
          headers: { 
            "Content-Type": "application/json",
            "Cache-Control": "no-store"
          },
        }
      );
    }
  }
}











