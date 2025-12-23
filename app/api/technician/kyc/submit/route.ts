import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
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

    // Check if all required documents are uploaded
    const hasAadhaarFront = !!technician.kycAadhaarFront;
    const hasAadhaarBack = !!technician.kycAadhaarBack;
    const hasPan = !!technician.kycPanImage;
    const hasAddress = !!technician.kycAddressImage;
    const hasLivePhoto = !!technician.kycLivePhotoImage;

    if (!hasAadhaarFront || !hasAadhaarBack || !hasPan || !hasAddress || !hasLivePhoto) {
      return NextResponse.json(
        { 
          error: "Please upload all required documents before submitting",
          missing: {
            aadhaarFront: !hasAadhaarFront,
            aadhaarBack: !hasAadhaarBack,
            pan: !hasPan,
            address: !hasAddress,
            livePhoto: !hasLivePhoto,
          }
        },
        { status: 400 }
      );
    }

    // Update all KYC statuses to PENDING (awaiting admin verification)
    const clientUpdate = new MongoClient(process.env.DATABASE_URL!);
    try {
      await clientUpdate.connect();
      const dbUpdate = clientUpdate.db();
      await dbUpdate.collection("Technician").updateOne(
        { _id: new ObjectId(technicianRecord.id) },
        {
          $set: {
            kycAadhaarStatus: "PENDING",
            kycPanStatus: "PENDING",
            kycAddressStatus: "PENDING",
            kycLivePhotoStatus: "PENDING",
            kycSubmittedAt: new Date(),
          },
        }
      );
    } finally {
      await clientUpdate.close();
    }

    return NextResponse.json({
      success: true,
      message: "KYC submitted successfully. Your documents are pending admin verification.",
    });
  } catch (error) {
    console.error("Error submitting KYC:", error);
    return NextResponse.json(
      { error: "Failed to submit KYC" },
      { status: 500 }
    );
  }
}
