import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// One-time endpoint to create super admin
// Remove this in production or protect with secret
export async function POST(request: Request) {
  try {
    const { secret } = await request.json();
    
    // Simple protection - in production use proper secret
    if (secret !== "create-admin-2024") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const email = "subham@dgyard.com";
    const name = "Subham";

    // Check if admin already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // Update to admin if not already
      if (existingUser.role !== "ADMIN") {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { role: "ADMIN" },
        });
        return NextResponse.json({
          message: "User updated to ADMIN",
          email,
          name,
          password: "Subham@1994",
        });
      }
      return NextResponse.json({
        message: "Admin user already exists",
        email,
        name,
        password: "Subham@1994",
      });
    }

    // Create admin user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone: "+91 9999999999",
        role: "ADMIN",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Super Admin created successfully",
      credentials: {
        name,
        email,
        password: "Subham@1994",
      },
      note: "Sign up first at /auth/signup, then this endpoint sets role to ADMIN",
    });
  } catch (error: any) {
    console.error("Error creating admin:", error);
    return NextResponse.json(
      { 
        error: "Failed to create admin",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      },
      { status: 500 }
    );
  }
}




















