import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch technician profile
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const technician = await prisma.technician.findUnique({
      where: { userId: session.user.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            phoneVerified: true,
          },
        },
      },
    });

    if (!technician) {
      return NextResponse.json({ error: "Technician profile not found" }, { status: 404 });
    }

    return NextResponse.json({ technician });
  } catch (error: any) {
    console.error("Error fetching technician profile:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

// PATCH - Update technician profile
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const technician = await prisma.technician.findUnique({
      where: { userId: session.user.id },
    });

    if (!technician) {
      return NextResponse.json({ error: "Technician profile not found" }, { status: 404 });
    }

    // Update technician profile
    const updateData: any = {};
    
    if (data.fullName !== undefined) updateData.fullName = data.fullName;
    if (data.displayName !== undefined) updateData.displayName = data.displayName;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.mobile !== undefined) updateData.mobile = data.mobile;
    if (data.yearsOfExperience !== undefined) updateData.yearsOfExperience = data.yearsOfExperience ? parseInt(data.yearsOfExperience) : null;
    if (data.primarySkills !== undefined) updateData.primarySkills = data.primarySkills;
    if (data.secondarySkills !== undefined) updateData.secondarySkills = data.secondarySkills;
    if (data.serviceCategories !== undefined) updateData.serviceCategories = data.serviceCategories;
    if (data.latitude !== undefined) updateData.latitude = data.latitude ? parseFloat(data.latitude) : null;
    if (data.longitude !== undefined) updateData.longitude = data.longitude ? parseFloat(data.longitude) : null;
    if (data.placeName !== undefined) updateData.placeName = data.placeName;
    if (data.serviceRadiusKm !== undefined) updateData.serviceRadiusKm = data.serviceRadiusKm ? parseFloat(data.serviceRadiusKm) : null;
    if (data.workingDays !== undefined) updateData.workingDays = data.workingDays;
    if (data.dailyAvailability !== undefined) updateData.dailyAvailability = data.dailyAvailability;
    if (data.ownToolsAvailable !== undefined) updateData.ownToolsAvailable = data.ownToolsAvailable;
    if (data.ownVehicle !== undefined) updateData.ownVehicle = data.ownVehicle;
    if (data.previousWorkDescription !== undefined) updateData.previousWorkDescription = data.previousWorkDescription;
    if (data.isOnline !== undefined) updateData.isOnline = data.isOnline;

    const updatedTechnician = await prisma.technician.update({
      where: { id: technician.id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            phoneVerified: true,
          },
        },
      },
    });

    // Update user email and phone if provided
    if (data.email || data.mobile) {
      const userUpdateData: any = {};
      if (data.email) userUpdateData.email = data.email.toLowerCase().trim();
      if (data.mobile) userUpdateData.phone = data.mobile.trim();

      await prisma.user.update({
        where: { id: session.user.id },
        data: userUpdateData,
      });
    }

    return NextResponse.json({
      success: true,
      technician: updatedTechnician,
    });
  } catch (error: any) {
    console.error("Error updating technician profile:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update profile" },
      { status: 500 }
    );
  }
}






