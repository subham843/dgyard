import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

/**
 * Technician self-registration endpoint
 * Allows technicians to register themselves (pending admin approval)
 */
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { name, email, phone, password, employeeId, specialization, experience } = data;

    // Validate required fields
    if (!name || !email || !phone || !password) {
      return NextResponse.json(
        { error: "Name, email, phone, and password are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with TECHNICIAN role (credentials only)
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: "TECHNICIAN",
        phoneVerified: false, // Can be verified later
        // Note: name and phone are stored in Technician model, not User model
      },
    });

    // Create technician profile (all technician-specific data)
    const technician = await prisma.technician.create({
      data: {
        userId: user.id,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        employeeId: employeeId || null,
        specialization: specialization || [],
        experience: experience ? parseInt(experience) : null,
        active: false, // Inactive until admin approves
        rating: 0,
        totalJobs: 0,
        completedJobs: 0,
      },
    });

    // Notify admins about new technician registration
    try {
      const { sendNotificationsToUsers } = await import("@/lib/notifications");
      const adminUsers = await prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { id: true },
      });

      if (adminUsers.length > 0) {
        await sendNotificationsToUsers(
          adminUsers.map((admin) => admin.id),
          {
            type: "technician_registered",
            title: "New Technician Registration",
            message: `A new technician ${name} (${email}) has registered and is pending approval.`,
            channels: ["EMAIL", "IN_APP"],
            metadata: {
              technicianId: technician.id,
              userId: user.id,
            },
          }
        );
      }
    } catch (notificationError) {
      console.error("Error sending notification:", notificationError);
      // Don't fail registration if notification fails
    }

    return NextResponse.json({
      success: true,
      message: "Registration successful. Your account is pending admin approval.",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error: any) {
    console.error("Error registering technician:", error);
    return NextResponse.json(
      { error: error.message || "Failed to register technician" },
      { status: 500 }
    );
  }
}
