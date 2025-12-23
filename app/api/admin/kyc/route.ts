import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email || "" },
      select: { role: true },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");

    // Fetch technicians and dealers with KYC data using MongoDB native client
    const { MongoClient, ObjectId } = await import("mongodb");
    const client = new MongoClient(process.env.DATABASE_URL!);
    
    const applications: any[] = [];
    
    try {
      await client.connect();
      const db = client.db();
      
      // Fetch technicians with KYC data
      const technicians = await db.collection("Technician").find({}).toArray();
      
      for (const tech of technicians) {
        const hasKYC = tech.kycAadhaarFront || tech.kycPanImage || tech.kycAddressImage || tech.kycLivePhotoImage;
        if (!hasKYC) continue;
        
        // Get user details
        const user = await prisma.user.findUnique({
          where: { id: tech.userId },
          select: { id: true, name: true, email: true, role: true },
        });
        
        if (!user) continue;
        
        // Determine overall KYC status
        const aadhaarStatus = tech.kycAadhaarStatus || "PENDING";
        const panStatus = tech.kycPanStatus || "PENDING";
        const addressStatus = tech.kycAddressStatus || "PENDING";
        const livePhotoStatus = tech.kycLivePhotoStatus || "PENDING";
        
        // Overall status: if all are VERIFIED, then APPROVED, else if any REJECTED then REJECTED, else PENDING
        let overallStatus = "PENDING";
        if (aadhaarStatus === "VERIFIED" && panStatus === "VERIFIED" && addressStatus === "VERIFIED" && livePhotoStatus === "VERIFIED") {
          overallStatus = "APPROVED";
        } else if (aadhaarStatus === "REJECTED" || panStatus === "REJECTED" || addressStatus === "REJECTED" || livePhotoStatus === "REJECTED") {
          overallStatus = "REJECTED";
        }
        
        // Apply status filter
        if (status && status !== "all") {
          if (status === "APPROVED" && overallStatus !== "APPROVED") continue;
          if (status === "REJECTED" && overallStatus !== "REJECTED") continue;
          if (status === "PENDING" && overallStatus !== "PENDING") continue;
        }
        
        // Build documents array
        const documents: any[] = [];
        if (tech.kycAadhaarFront) {
          documents.push({ type: "Aadhaar Front", url: tech.kycAadhaarFront, verified: aadhaarStatus === "VERIFIED" });
        }
        if (tech.kycAadhaarBack) {
          documents.push({ type: "Aadhaar Back", url: tech.kycAadhaarBack, verified: aadhaarStatus === "VERIFIED" });
        }
        if (tech.kycPanImage) {
          documents.push({ type: "PAN Card", url: tech.kycPanImage, verified: panStatus === "VERIFIED" });
        }
        if (tech.kycAddressImage) {
          documents.push({ type: "Address Proof", url: tech.kycAddressImage, verified: addressStatus === "VERIFIED" });
        }
        if (tech.kycLivePhotoImage) {
          documents.push({ type: "Live Photo", url: tech.kycLivePhotoImage, verified: livePhotoStatus === "VERIFIED" });
        }
        
        applications.push({
          id: tech._id.toString(),
          userId: tech.userId.toString(),
          userName: user.name || tech.fullName || "Unknown",
          userRole: "TECHNICIAN",
          userEmail: user.email || tech.email || "",
          status: overallStatus,
          documents,
          submittedAt: tech.kycSubmittedAt || tech.updatedAt || tech.createdAt || new Date(),
          reviewedAt: tech.kycReviewedAt,
          reviewedBy: tech.kycReviewedBy,
          rejectionReason: tech.kycAadhaarRejectionReason || tech.kycPanRejectionReason || tech.kycAddressRejectionReason || tech.kycLivePhotoRejectionReason,
        });
      }
      
      // Fetch dealers with KYC data (if dealers also have KYC)
      // Similar logic can be added here for dealers if needed
      
    } finally {
      await client.close();
    }

    const pending = applications.filter((a) => a.status === "PENDING").length;
    const approved = applications.filter((a) => a.status === "APPROVED").length;
    const rejected = applications.filter((a) => a.status === "REJECTED").length;

    return NextResponse.json({
      applications: applications.sort((a, b) => 
        new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      ),
      stats: {
        pending,
        approved,
        rejected,
      },
    });
  } catch (error: any) {
    console.error("Error fetching KYC applications:", error);
    return NextResponse.json(
      { error: "Failed to fetch KYC applications", details: error.message },
      { status: 500 }
    );
  }
}

