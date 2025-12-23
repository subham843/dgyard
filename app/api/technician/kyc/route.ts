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

    // First get technician ID from Prisma
    const technicianRecord = await prisma.technician.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!technicianRecord) {
      return NextResponse.json(
        { error: "Technician profile not found" },
        { status: 404 }
      );
    }

    // Fetch technician with KYC fields using MongoDB native client
    const { MongoClient, ObjectId } = await import("mongodb");
    const client = new MongoClient(process.env.DATABASE_URL!);
    
    let technician: any;
    try {
      await client.connect();
      const db = client.db();
      technician = await db.collection("Technician").findOne({
        _id: new ObjectId(technicianRecord.id),
      });
    } finally {
      await client.close();
    }

    if (!technician) {
      return NextResponse.json(
        { error: "Technician profile not found" },
        { status: 404 }
      );
    }

    // Get KYC document URLs and statuses from technician record
    const kyc = {
      aadhaarCard: {
        front: technician.kycAadhaarFront || undefined,
        back: technician.kycAadhaarBack || undefined,
        status: technician.kycAadhaarStatus || (technician.kycAadhaarFront && technician.kycAadhaarBack ? "PENDING" : "PENDING"),
        rejectionReason: technician.kycAadhaarRejectionReason || undefined,
      },
      panCard: {
        image: technician.kycPanImage || undefined,
        status: technician.kycPanStatus || (technician.kycPanImage ? "PENDING" : "PENDING"),
        rejectionReason: technician.kycPanRejectionReason || undefined,
      },
      addressProof: {
        image: technician.kycAddressImage || undefined,
        status: technician.kycAddressStatus || (technician.kycAddressImage ? "PENDING" : "PENDING"),
        rejectionReason: technician.kycAddressRejectionReason || undefined,
      },
      livePhoto: {
        image: technician.kycLivePhotoImage || undefined,
        status: technician.kycLivePhotoStatus || (technician.kycLivePhotoImage ? "PENDING" : "PENDING"),
        rejectionReason: technician.kycLivePhotoRejectionReason || undefined,
      },
      overallStatus: technician.isKycCompleted ? "VERIFIED" : "PENDING",
    };

    return NextResponse.json({ kyc });
  } catch (error) {
    console.error("Error fetching KYC:", error);
    return NextResponse.json(
      { error: "Failed to fetch KYC data" },
      { status: 500 }
    );
  }
}


