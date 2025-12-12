import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// This is a one-time setup endpoint
// In production, remove this or protect it with a secret key
export async function POST(request: Request) {
  try {
    const { secret, email, password, name } = await request.json();

    // Simple protection - use a secret key
    if (secret !== process.env.ADMIN_CREATE_SECRET || !process.env.ADMIN_CREATE_SECRET) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const adminEmail = email || "subham@dgyard.com";
    const adminName = name || "Subham";

    // Check if admin already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (existingUser) {
      // Update to admin if not already
      if (existingUser.role !== "ADMIN") {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { role: "ADMIN" },
        });
        return NextResponse.json({
          message: "User updated to admin",
          email: adminEmail,
        });
      }
      return NextResponse.json({
        message: "Admin user already exists",
        email: adminEmail,
      });
    }

    // Create admin user
    const user = await prisma.user.create({
      data: {
        name: adminName,
        email: adminEmail,
        phone: "+91 9999999999",
        role: "ADMIN",
      },
    });

    return NextResponse.json({
      message: "Admin user created successfully",
      email: adminEmail,
      userId: user.id,
      note: "Password will be handled by NextAuth. Sign up first, then this endpoint sets role to ADMIN.",
    });
  } catch (error) {
    console.error("Error creating admin:", error);
    return NextResponse.json(
      { error: "Failed to create admin user" },
      { status: 500 }
    );
  }
}

