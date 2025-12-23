import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { adminAuth } from "@/lib/firebase-admin";
import bcrypt from "bcryptjs";
import { sendEmail } from "@/lib/email";
import { getDealerRegistrationEmail } from "@/lib/email-templates/dealer-registration";
import { sendWhatsAppMessage, getDealerRegistrationWhatsAppMessage } from "@/lib/whatsapp";

// Increase timeout for this route (60 seconds)
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    // Add request logging for debugging
    console.log("[Dealer Register] Request received");
    
    let requestData;
    try {
      requestData = await request.json();
    } catch (parseError: any) {
      console.error("[Dealer Register] JSON parse error:", parseError);
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
      businessName,
      dealerType,
      addressLine,
      city,
      district,
      state,
      pincode,
      yearsOfExperience,
      servicesOffered,
      operatingAreas: requestOperatingAreas, // Array of operating areas
      latitude, // Backward compatibility - will use first operating area if not provided
      longitude,
      placeName,
      serviceRadiusKm,
      hasInHouseTechnicians,
      monthlyOrderCapacityRange,
      preferredBrands,
    } = requestData;

    // Validate required fields
    if (!phoneIdToken || !emailIdToken || !password || !fullName || !businessName) {
      return NextResponse.json(
        { error: "Phone verification, email verification, password, full name, and business name are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Check if Firebase Admin is initialized
    if (!adminAuth) {
      console.error("[Dealer Register] Firebase Admin SDK not initialized");
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
        console.error("[Dealer Register] Phone token verification failed:", error);
        return NextResponse.json(
          { error: "Invalid phone verification token. Please verify your phone number again." },
          { status: 401 }
        );
      }

      // Verify email token
      try {
        emailDecoded = await adminAuth.verifyIdToken(emailIdToken);
      } catch (error: any) {
        console.error("[Dealer Register] Email token verification failed:", error);
        return NextResponse.json(
          { error: "Invalid email verification token. Please verify your email again." },
          { status: 401 }
        );
      }
    } catch (error: any) {
      console.error("[Dealer Register] Token verification failed:", error);
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
    // Use select to only get required fields and avoid reading role enum which might have invalid values
    let existingUser;
    try {
      existingUser = await prisma.user.findUnique({
        where: { email },
        select: { 
          id: true, 
          email: true,
          role: true,
          dealer: {
            select: { id: true, accountStatus: true },
          },
        },
      });
    } catch (enumError: any) {
      // Handle case where database has invalid enum values (e.g., TECHNICIAN)
      if (enumError?.message?.includes("not found in enum")) {
        console.error("[Dealer Register] Database contains user with invalid role enum value. This needs to be fixed in the database.");
        // For now, assume user exists to prevent registration with invalid data
        return NextResponse.json(
          { error: "Database contains invalid user data. Please contact administrator." },
          { status: 500 }
        );
      } else {
        throw enumError;
      }
    }

    if (existingUser) {
      // Check if user already has a dealer record
      if (existingUser.dealer) {
        return NextResponse.json(
          { 
            error: "You have already registered as a dealer. Please sign in to access your account.",
            existingDealer: true,
          },
          { status: 400 }
        );
      }
      
      // If user exists but not as dealer, they might be trying to register again
      // Allow them to complete registration if they're using the same email that's verified in Firebase
      // This handles the case where Firebase user exists but DB registration was incomplete
      if (existingUser.role !== "DEALER") {
        // User exists with different role - they should use a different email or contact support
        return NextResponse.json(
          { error: "An account with this email already exists with a different role. Please contact support if you need to change your account type." },
          { status: 400 }
        );
      }
    }

    // Check if phone is already registered
    // Use select to only get id field to avoid reading role enum
    let existingPhoneUser;
    try {
      existingPhoneUser = await prisma.user.findFirst({
        where: { phone },
        select: { id: true, phone: true },
      });
    } catch (enumError: any) {
      // Handle case where database has invalid enum values
      if (enumError?.message?.includes("not found in enum")) {
        console.error("[Dealer Register] Database contains user with invalid role enum value. This needs to be fixed in the database.");
        // For now, assume user exists to prevent registration with invalid data
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

    // Process operating areas
    let firstArea = null;
    let operatingAreas = requestOperatingAreas;
    
    if (operatingAreas && Array.isArray(operatingAreas) && operatingAreas.length > 0) {
      firstArea = operatingAreas[0];
    } else if (latitude && longitude) {
      // Backward compatibility - use old fields if operatingAreas not provided
      firstArea = {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        placeName: placeName || null,
        serviceRadiusKm: serviceRadiusKm ? parseFloat(serviceRadiusKm) : 10,
      };
      operatingAreas = [firstArea];
    }

    // Create or update User record with: id, name, email, role, phone, createdAt, updatedAt, phoneVerified, password
    console.log("[Dealer Register] Creating/updating user record with email:", email);
    let user;
    try {
      if (existingUser) {
        // User exists but no dealer record - update their password and verification status, set role to DEALER
        const updateData: any = {
          name: fullName.trim(), // Save name in User collection
          phone: phone.trim(), // Save phone in User collection
          password: hashedPassword,
          phoneVerified: true,
          emailVerified: new Date(),
        };
        
        // Only update role if it's not already DEALER
        if (existingUser.role !== "DEALER") {
          updateData.role = "DEALER";
        }
        
        user = await prisma.user.update({
          where: { id: existingUser.id },
          data: updateData,
        });
        console.log("[Dealer Register] User record updated successfully:", user.id);
      } else {
        // Create new user with: id, name, email, role, phone, createdAt, updatedAt, phoneVerified, password
        user = await prisma.user.create({
          data: {
            name: fullName.trim(), // Save name in User collection
            email: email.toLowerCase().trim(),
            role: "DEALER", // Role is DEALER for dealer signup
            phone: phone.trim(), // Save phone in User collection
            phoneVerified: true,
            password: hashedPassword,
            emailVerified: new Date(),
            // createdAt and updatedAt are automatically handled by Prisma
          },
        });
        console.log("[Dealer Register] User record created successfully:", user.id);
      }
    } catch (userError: any) {
      console.error("[Dealer Register] Error creating/updating user record:", userError);
      console.error("[Dealer Register] User creation/update error code:", userError?.code);
      console.error("[Dealer Register] User creation/update error message:", userError?.message);
      throw userError; // Re-throw to be caught by outer catch block
    }

    // Ensure required fields are not empty
    if (!fullName || !businessName || !email || !phone) {
      return NextResponse.json(
        { error: "Full name, business name, email, and phone are required" },
        { status: 400 }
      );
    }

    // Create or update Dealer record (all dealer-specific data)
    console.log("[Dealer Register] Creating/updating dealer record for user:", user.id);
    let dealer;
    try {
      // Check if dealer record already exists
      const existingDealer = await prisma.dealer.findUnique({
        where: { userId: user.id },
      });

      if (existingDealer) {
        // Update existing dealer record with new information
        dealer = await prisma.dealer.update({
          where: { id: existingDealer.id },
          data: {
            fullName: fullName.trim(),
            businessName: businessName.trim(),
            dealerType: dealerType || null,
            email: email.trim(),
            mobile: phone.trim(),
            accountStatus: "PENDING_APPROVAL", // Reset to pending if updating
            addressLine: addressLine || null,
            city: city || null,
            district: district || null,
            state: state || null,
            pincode: pincode || null,
            yearsOfExperience: yearsOfExperience ? parseInt(yearsOfExperience) : null,
            servicesOffered: servicesOffered || [],
            // Store first operating area in existing fields for backward compatibility
            latitude: firstArea?.latitude || null,
            longitude: firstArea?.longitude || null,
            placeName: firstArea?.placeName || null,
            serviceRadiusKm: firstArea?.serviceRadiusKm || null,
            coverageType: "RADIUS_BASED",
            hasInHouseTechnicians: hasInHouseTechnicians || false,
            monthlyOrderCapacityRange: monthlyOrderCapacityRange || null,
            preferredBrands: preferredBrands || [],
            // Don't update isKycCompleted and isBankDetailsCompleted on update
          },
        });
        console.log("[Dealer Register] Dealer record updated successfully:", dealer.id);
      } else {
        // Create new dealer record
        dealer = await prisma.dealer.create({
          data: {
            userId: user.id,
            fullName: fullName.trim(),
            businessName: businessName.trim(),
            dealerType: dealerType || null,
            email: email.trim(),
            mobile: phone.trim(),
            accountStatus: "PENDING_APPROVAL",
            addressLine: addressLine || null,
            city: city || null,
            district: district || null,
            state: state || null,
            pincode: pincode || null,
            yearsOfExperience: yearsOfExperience ? parseInt(yearsOfExperience) : null,
            servicesOffered: servicesOffered || [],
            // Store first operating area in existing fields for backward compatibility
            latitude: firstArea?.latitude || null,
            longitude: firstArea?.longitude || null,
            placeName: firstArea?.placeName || null,
            serviceRadiusKm: firstArea?.serviceRadiusKm || null,
            coverageType: "RADIUS_BASED",
            hasInHouseTechnicians: hasInHouseTechnicians || false,
            monthlyOrderCapacityRange: monthlyOrderCapacityRange || null,
            preferredBrands: preferredBrands || [],
            isKycCompleted: false,
            isBankDetailsCompleted: false,
          },
        });
        console.log("[Dealer Register] Dealer record created successfully:", dealer.id);
      }
    } catch (dealerError: any) {
      console.error("[Dealer Register] Error creating dealer record:", dealerError);
      console.error("[Dealer Register] Dealer creation error code:", dealerError?.code);
      console.error("[Dealer Register] Dealer creation error message:", dealerError?.message);
      
      // If dealer creation fails, try to delete the user we just created
      try {
        await prisma.user.delete({ where: { id: user.id } });
        console.log("[Dealer Register] Cleaned up user record after dealer creation failure");
      } catch (cleanupError) {
        console.error("[Dealer Register] Failed to cleanup user after dealer creation failure:", cleanupError);
      }
      
      throw dealerError; // Re-throw to be caught by outer catch block
    }

    // TODO: Store all operatingAreas array in a separate collection or JSON field
    // For now, the first area is stored in the main fields
    // We can create a separate OperatingArea model later or add operatingAreas JSON field to Dealer model

    // Send registration confirmation email
    try {
      console.log("[Dealer Register] Sending registration email to:", user.email);
      const emailTemplate = getDealerRegistrationEmail({
        ...dealer,
        user: {
          email: user.email,
          phone: user.phone,
        },
      });
      
      await sendEmail({
        to: user.email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
      });
      console.log("[Dealer Register] Email sent successfully");
    } catch (emailError: any) {
      console.error("[Dealer Register] Error sending registration email:", emailError);
      // Don't fail the request if email fails
    }

    // Send WhatsApp notification
    try {
      console.log("[Dealer Register] Sending WhatsApp notification to:", phone);
      const whatsappMessage = getDealerRegistrationWhatsAppMessage(fullName, businessName);
      await sendWhatsAppMessage({
        to: phone,
        message: whatsappMessage,
      });
      console.log("[Dealer Register] WhatsApp notification sent successfully");
    } catch (whatsappError: any) {
      console.error("[Dealer Register] Error sending WhatsApp notification:", whatsappError);
      // Don't fail the request if WhatsApp fails
    }

    console.log("[Dealer Register] Registration successful for dealer:", dealer.id);
    return NextResponse.json({
      success: true,
      message: "Dealer registration successful. Your account is pending approval.",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      dealer: {
        id: dealer.id,
        businessName: dealer.businessName,
        accountStatus: dealer.accountStatus,
      },
    });
  } catch (error: any) {
    console.error("[Dealer Register] ========== ERROR START ==========");
    console.error("[Dealer Register] Error registering dealer:", error);
    console.error("[Dealer Register] Error type:", typeof error);
    console.error("[Dealer Register] Error name:", error?.name);
    console.error("[Dealer Register] Error message:", error?.message);
    console.error("[Dealer Register] Error code:", error?.code);
    console.error("[Dealer Register] Error stack:", error?.stack);
    console.error("[Dealer Register] ========== ERROR END ==========");
    
    // Ensure we always return JSON
    try {
      // Handle Prisma errors
      if (error?.code === "P2002") {
        console.error("[Dealer Register] Prisma unique constraint violation");
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
        console.error("[Dealer Register] Database connection/timeout error");
        return NextResponse.json(
          { error: "Database connection timeout. Please try again." },
          { 
            status: 500,
            headers: { "Content-Type": "application/json" }
          }
        );
      }

      const errorMessage = error?.message || String(error) || "Failed to register dealer";
      console.error("[Dealer Register] Returning error response with message:", errorMessage);
      
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
      // Fallback if JSON.stringify fails
      console.error("[Dealer Register] Failed to create JSON response:", jsonError);
      console.error("[Dealer Register] JSON Error stack:", jsonError?.stack);
      
      // Last resort - return plain text JSON
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












