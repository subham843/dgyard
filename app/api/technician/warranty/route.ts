import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
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

    // Get jobs with active warranty - include all completed jobs
    // We'll filter by warranty period in the code
    // Note: JobStatus enum doesn't have "WARRANTY", only COMPLETED and COMPLETION_PENDING_APPROVAL
    const jobs = await prisma.jobPost.findMany({
      where: {
        assignedTechnicianId: technician.id,
        status: {
          in: ["COMPLETED", "COMPLETION_PENDING_APPROVAL"],
        },
      },
      include: {
        dealer: {
          include: {
            dealer: {
              select: {
                businessName: true,
              },
            },
          },
        },
        payments: true,
        warrantyHolds: {
          where: {
            technicianId: technician.id,
          },
          orderBy: { createdAt: "desc" },
        },
        disputes: {
          where: {
            status: {
              in: ["OPEN", "UNDER_REVIEW"],
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Fetch service subcategories with warranty days for all jobs
    const serviceSubCategoryIds = [...new Set(jobs.map(job => job.serviceSubCategoryId))];
    const serviceSubCategories = await prisma.serviceSubCategory.findMany({
      where: {
        id: { in: serviceSubCategoryIds },
      },
      select: {
        id: true,
        warrantyDays: true,
        serviceCategory: {
          select: {
            id: true,
            warrantyDays: true,
          },
        },
      },
    });

    // Create a map for quick lookup
    const serviceSubCategoryMap = new Map(
      serviceSubCategories.map(sub => [sub.id, sub])
    );

    const warrantyJobs = jobs
      .filter((job) => {
        // Use warrantyStartDate if available, otherwise fall back to completedAt
        const warrantyStart = job.warrantyStartDate || job.completedAt;
        if (!warrantyStart) return false;
        
        // Get warrantyDays priority: serviceSubCategory > job.warrantyDays > warrantyHold > default
        const serviceSubCategory = serviceSubCategoryMap.get(job.serviceSubCategoryId);
        let warrantyDays = serviceSubCategory?.warrantyDays || 
                          serviceSubCategory?.serviceCategory?.warrantyDays ||
                          job.warrantyDays;
        
        if (!warrantyDays && job.warrantyHolds.length > 0) {
          warrantyDays = job.warrantyHolds[0].warrantyDays;
        }
        
        // If still no warrantyDays, default to 30 days for completed jobs
        if (!warrantyDays) {
          warrantyDays = 30; // Default warranty period
        }
        
        const warrantyEndDate = new Date(
          new Date(warrantyStart).getTime() + warrantyDays * 24 * 60 * 60 * 1000
        );
        return warrantyEndDate > new Date();
      })
      .map((job) => {
        // Use warrantyStartDate if available, otherwise fall back to completedAt
        const warrantyStart = job.warrantyStartDate || job.completedAt;
        
        // Get warrantyDays priority: serviceSubCategory > job.warrantyDays > warrantyHold > default
        const serviceSubCategory = serviceSubCategoryMap.get(job.serviceSubCategoryId);
        let warrantyDays = serviceSubCategory?.warrantyDays || 
                          serviceSubCategory?.serviceCategory?.warrantyDays ||
                          job.warrantyDays;
        
        if (!warrantyDays && job.warrantyHolds.length > 0) {
          warrantyDays = job.warrantyHolds[0].warrantyDays;
        }
        if (!warrantyDays) {
          warrantyDays = 30; // Default warranty period
        }
        
        const warrantyEndDate = new Date(
          new Date(warrantyStart!).getTime() + warrantyDays * 24 * 60 * 60 * 1000
        );
        const daysLeft = Math.ceil(
          (warrantyEndDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );
        
        // Find payment for this technician
        const payment = job.payments.find((p: any) => p.technicianId === technician.id) || job.payments[0];
        
        // Find warranty hold for this technician with LOCKED or FROZEN status
        const warrantyHold = job.warrantyHolds.find(
          (wh: any) => wh.technicianId === technician.id && 
          (wh.status === "LOCKED" || wh.status === "FROZEN")
        ) || job.warrantyHolds[0];
        
        const dispute = job.disputes[0];

        // Get complaint details from warranty hold or dispute
        let complaintDetails: string | undefined = undefined;
        let complaintStatus = "ACTIVE";
        
        if (warrantyHold?.isFrozen && warrantyHold?.freezeReason) {
          complaintDetails = warrantyHold.freezeReason;
          complaintStatus = "PENDING";
        } else if (dispute) {
          complaintDetails = dispute.description;
          complaintStatus = dispute.status === "OPEN" ? "PENDING" : dispute.status === "UNDER_REVIEW" ? "IN_REVIEW" : dispute.status;
        }
        // Note: JobStatus enum doesn't have "WARRANTY" status
        // Warranty jobs are identified by having completedAt/warrantyStartDate and active warranty period

        return {
          id: job.id,
          jobNumber: job.jobNumber,
          title: job.title || job.jobNumber,
          warrantyDaysLeft: Math.max(0, daysLeft),
          holdAmount: warrantyHold?.holdAmount || payment?.warrantyHoldAmount || payment?.holdAmount || 0,
          complaintStatus: complaintStatus,
          complaintDetails: complaintDetails,
          location: {
            city: job.city || "",
            state: job.state || "",
          },
          dealer: {
            businessName: job.dealer?.dealer?.businessName || "N/A",
          },
        };
      });

    return NextResponse.json({ jobs: warrantyJobs });
  } catch (error: any) {
    console.error("Error fetching warranty jobs:", error);
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
      stack: error?.stack,
    });
    
    // Return a more detailed error response
    const errorMessage = error?.message || "Unknown error occurred";
    const errorCode = error?.code || "UNKNOWN_ERROR";
    
    return NextResponse.json(
      { 
        error: "Failed to fetch warranty jobs",
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined,
        code: process.env.NODE_ENV === "development" ? errorCode : undefined,
      },
      { status: 500 }
    );
  }
}




