import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const technician = await prisma.technician.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!technician) {
      return NextResponse.json(
        { error: "Technician profile not found" },
        { status: 404 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "50");
    const status = searchParams.get("status");

    // Get jobs assigned to this technician
    const where: any = {
      assignedTechnicianId: technician.id,
    };

    if (status) {
      where.status = status;
    }

    const jobs = await prisma.jobPost.findMany({
      where,
      include: {
        dealer: {
          include: {
            dealer: {
              select: {
                businessName: true,
                fullName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const formattedJobs = jobs.map((job) => ({
      id: job.id,
      jobNumber: job.jobNumber,
      title: job.title || job.jobNumber,
      description: job.description,
      status: job.status,
      location: {
        city: job.city || "",
        state: job.state || "",
        address: job.address || "",
      },
      dealer: {
        businessName: job.dealer?.dealer?.businessName || job.dealerName || "N/A",
        fullName: job.dealer?.dealer?.fullName || job.dealerName || "N/A",
      },
      scheduledAt: job.scheduledAt?.toISOString(),
      amount: job.finalPrice || job.estimatedCost,
      warrantyDays: job.warrantyDays,
    }));

    return NextResponse.json({ jobs: formattedJobs });
  } catch (error: any) {
    console.error("Error fetching technician jobs:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch jobs",
        message: error.message || "An unexpected error occurred"
      },
      { status: 500 }
    );
  }
}

