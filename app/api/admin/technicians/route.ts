import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Get all technicians (admin only)
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const active = searchParams.get("active");

    const where: any = {};
    if (active !== null) {
      where.active = active === "true";
    }

    const technicians = await prisma.technician.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            phoneVerified: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ technicians });
  } catch (error: any) {
    console.error("Error fetching technicians:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch technicians" },
      { status: 500 }
    );
  }
}

/**
 * Create technician from existing user or new user (admin only)
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const data = await request.json();
    const { userId, name, email, phone, employeeId, specialization, experience, active } = data;

    let targetUserId = userId;

    // If no userId provided, create new user
    if (!targetUserId) {
      if (!name || !email || !phone) {
        return NextResponse.json(
          { error: "Name, email, and phone are required when creating new user" },
          { status: 400 }
        );
      }

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "User with this email already exists" },
          { status: 400 }
        );
      }

      // Create new user
      const newUser = await prisma.user.create({
        data: {
          name,
          email,
          phone,
          role: "TECHNICIAN",
        },
      });

      targetUserId = newUser.id;
    } else {
      // Verify user exists and update role
      const user = await prisma.user.findUnique({
        where: { id: targetUserId },
      });

      if (!user) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }

      // Update user role to TECHNICIAN if not already
      if (user.role !== "TECHNICIAN") {
        await prisma.user.update({
          where: { id: targetUserId },
          data: { role: "TECHNICIAN" },
        });
      }
    }

    // Check if technician profile already exists
    const existingTechnician = await prisma.technician.findUnique({
      where: { userId: targetUserId },
    });

    if (existingTechnician) {
      return NextResponse.json(
        { error: "Technician profile already exists for this user" },
        { status: 400 }
      );
    }

    // Create technician profile
    const technician = await prisma.technician.create({
      data: {
        userId: targetUserId,
        employeeId: employeeId || null,
        specialization: specialization || [],
        experience: experience ? parseInt(experience) : null,
        active: active !== undefined ? active : true,
        rating: 0,
        totalJobs: 0,
        completedJobs: 0,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    // Notify technician
    try {
      const { sendNotification } = await import("@/lib/notifications");
      await sendNotification({
        userId: targetUserId,
        type: "technician_created",
        title: "Technician Account Created",
        message: "Your technician account has been created. You can now access the technician dashboard.",
        channels: ["EMAIL", "IN_APP"],
      });
    } catch (notificationError) {
      console.error("Error sending notification:", notificationError);
    }

    return NextResponse.json({ technician });
  } catch (error: any) {
    console.error("Error creating technician:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create technician" },
      { status: 500 }
    );
  }
}
