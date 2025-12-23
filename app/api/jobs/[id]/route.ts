import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/jobs/[id]
 * Get job details (public endpoint for review links)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params;

    const job = await prisma.jobPost.findUnique({
      where: { id: jobId },
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
        technician: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    const formattedJob = {
      id: job.id,
      jobNumber: job.jobNumber,
      title: job.title || job.jobNumber,
      description: job.description,
      status: job.status,
      customerName: job.customerName,
      customerPhone: job.customerPhone,
      customerEmail: job.customerEmail,
      dealer: {
        businessName: job.dealer?.dealer?.businessName || job.dealerName || "N/A",
        fullName: job.dealer?.dealer?.fullName || job.dealerName || "N/A",
      },
      technician: job.technician ? {
        fullName: job.technician.user?.name || job.technician.fullName || "N/A",
      } : null,
    };

    return NextResponse.json({ job: formattedJob });
  } catch (error: any) {
    console.error("Error fetching job:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch job",
        message: error.message || "An unexpected error occurred"
      },
      { status: 500 }
    );
  }
}
