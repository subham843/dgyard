import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Helper function to calculate distance
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const job = await prisma.jobPost.findUnique({
      where: { id },
      include: {
        technician: true,
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Only dealer or technician can view tracking
    if (session.user.role !== "DEALER" && session.user.role !== "TECHNICIAN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (session.user.role === "DEALER" && job.dealerId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (!job.technician) {
      return NextResponse.json({ error: "No technician assigned" }, { status: 400 });
    }

    // Get technician's current location (in real implementation, this would come from GPS tracking)
    // For now, we'll use technician's registered location as a placeholder
    const techLocation = {
      lat: job.technician.latitude || 0,
      lng: job.technician.longitude || 0,
    };

    // Calculate distance and ETA
    let distance = 0;
    let eta = null;

    if (job.latitude && job.longitude && techLocation.lat && techLocation.lng) {
      distance = calculateDistance(
        job.latitude,
        job.longitude,
        techLocation.lat,
        techLocation.lng
      );

      // Estimate ETA (assuming average speed of 30 km/h in city)
      const estimatedHours = distance / 30;
      if (estimatedHours < 1) {
        eta = `${Math.round(estimatedHours * 60)} minutes`;
      } else {
        eta = `${estimatedHours.toFixed(1)} hours`;
      }
    }

    return NextResponse.json({
      location: techLocation.lat && techLocation.lng ? techLocation : null,
      distance: distance > 0 ? distance.toFixed(2) : null,
      eta,
      status: job.status === "IN_PROGRESS" ? "Working" : job.status === "ASSIGNED" ? "On the way" : "Unknown",
    });
  } catch (error: any) {
    console.error("Error fetching tracking:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch tracking" },
      { status: 500 }
    );
  }
}

// POST - Update technician location (for live tracking)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "TECHNICIAN") {
      return NextResponse.json({ error: "Only technicians can update location" }, { status: 403 });
    }

    const { id } = await params;
    const { lat, lng } = await request.json();

    if (!lat || !lng) {
      return NextResponse.json({ error: "Latitude and longitude are required" }, { status: 400 });
    }

    const technician = await prisma.technician.findUnique({
      where: { userId: session.user.id },
    });

    if (!technician) {
      return NextResponse.json({ error: "Technician profile not found" }, { status: 404 });
    }

    const job = await prisma.jobPost.findUnique({
      where: { id },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.assignedTechnicianId !== technician.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Update technician's current location (you might want to store this in a separate tracking table)
    // For now, we'll just update the technician's location
    await prisma.technician.update({
      where: { id: technician.id },
      data: {
        latitude: lat,
        longitude: lng,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Location updated",
      location: { lat, lng },
    });
  } catch (error: any) {
    console.error("Error updating location:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update location" },
      { status: 500 }
    );
  }
}






